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
def fetch_all_instances_for_project(request):
    project_id = request.data.get('project_id')
    zones = request.data.get('zones')
    user_email = request.data.get('user_email')

    try:
        vault_details_list = VaultDetails.objects.filter(user__email=user_email)

        if not vault_details_list:
            return Response("Vault details not found for this user", status=status.HTTP_404_NOT_FOUND)

        instances_data = []
        project_zone_combinations = set()  
        for vault_details in vault_details_list:
            vault_token = authenticate_userpass(vault_details.vault_username, vault_details.vault_password)

            if vault_token:
                secret_data = fetch_vault_secret(project_id, vault_token, vault_details.secret_path)
                secret_project_id = secret_data.get('project_id')

                if secret_project_id == project_id:
                    for zone in zones:
                        # print(zone)
                        project_zone_combination = (secret_project_id, zone)
                        if project_zone_combination not in project_zone_combinations:
                            try:
                                instances = fetch_instances(project_id, zone, secret_data, vault_token)
                                if instances:
                                    instances_data.extend(instances)
                                project_zone_combinations.add(project_zone_combination)
                            except PermissionDenied:
                                return Response('Billing issue: 403 Forbidden', status=status.HTTP_403_FORBIDDEN)

        filtered_instances_data = [data for data in instances_data if not isinstance(data, str)]

        if filtered_instances_data:
            response_data = {'status': 'success', 'instances': filtered_instances_data}
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response({'status': 'error', 'message': 'No instances found in the specified project and zones'}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
##-------------------------------------fetch single zone instances-------------------------------------------------##

@api_view(['POST'])
def fetch_instances_for_project_zone(request):
    project_id = request.data.get('project_id')
    zone = request.data.get('zone')
    user_email = request.data.get('user_email')

    try:
        vault_details_list = VaultDetails.objects.filter(user__email=user_email)

        if not vault_details_list:
            return Response("Vault details not found for this user", status=status.HTTP_404_NOT_FOUND)

        instances_data = []
        project_zone_combinations = set()  # Track project and zone combinations

        for vault_details in vault_details_list:
            vault_token = authenticate_userpass(vault_details.vault_username, vault_details.vault_password)

            if vault_token:
                secret_data = fetch_vault_secret(project_id, vault_token, vault_details.secret_path)
                secret_project_id = secret_data.get('project_id')

                if secret_project_id == project_id:
                    project_zone_combination = (secret_project_id, zone)
                    if project_zone_combination not in project_zone_combinations:
                        instances = fetch_instances(project_id, zone, secret_data, vault_token)
                        if instances:
                            instances_data.extend(instances)
                        else:
                            instances_data.append("No instances found in this zone")
                        project_zone_combinations.add(project_zone_combination)

        if instances_data:
            response_data = {'status': 'success', 'instances': instances_data}
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response({'status': 'success', 'instances': []}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




def fetch_instances(project_id, zone, secret_data, vault_token):
    try:
        credentials = service_account.Credentials.from_service_account_info(secret_data)
        compute = build('compute', 'v1', credentials=credentials)

        instances = compute.instances().list(project=project_id, zone=zone).execute()

        all_instances_details = []
        for instance in instances.get('items', []):
            zone_url = instance['zone']
            zone_parts = zone_url.split('/')
            zone = zone_parts[-1]
            project_id = zone_parts[6]
            machine_type_url = instance['machineType']
            machine_type = machine_type_url.split('/')[-1]

            network_interfaces = instance.get('networkInterfaces', [])
            parsed_network_interfaces = []

            for ni in network_interfaces:
                network_url = ni.get('network', '')
                subnetwork_url = ni.get('subnetwork', '')

                network_parts = network_url.split('/')
                network = network_parts[-1]

                subnetwork_parts = subnetwork_url.split('/')
                subnetwork = subnetwork_parts[-1]

                parsed_network_interface = {
                    'network': network,
                    'subnetwork': subnetwork,
                    'networkIP': ni.get('networkIP', ''),
                    'name': ni.get('name', ''),
                    'accessConfigs': ni.get('accessConfigs', []),
                    'fingerprint': ni.get('fingerprint', ''),
                    'stackType': ni.get('stackType', ''),
                }

                parsed_network_interfaces.append(parsed_network_interface)
                # print(parsed_network_interface)
            disks = instance.get('disks', [])
            parsed_disks = []

            for disk in disks:
                disk_source_url = disk.get('source', '')
                licenses = disk.get('licenses', [])

                disk_source_parts = disk_source_url.split('/')
                disk_source = disk_source_parts[-1]
                license_names = [license.split('/')[-1] for license in licenses]

                parsed_disk = {
                    'type': disk.get('type', ''),
                    'mode': disk.get('mode', ''),
                    'source': disk_source,
                    'deviceName': disk.get('deviceName', ''),
                    'index': disk.get('index', 0),
                    'boot': disk.get('boot', False),
                    'autoDelete': disk.get('autoDelete', False),
                    'licenses': license_names,
                    'interface': disk.get('interface', ''),
                    'guestOsFeatures': disk.get('guestOsFeatures', []),
                    'diskSizeGb': disk.get('diskSizeGb', ''),
                    'architecture': disk.get('architecture', ''),
                }

                parsed_disks.append(parsed_disk)

            instance_info = {
                'kind': instance['kind'],
                'machine_type': machine_type, 
                'status': instance['status'],
                'zone': zone,
                'project_id' : project_id,
                'description': instance['description'],
                'creationTimestamp': instance['creationTimestamp'],
                'name': instance['name'],
                'id': instance['id'],
                'canIpForward': instance['canIpForward'],
                'cpuPlatform': instance['cpuPlatform'],
                'lastStartTimestamp': instance['lastStartTimestamp'],
                'lastStopTimestamp': instance['lastStopTimestamp'],
                'shieldedInstanceIntegrityPolicy': instance['shieldedInstanceIntegrityPolicy'],
                'confidentialInstanceConfig': instance['confidentialInstanceConfig'],
                'fingerprint': instance['fingerprint'],
                'keyRevocationActionType': instance['keyRevocationActionType'],
                'labelFingerprint': instance['labelFingerprint'],
                'startRestricted': instance['startRestricted'],
                'deletionProtection': instance['deletionProtection'],
                'reservationAffinity': instance['reservationAffinity'],
                'displayDevice': instance['displayDevice'],
                'shieldedInstanceConfig': instance['shieldedInstanceConfig'],
                'tags': instance['tags'], 
                'scheduling': instance['scheduling'],
                'networkInterfaces' : parsed_network_interfaces, 
                'disks': parsed_disks,                         
                # 'metadata': instance['metadata'],
                'serviceAccounts': instance['serviceAccounts'],
                # 'selfLink': instance['selfLink'],
                
            }
            # instance_info['networkInterfaces'] = parsed_network_interfaces
            # instance_info['disks'] = parsed_disks
            # print(instance['disks'])
            all_instances_details.append(instance_info)

        return all_instances_details
    except Exception as e:
        return str(e)
    


@api_view(['POST'])
def instance_state(request):
    try:
        project_id = request.data.get('project_id')
        zone = request.data.get('zone')
        user_email = request.data.get('user_email')
        instance_name = request.data.get('instance_name')
        action = request.data.get('action')  

        vault_details_list = VaultDetails.objects.filter(user__email=user_email)

        if not vault_details_list:
            return Response("Vault details not found for this user", status=status.HTTP_404_NOT_FOUND)

        for vault_details in vault_details_list:
            vault_token = authenticate_userpass(vault_details.vault_username, vault_details.vault_password)

            if vault_token:
                secret_data = fetch_vault_secret(project_id, vault_token, vault_details.secret_path)
                secret_project_id = secret_data.get('project_id')

                if secret_project_id == project_id:
                    credentials = service_account.Credentials.from_service_account_info(secret_data)
                    compute = build('compute', 'v1', credentials=credentials)

                    instance_url = f"projects/{project_id}/zones/{zone}/instances/{instance_name}"

                    if action == 'start':
                        compute.instances().start(project=project_id, zone=zone, instance=instance_name).execute()
                    elif action == 'shutdown':
                        compute.instances().stop(project=project_id, zone=zone, instance=instance_name).execute()
                    else:
                        return Response("Invalid action. Use 'start' or 'shutdown'", status=status.HTTP_400_BAD_REQUEST)

                    return Response(f"Instance '{instance_name}' {action}ed successfully", status=status.HTTP_200_OK)

        return Response("User not authorized for this project", status=status.HTTP_403_FORBIDDEN)

    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
@api_view(['POST'])
def auto_instance_state(request):
    try:
        project_id = request.data.get('project_id')
        zone = request.data.get('zone')
        user_email = request.data.get('user_email')
        tag_value = request.data.get('tag_value')
        action = request.data.get('action')

        vault_details_list = VaultDetails.objects.filter(user__email=user_email)

        if not vault_details_list:
            return Response("Vault details not found for this user", status=status.HTTP_404_NOT_FOUND)

        for vault_details in vault_details_list:
            vault_token = authenticate_userpass(vault_details.vault_username, vault_details.vault_password)

            if vault_token:
                secret_data = fetch_vault_secret(project_id, vault_token, vault_details.secret_path)
                secret_project_id = secret_data.get('project_id')

                if secret_project_id == project_id:
                    credentials = service_account.Credentials.from_service_account_info(secret_data)
                    compute = build('compute', 'v1', credentials=credentials)

                    request = compute.instances().list(project=project_id, zone=zone)
                    response = request.execute()

                    instances = response.get('items', [])

                    for instance in instances:
                        instance_name = instance['name']

                        instance_tags = instance.get('tags', {}).get('items', [])

                        if tag_value in instance_tags:
                            if action == 'start':
                                compute.instances().start(project=project_id, zone=zone, instance=instance_name).execute()
                            elif action == 'shutdown':
                                compute.instances().stop(project=project_id, zone=zone, instance=instance_name).execute()
                            else:
                                return Response("Invalid action. Use 'start' or 'shutdown'", status=status.HTTP_400_BAD_REQUEST)

                    return Response(f"Instances with tag '{tag_value}' {action}ed successfully", status=status.HTTP_200_OK)

        return Response("User not authorized for this project", status=status.HTTP_403_FORBIDDEN)

    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
