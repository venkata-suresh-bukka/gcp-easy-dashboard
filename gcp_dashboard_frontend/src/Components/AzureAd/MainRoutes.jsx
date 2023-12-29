import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../LoggedIn/Home";
import VaultPage from "../VaultComponents/VaultPage";
import CloudFunctions from "../GcpServices/CloudFunctions/CloudFunctions";
import CloudRunServices from "../GcpServices/CloudRun/CloudRun";
import CloudStorage from "../GcpServices/CloudStorage/CloudStorage";
import InstanceDetailsPage from "../GcpServices/ComputeInstances/Level2/InstanceDataPage";
import CloudFunctionDetailsPage from "../GcpServices/CloudFunctions/Level2/CloudFunctionsDataPage";
import CloudRunDetailsPage from "../GcpServices/CloudRun/Level2/CloudRunDataPage";
import CloudStorageDataPage from "../GcpServices/CloudStorage/Level2/CloudStorageDataPage";

const Main = (props) => {
  const local_account_id = props.graphData.id
  const email = props.graphData.mail
  return (
    <Routes>
      <Route path="/" element={<Home email={email}/>} />
      <Route path="/vault" element={<VaultPage />} />
      <Route path="/cloud_functions" element={<CloudFunctions email={email}/>} />
      <Route path="/cloud_run" element={<CloudRunServices email={email}/>} />
      <Route path="/compute_engine" element={<Home email={email}/>} />
      <Route path="/cloud_storage" element={<CloudStorage email={email}/>} />

      {/* level 2 Routes*/}
      <Route path="/compute_engine/instance/:instanceName" element={<InstanceDetailsPage />} />
      <Route path="/cloud_functions/function/:cloudFunction" element={<CloudFunctionDetailsPage />} />
      <Route path="/cloud_run_details" element={<CloudRunDetailsPage />} />
      <Route path="/cloud_storage_bucket" element={<CloudStorageDataPage />} />

      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes>
  );
};

export default Main;
