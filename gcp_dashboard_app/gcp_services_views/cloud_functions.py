from googleapiclient import discovery
from ..models import User, VaultDetails
from ..serializers import VaultDetailsSerializer
import requests
import json
import hvac
from google.oauth2 import service_account
from googleapiclient.discovery import build
from django import forms
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from collections import defaultdict
from rest_framework import status
from google.auth.exceptions import DefaultCredentialsError
from google.api_core.exceptions import NotFound
from googleapiclient.errors import HttpError
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.decorators import login_required
from googleapiclient import discovery

#-------------------------------------------Common functions--------------------------------------
def authenticate_userpass(username, password):
    vault_url = 'http://localhost:8200'

    auth_data = {
        'password': password,
    }

    response = requests.post(f'{vault_url}/v1/auth/userpass/login/{username}', json=auth_data)

    if response.status_code == 200:
        auth_data = json.loads(response.text)
        vault_token = auth_data.get('auth', {}).get('client_token')

        if vault_token:
            return vault_token
        else:
            return None  
    else:
        return None 
    

def fetch_vault_secret(project_id, vault_token, secret_path):
    try:
        vault_client = hvac.Client(url='http://localhost:8200', token=vault_token)

        # Construct the secret path based on the project_id
        vault_path = secret_path
        # print(vault_path)
        response = vault_client.secrets.kv.v2.read_secret_version(path=vault_path)
        secret_data = response['data']['data']
        # print(response['data'])

        return secret_data
    except Exception as e:
        return {}
    
def get_project_name(vault_token, secret_path):
    try:
        vault_client = hvac.Client(url='http://localhost:8200', token=vault_token)
        vault_path = secret_path

        response = vault_client.secrets.kv.v2.read_secret_version(path=vault_path)
        service_account_key = response['data']['data']

        project_id = service_account_key.get('project_id')
        return project_id if project_id else None
    except Exception as e:
        return None
    

def get_gcp_regions(project_id, vault_token, secret_path):
    try:
        vault_client = hvac.Client(url='http://localhost:8200', token=vault_token)
        response = vault_client.secrets.kv.v2.read_secret_version(path=secret_path)
        user_secret = response['data']['data']

        credentials = service_account.Credentials.from_service_account_info(user_secret)

        compute = build('compute', 'v1', credentials=credentials)

        # Fetch regions for the project
        region_response = compute.regions().list(project=project_id).execute()

        region_names = [region['name'] for region in region_response.get('items', [])]

        # Return only regions
        return {
            'regions': region_names,
        }
    except Exception as e:
        return {'regions': []}

@api_view(['POST'])
def get_all_gcp_regions(request):
    print(request)
    user_email = request.data.get('user_email')

    try:
        # Fetch User based on user_email
        user = User.objects.get(email=user_email)

        # Fetch all VaultDetails for the user
        vault_details_list = VaultDetails.objects.filter(user=user)

        for vault_details in vault_details_list:
            # Authenticate with Vault using vault_username and vault_password
            vault_token = authenticate_userpass(vault_details.vault_username, vault_details.vault_password)

            if vault_token:
                project_id = get_project_name(vault_token, vault_details.secret_path)

                if project_id:
                    # Fetch billing info using project_id and Vault credentials
                    secret_data = fetch_vault_secret(project_id, vault_token, vault_details.secret_path)

                    billing_status = fetch_billing_info(project_id, secret_data)

                    if billing_status == "True":
                        # Fetch GCP regions using the project_id and Vault credentials
                        regions = get_gcp_regions(project_id, vault_token, vault_details.secret_path)
                        login_status = 'pass'
                        response_data = {'login_status': login_status, 'regions': regions, 'project_id': project_id}
                        return Response(response_data, status=status.HTTP_200_OK)
                else:
                    return Response('Failed to fetch GCP project_id, re-check secret path.', status=status.HTTP_400_BAD_REQUEST)

        return Response('No VaultDetails with billing enabled found for this user.', status=status.HTTP_404_NOT_FOUND)

    except User.DoesNotExist:
        return Response("User not found", status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 

def fetch_billing_info(project_id, secret_data):
    try:
        # Authenticate with GCP using service account credentials
        credentials = service_account.Credentials.from_service_account_info(secret_data)

        # Build the Cloud Billing API service
        billing_service = build("cloudbilling", "v1", credentials=credentials)

        # Fetch billing information for the project
        billing_info = billing_service.projects().getBillingInfo(name=f"projects/{project_id}").execute()
        billing_enabled = billing_info.get("billingEnabled", False)

        if billing_enabled:
            return "True"
        else:
            return "False"

    except HttpError as e:
        if e.resp.status == 403:
            reason = "SERVICE_DISABLED"
            return reason
        else:
            return {"reason": "ERROR", "message": str(e)}
    except Exception as e:
        return {"reason": "ERROR", "message": str(e)}
    
@api_view(['POST'])
def fetch_cloud_functions(request):
    project_id = request.data.get('project_id')
    zone = request.data.get('region')
    user_email = request.data.get('user_email')

    try:
        # Fetch VaultDetails for the user based on user_email
        vault_details_list = VaultDetails.objects.filter(user__email=user_email)

        if not vault_details_list:
            return Response("Vault details not found for this user", status=status.HTTP_404_NOT_FOUND)

        functions_deta = []
        project_zone_combinations = set()  # Track project and zone combinations

        for vault_details in vault_details_list:
            vault_token = authenticate_userpass(vault_details.vault_username, vault_details.vault_password)

            if vault_token:
                # Fetch project_id from the Vault secret
                secret_data = fetch_vault_secret(project_id, vault_token, vault_details.secret_path)
                secret_project_id = secret_data.get('project_id')

                # Compare the fetched project_id with the POST request project_id
                if secret_project_id == project_id:
                    # Check if this project and zone combination has already been processed
                    project_zone_combination = (secret_project_id, zone)
                    if project_zone_combination not in project_zone_combinations:
                        # Fetch instances in the specified zone using Vault credentials
                        functions_details = fetch_functions(project_id, zone, secret_data, vault_token)
                        if functions_details:
                            functions_deta.extend(functions_details)
                        else:
                            functions_deta.append("No functions found in this zone")
                        project_zone_combinations.add(project_zone_combination)

        if functions_deta:
            response_data = {'status': 'success', 'instances': functions_deta}
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response({'status': 'success', 'functions': []}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from google.auth.transport.requests import Request
from subprocess import check_output, CalledProcessError

def fetch_functions(project_id, zone, secret_data, vault_token):
    try:
        functions_endpoint = f"https://cloudfunctions.googleapis.com/v2beta/projects/{project_id}/locations/{zone}/functions"
        credentials = service_account.Credentials.from_service_account_info(secret_data,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],)
        if not credentials.valid:
            credentials.refresh(Request())
        headers = {
            "Authorization": f"Bearer {credentials.token}",
        }
        response = requests.get(functions_endpoint, headers=headers)
        functions_details = []
        if response.status_code == 200:
            functions_list = response.json()
            print(functions_list)
            for function in functions_list.get("functions", []):
                function_name = function['name'].split('/')[-1]

                # Create a dictionary with common details
                instance_info = {
                    'function_name': function_name,
                    'state': function['state'],
                    # 'response_data': function,
                    
                }

                # Include additional details for successful deployment
                if function['state'] == 'ACTIVE':
                    runtime = function['buildConfig']['runtime']
                    entrypoint = function['buildConfig']['entryPoint']
                    bucket = function['buildConfig']['source']['storageSource']['bucket']
                    environment = function['environment']
                    available_memory = function['serviceConfig']['availableMemory']
                    available_cpu = function['serviceConfig']['availableCpu']
                    trigger_url = function['url']
                    timeout_seconds = function['serviceConfig'].get('timeoutSeconds', None)
                    max_instance_count = function['serviceConfig'].get('maxInstanceCount', None)
                    ingress_settings = function['serviceConfig'].get('ingressSettings', None)
                    service_account_email = function['serviceConfig'].get('serviceAccountEmail', None)
                    all_traffic_on_latest_revision = function['serviceConfig'].get('allTrafficOnLatestRevision', None)
                    revision = function['serviceConfig'].get('revision', None)
                    max_instance_request_concurrency = function['serviceConfig'].get('maxInstanceRequestConcurrency', None)
                    update_time = function.get('updateTime', None)
                    labels = function.get('labels', None)

                    # Include additional details for successful deployment
                    instance_info.update({
                        'runtime': runtime,
                        'entrypoint': entrypoint,
                        'bucket': bucket,
                        'environment': environment,
                        'available_memory': available_memory,
                        'available_cpu': available_cpu,
                        'trigger_url': trigger_url,
                        'timeout_seconds': timeout_seconds,
                        'max_instance_count': max_instance_count,
                        'ingress_settings': ingress_settings,
                        'service_account_email': service_account_email,
                        'all_traffic_on_latest_revision': all_traffic_on_latest_revision,
                        'revision': revision,
                        'max_instance_request_concurrency': max_instance_request_concurrency,
                        'update_time': update_time,
                        'labels': labels,
                    })

                # Include error messages only for failed deployments
                elif function['state'] == 'FAILED':
                    state_messages = function.get('stateMessages', [])
                    error_messages = [msg.get('message', '') for msg in state_messages if msg.get('severity') == 'ERROR']
                    instance_info['error_messages'] = error_messages

                functions_details.append(instance_info)
                    

        return functions_details
    except Exception as e:
        return str(e)
