from django.urls import path, include
from . import views
from django.conf import settings
from django.conf.urls.static import static
from .gcp_services_views import cloud_functions
from .gcp_services_views import cloud_run, compute_instances, cloud_storage


urlpatterns = [
    # path('api/fetch_gcp_zones/', views.get_all_gcp_zones),
    path('api/fetch_gcp_zones/', views.get_all_gcp_zones),

    
    path('api/get_user_gcp_projects/', views.get_all_gcp_projects_for_user),
    path('api/create_add_user_vault/', views.create_user_and_vault_details, name='create_user_and_vault_details'),
    path('api/delete_vault_data/', views.delete_vault_data),

    # Gcp Services Details in all Regions Api's
    path('api/fetch_all_instances_project/', compute_instances.fetch_all_instances_for_project),

    # Gcp Services Details in single zone Api's
    path('api/get_instance_details/', compute_instances.fetch_instances_for_project_zone),
    path('api/get_cloud_functions/', cloud_functions.fetch_cloud_functions),
    path('api/get_cloud_run_services/', cloud_run.fetch_cloud_run_services),
    path('api/get_all_gcp_regions/', cloud_functions.get_all_gcp_regions),
    path('api/change_instance_state/', compute_instances.instance_state),
    path('api/auto_change_instance_state/', compute_instances.auto_instance_state),

    # --------------------------------------------------Cloud Storage----------------- #
    path('api/fetch_cloud_storage/', cloud_storage.fetch_all_buckets_for_project),
    
   
    

]