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
from ..models import User, VaultDetails
from ..serializers import VaultDetailsSerializer
import asyncio
from google.auth.exceptions import DefaultCredentialsError
from google.api_core.exceptions import NotFound
from googleapiclient.errors import HttpError
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.decorators import login_required
from googleapiclient import discovery


##-------------------------------------vault auth functions-------------------------------------------------##

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
    
##-------------------------------------fetch all instances-------------------------------------------------##
@api_view(['POST'])
def fetch_all_buckets_for_project(request):
    project_id = request.data.get('project_id')
    user_email = request.data.get('user_email')

    try:
        # Fetch VaultDetails for the user based on user_email
        vault_details_list = VaultDetails.objects.filter(user__email=user_email)

        if not vault_details_list:
            return Response("Vault details not found for this user", status=status.HTTP_404_NOT_FOUND)

        buckets_data = []
        project_combinations = set()  # Track project and zone combinations

        for vault_details in vault_details_list:
            vault_token = authenticate_userpass(vault_details.vault_username, vault_details.vault_password)

            if vault_token:
                # Fetch project_id from the Vault secret
                secret_data = fetch_vault_secret(project_id, vault_token, vault_details.secret_path)
                secret_project_id = secret_data.get('project_id')

                # Compare the fetched project_id with the POST request project_id
                if secret_project_id == project_id:
                    # Check if this project and zone combination has already been processed
                    project_combination = (secret_project_id,)
                    if project_combination not in project_combinations:
                        # Fetch buckets in the specified project using Vault credentials
                        buckets = fetch_buckets(project_id, secret_data, vault_token)
                        if buckets:
                            buckets_data.extend(buckets)
                        else:
                            buckets_data.append("No buckets found in this project")
                        project_combinations.add(project_combination)

        if buckets_data:
            response_data = {'status': 'success', 'buckets': buckets_data}
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response({'status': 'error', 'message': 'No buckets found in the specified project'}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def fetch_buckets(project_id, secret_data, vault_token):
    try:
        credentials = service_account.Credentials.from_service_account_info(secret_data)
        storage = discovery.build('storage', 'v1', credentials=credentials)

        buckets = storage.buckets().list(project=project_id).execute()

        bucket_details = []
        for bucket in buckets.get('items', []):
            print(bucket)
            bucket_name = bucket['name']
            bucket_location = bucket.get('location', 'N/A')
            storage_class = bucket['storageClass']
            location_type = bucket['locationType']

            bucket_info = {
                'kind': 'storage#bucket',
                'name': bucket_name,
                'projectNumber': bucket['projectNumber'],
                'metageneration': bucket['metageneration'],
                'location': bucket_location,
                'storageClass': storage_class,
                'etag': bucket['etag'],
                'timeCreated': bucket['timeCreated'],
                'updated': bucket['updated'],
                'iamConfiguration': {
                    'bucketPolicyOnly': {
                        'enabled': bucket['iamConfiguration']['bucketPolicyOnly']['enabled'],
                        'lockedTime': bucket['iamConfiguration']['bucketPolicyOnly']['lockedTime'],
                    },
                    'uniformBucketLevelAccess': {
                        'enabled': bucket['iamConfiguration']['uniformBucketLevelAccess']['enabled'],
                        'lockedTime': bucket['iamConfiguration']['uniformBucketLevelAccess']['lockedTime'],
                    },
                    'publicAccessPrevention': bucket['iamConfiguration']['publicAccessPrevention'],
                },
                'locationType': location_type,
                'rpo': bucket.get('rpo', 'DEFAULT'),  # Assuming rpo is a key in the bucket dictionary
            }
            bucket_details.append(bucket_info)


        return bucket_details
    except Exception as e:
        return str(e)



    
    
