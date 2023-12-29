from googleapiclient import discovery
from ..models import User, VaultDetails
from ..serializers import VaultDetailsSerializer
import requests
import json
import hvac
from google.oauth2 import service_account
from googleapiclient.discovery import build
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from googleapiclient.errors import HttpError
from django.contrib.auth.decorators import login_required
from googleapiclient import discovery
from google.auth.transport.requests import Request



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
def fetch_cloud_run_services(request):
    project_id = request.data.get('project_id')
    region = request.data.get('region')
    user_email = request.data.get('user_email')

    try:
        # Fetch VaultDetails for the user based on user_email
        vault_details_list = VaultDetails.objects.filter(user__email=user_email)

        if not vault_details_list:
            return Response("Vault details not found for this user", status=status.HTTP_404_NOT_FOUND)

        run_services_deta = []
        project_region_combinations = set()  # Track project and region combinations

        for vault_details in vault_details_list:
            vault_token = authenticate_userpass(vault_details.vault_username, vault_details.vault_password)

            if vault_token:
                # Fetch project_id from the Vault secret
                secret_data = fetch_vault_secret(project_id, vault_token, vault_details.secret_path)
                secret_project_id = secret_data.get('project_id')

                # Compare the fetched project_id with the POST request project_id
                if secret_project_id == project_id:
                    # Check if this project and region combination has already been processed
                    project_region_combination = (secret_project_id, region)
                    if project_region_combination not in project_region_combinations:
                        # Fetch Cloud Run services in the specified region using Vault credentials
                        run_services_details = fetch_cloud_run_data(project_id, region, secret_data, vault_token)
                        if run_services_details:
                            run_services_deta.extend(run_services_details)
                        else:
                            run_services_deta.append("No Cloud Run services found in this region")
                        project_region_combinations.add(project_region_combination)

        if run_services_deta:
            response_data = {'status': 'success', 'services': run_services_deta}
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response({'status': 'success', 'services': []}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


def fetch_cloud_run_data(project_id, region, secret_data, vault_token):
    try:
        cloud_run_endpoint = f"https://run.googleapis.com/apis/serving.knative.dev/v1/namespaces/{project_id}/services"
        
        credentials = service_account.Credentials.from_service_account_info(secret_data,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],)
        
        if not credentials.valid:
            credentials.refresh(Request())
        
        headers = {
            "Authorization": f"Bearer {credentials.token}",
        }
        
        response = requests.get(cloud_run_endpoint, headers=headers)
        
        cloud_run_services = []
        if response.status_code == 200:
            services_list = response.json()
            for service in services_list.get("items", []):
                print(service)
                service_info = {}  # Initialize an empty dictionary for each service
                service_url = service['status']['url']
                
                # Extract metadata details
                metadata = service.get('metadata', {})
                labels = metadata.get('labels', {})
                annotations = metadata.get('annotations', {})

                # Extract spec details
                spec = service.get('spec', {})
                template = spec.get('template', {})
                containers = template.get('spec', {}).get('containers', [{}])

                service_info.update({
                    'kind': service.get('kind'),
                    'service_name': metadata.get('name'),
                    'service_url': service_url,
                    'generation': metadata.get('generation'),
                    'labels': labels,
                    'goog-cloudfunctions-runtime': labels.get('goog-cloudfunctions-runtime'),
                    'cloud.googleapis.com/location': labels.get('cloud.googleapis.com/location'),
                    'run.googleapis.com/ingress': annotations.get('run.googleapis.com/ingress'),
                    'run.googleapis.com/ingress-status': annotations.get('run.googleapis.com/ingress-status'),
                    'creationTimestamp': metadata.get('creationTimestamp'),
                    'cloudfunctions.googleapis.com/trigger-type': annotations.get('cloudfunctions.googleapis.com/trigger-type') or spec.get('template', {}).get('metadata', {}).get('annotations', {}).get('cloudfunctions.googleapis.com/trigger-type'),
                    # 'autoscaling.knative.dev/maxScale': annotations.get('autoscaling.knative.dev/maxScale'),
                    # 'run.googleapis.com/startup-cpu-boost': annotations.get('run.googleapis.com/startup-cpu-boost'),
                    'containerConcurrency': template.get('spec', {}).get('containerConcurrency'),
                    'timeoutSeconds': template.get('spec', {}).get('timeoutSeconds'),
                    'serviceAccountName': template.get('spec', {}).get('serviceAccountName'),
                    'limits': containers[0].get('resources', {}).get('limits', {}),
                    'cpu': containers[0].get('resources', {}).get('limits', {}).get('cpu'),
                    'memory': containers[0].get('resources', {}).get('limits', {}).get('memory'),
                    'ports': containers[0].get('ports'),
                    'name': containers[0].get('ports', [{}])[0].get('name'),
                    'containerPort': containers[0].get('ports', [{}])[0].get('containerPort'),
                    'startupProbe': containers[0].get('startupProbe', {}),
                    'traffic': spec.get('traffic'),
                    # 'latestRevision': spec.get('status', {}).get('latestReadyRevisionName'),
                    'conditions': spec.get('status', {}).get('conditions', []),
                    # 'address': spec.get('status', {}).get('address', {}).get('url'),
                })

                cloud_run_services.append(service_info)

            return cloud_run_services

    except Exception as e:
        return str(e)