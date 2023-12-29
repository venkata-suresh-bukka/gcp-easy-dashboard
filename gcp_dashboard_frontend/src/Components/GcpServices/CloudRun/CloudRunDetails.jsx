import './CloudRunDetails.css'; // You can create a separate CSS file for styling

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CloudRunDetails.css'; // You can create a separate CSS file for styling

function CloudRunServicesList({ cloudRunServices }) {
  const navigate = useNavigate();

  const handleServiceClick = (service) => {
    // Navigate to CloudRunDetailsPage with the service data
    navigate(`/cloud_run_details?data=${encodeURIComponent(JSON.stringify(service))}`);
  };

  return (
    <div>
      <h2>Cloud Run Service Details</h2>
      {cloudRunServices.length === 0 ? (
        <p>No Cloud Run services found.</p>
      ) : (
        <div className='cloud-run-services-card-container'>
          {cloudRunServices.map((service, index) => (
            <div key={index} className="cloud-run-services-card" onClick={() => handleServiceClick(service)}>
              <p className='cloud-run-data-value'><span className='cloud-run-data-key'>Service Name:</span> {service.service_name}</p>
              <p className='cloud-run-data-value'><span className='cloud-run-data-key'>Service URL:</span> {service.service_url}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CloudRunServicesList;
