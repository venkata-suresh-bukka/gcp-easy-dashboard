from django.db import models

class User(models.Model):
    email = models.EmailField(unique=True)

class VaultDetails(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vault_username = models.CharField(max_length=255)
    vault_password = models.CharField(max_length=255)
    secret_path = models.CharField(max_length=255)
