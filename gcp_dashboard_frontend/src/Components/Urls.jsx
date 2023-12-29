function URL() {
    return "http://127.0.0.1:8000/";
  }
  
  export function URLs() {
    const urls = {
      FetchGcpZones: URL() + "api/fetch_gcp_zones/",
      CreateAddVault: URL() + "api/create_add_user_vault/",
      GetAllGcpProjectsForUser: URL() + "api/get_user_gcp_projects/",
      FetchInstanceDetails : URL() + "api/get_instance_details/",

      FetchAllInstancesForProject: URL() + "api/fetch_all_instances_project/",
      DeleteVaultDetails: URL() + "api/delete_vault_data/",

      FetchGcpRegions : URL() + "api/get_all_gcp_regions/",
      FetchCloudFunctionDetails: URL() + "api/get_cloud_functions/",
      FetchCloudRunServices : URL() + "api/get_cloud_run_services/",
      ChangeInstanceState : URL() + "api/change_instance_state/",

      FetchCloudStorageDetails : URL() + "api/fetch_cloud_storage/",
    };
    return urls;
  }
  