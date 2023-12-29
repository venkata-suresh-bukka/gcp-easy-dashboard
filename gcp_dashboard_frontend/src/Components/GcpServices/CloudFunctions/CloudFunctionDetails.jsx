import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CloudFunctionsDetails.css';

function CloudFunctionsList({ cloudFunctions }) {
  const navigate = useNavigate();

  const handleCloudFunctionClick = (cloudFunction) => {
    // Serialize the cloud function data to pass through the URL
    const serializedCloudFunction = encodeURIComponent(JSON.stringify(cloudFunction));
  
    // Redirect to /cloud_functions/function/:functionName with cloud function data
    navigate(`/cloud_functions/function/${cloudFunction.function_name}?data=${serializedCloudFunction}`);
  };

  return (
    <div>
      <h2>Cloud Functions Details</h2>
      {cloudFunctions.length === 0 ? (
        <p>No cloud functions found.</p>
      ) : (
        <div className='cloud-functions-card-container'>
          {cloudFunctions.map((cloudFunction, index) => (
            <div key={index} className="cloud-functions-card" onClick={() => handleCloudFunctionClick(cloudFunction)}>
              <p className='function-data-value' onClick={() => handleCloudFunctionClick(cloudFunction)}><span className='function-data-key'>Function Name:</span> {cloudFunction.function_name}</p>
              <p className='function-data-value' onClick={() => handleCloudFunctionClick(cloudFunction)}><span className='function-data-key'>State:</span> {cloudFunction.state}</p>            
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CloudFunctionsList;



