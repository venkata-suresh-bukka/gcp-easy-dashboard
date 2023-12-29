from rest_framework import serializers
from .models import VaultDetails

class VaultDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaultDetails
        fields = ['vault_username', 'vault_password', 'secret_key']
