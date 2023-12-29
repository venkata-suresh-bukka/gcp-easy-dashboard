from django.http import JsonResponse
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
from .models import User, VaultDetails
from .serializers import VaultDetailsSerializer
import asyncio
from google.auth.exceptions import DefaultCredentialsError
from google.api_core.exceptions import NotFound
from googleapiclient.errors import HttpError
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.decorators import login_required
from googleapiclient import discovery


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

def get_project_name(vault_token, secret_path):
    # print(secret_path)
    try:
        vault_client = hvac.Client(url='http://localhost:8200', token=vault_token)
        vault_path = secret_path

        response = vault_client.secrets.kv.v2.read_secret_version(path=vault_path)
        service_account_key = response['data']['data']
        project_id = service_account_key.get('project_id')
        return project_id if project_id else None
    except Exception as e:
        return None

def get_gcp_zones(project_id, vault_token, secret_path):
    try:
        vault_client = hvac.Client(url='http://localhost:8200', token=vault_token)
        response = vault_client.secrets.kv.v2.read_secret_version(path=secret_path)
        user_secret = response['data']['data']

        credentials = service_account.Credentials.from_service_account_info(user_secret)

        compute = build('compute', 'v1', credentials=credentials)

        zones = compute.zones().list(project=project_id).execute()
        zone_names = [zone['name'] for zone in zones.get('items', [])]
        # print(zone_names)
        return zone_names
    except Exception as e:
        return []
    


@api_view(['POST'])
def create_user_and_vault_details(request):  

    if request.method == 'POST':
        user_email = request.data.get('user_email')
        vault_username = request.data.get('username')
        vault_password = request.data.get('password')
        secret_path = request.data.get('secret_path')

        try:
            user, created = User.objects.get_or_create(email=user_email)

            # Check if there is an existing VaultDetails for this user with the same username
            existing_vault_details = VaultDetails.objects.filter(user=user, vault_username=vault_username).first()

            if existing_vault_details:
                status_message = 'Vault details for this username already exist.'
                status_message = [{'status_message': status_message}]

                return Response(status_message, status=status.HTTP_409_CONFLICT)
                
            # Perform Vault validation
            vault_token = authenticate_userpass(vault_username, vault_password)

            if not vault_token:
                status_message = "Vault authentication failed"
                status_message = [{'status_message': status_message}]

                return Response(status_message, status=status.HTTP_401_UNAUTHORIZED)

            # Create a new VaultDetails entry for the user
            vault_details = VaultDetails()
            vault_details.user = user
            vault_details.vault_username = vault_username
            vault_details.vault_password = vault_password
            vault_details.secret_path = secret_path
            vault_details.save()
            return Response('Vault details inserted successfully', status=status.HTTP_200_OK)

        except Exception as e:
            return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_vault_data(request):
    user_email = request.data.get('user_email')
    vault_username = request.data.get('vault_username')
    
    try:
        vault_details = VaultDetails.objects.get(
            user__email=user_email,
            vault_username=vault_username
        )

        vault_details.delete()
        return Response({'message': 'VaultDetails deleted successfully'}, status=status.HTTP_200_OK)
    except VaultDetails.DoesNotExist:
        return Response({'message': 'VaultDetails not found'}, status=status.HTTP_NOT_FOUND)
    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_INTERNAL_SERVER_ERROR)
      

def get_actual_secret_path(vault_token,secret_path):
    vault_url = 'http://localhost:8200'
    auth_headers = {"X-Vault-Token": vault_token}
    
    
    response = requests.get(f'{vault_url}/v1/{secret_path}/metadata/{vault_token}', headers=auth_headers)
    
    if response.status_code == 200:
        secret_path_data = response.json()
        actual_secret_path = secret_path_data.get('data', {}).get('path')
        return actual_secret_path
    else:
        return None
    
    
@api_view(['POST'])
def get_all_gcp_zones(request):
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
                        # Fetch GCP zones using the project_id and Vault credentials
                        zones = get_gcp_zones(project_id, vault_token, vault_details.secret_path)
                        login_status = 'pass'
                        response_data = {'login_status': login_status, 'zones': zones, 'project_id': project_id}
                        return Response(response_data, status=status.HTTP_200_OK)
                else:
                    return Response('Failed to fetch GCP project_id, re-check secret path.', status=status.HTTP_400_BAD_REQUEST)

        return Response('No VaultDetails with billing enabled found for this user.', status=status.HTTP_404_NOT_FOUND)

    except User.DoesNotExist:
        return Response("User not found", status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(['POST'])
def get_all_gcp_projects_for_user(request):
    user_email = request.data.get('user_email')
    try:
        # Assuming you have a User model with an 'email' field
        user = User.objects.get(email=user_email)

        # Assuming you have a VaultDetails model with 'vault_username', 'vault_password', and 'secret_path' fields
        vault_details_list = VaultDetails.objects.filter(user=user)
        # print(vault_details_list)
        if not vault_details_list:
            return Response("Vault details not found for this user", status=status.HTTP_404_NOT_FOUND)

        projects_data = []

        for vault_details in vault_details_list:
            # print(f"Processing VaultDetails object {vault_details.id} for user {user.email}")
            vault_token = authenticate_userpass(vault_details.vault_username, vault_details.vault_password)
            # print(vault_token)
            if vault_token:
                project_id = get_project_name(vault_token, vault_details.secret_path)
                # print(project_id)
                secret_data = fetch_vault_secret(project_id, vault_token, vault_details.secret_path)


                if project_id:
                    # print(vault_details.secret_path)
                    # print(secret_data)
                    project_status = fetch_billing_info(project_id, secret_data)
                    projects_data.append({'project_id': project_id, 'vault_username': vault_details.vault_username, 'project_status': project_status})

        if projects_data:
            response_data = {'projects': projects_data}
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response('No GCP projects found for this user', status=status.HTTP_404_NOT_FOUND)

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



#-------------------------Fetching GCP Services Data Views------------------------------------------#
   
def fetch_vault_secret(project_id, vault_token, secret_path):
    try:
        vault_client = hvac.Client(url='http://localhost:8200', token=vault_token)

        # Construct the secret path based on the project_id
        vault_path = secret_path
        # print(vault_token)
        response = vault_client.secrets.kv.v2.read_secret_version(path=vault_path)
        secret_data = response['data']['data']
        # print(secret_data)

        return secret_data
    except Exception as e:
        return {}






