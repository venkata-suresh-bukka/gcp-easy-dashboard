import React from 'react';
import './CloudStorageDetails.css';
import { useNavigate } from 'react-router-dom';

function CloudStorageDetails({ cloudStorage }) {
  const navigate = useNavigate();

  const handleServiceClick = (service) => {
    // Navigate to CloudRunDetailsPage with the service data
    navigate(`/cloud_storage_bucket?data=${encodeURIComponent(JSON.stringify(service))}`);
  };
  return (
    <div>
      <h2>Cloud Storage Details</h2>
      {cloudStorage.length === 0 ? (
        <p>No Cloud Storage buckets found.</p>
      ) : (
        <div className='cloud-storage-buckets-card-container'>
          {cloudStorage.map((bucket, index) => (
            <div key={index} className="cloud-storage-buckets-card" onClick={() => handleServiceClick(bucket)}>
                <p className='bucket-data-value'><span className='bucket-data-key'>Name:</span> {bucket.name}</p>
                <p className='bucket-data-value'><span className='bucket-data-key'>Location:</span> {bucket.location}</p>
            </div>
        ))}

        </div>
      )}
    </div>
  );
}

export default CloudStorageDetails;
