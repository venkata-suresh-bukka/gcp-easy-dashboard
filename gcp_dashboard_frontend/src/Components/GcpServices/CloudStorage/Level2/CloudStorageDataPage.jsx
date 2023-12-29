// CloudStorageDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CloudStorageDataPage.css'; 
import { FaArrowLeft } from 'react-icons/fa';

const ITEMS_PER_PAGE = 6;

function renderTableRows(data, keys) {
  return keys.map((key) => (
    <tr key={key}>
      <td>{key}</td>
      <td>
        {data[key] != null && typeof data[key] === 'object' ? (
          <table className="nested-table">
            <tbody>{renderTableRows(data[key], Object.keys(data[key]))}</tbody>
          </table>
        ) : (
          data[key]?.toString() ?? 'N/A' // Provide a default value if data[key] is undefined or null
        )}
      </td>
    </tr>
  ));
}

function CloudStorageDataPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cloudStorageData, setCloudStorageData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [keys, setKeys] = useState([]);

  useEffect(() => {
    const serializedCloudStorageData = new URLSearchParams(location.search).get('data');
    if (serializedCloudStorageData) {
      const deserializedCloudStorageData = JSON.parse(decodeURIComponent(serializedCloudStorageData));
      setCloudStorageData(deserializedCloudStorageData);
      setKeys(Object.keys(deserializedCloudStorageData));
    }
  }, [location.search]);

  const totalItems = keys.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentKeys = keys.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleGoBack = () => {
    // Navigate back to the cloud_storage page
    navigate('/cloud_storage');
  };

  return (
    <div className="cloud-storage-data-page-container">
      <div className='cloud-storage-navigate-btn-heading-container'>
        <button className='navigate-cloud-storage-btn' onClick={handleGoBack}>
          <FaArrowLeft /> Back
        </button>
        <p className='cloud-storage-data-page-heading'><strong>{cloudStorageData?.name}</strong></p>
      </div>

      {cloudStorageData && (
        <div>
          <table className="cloud-storage-details-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>{renderTableRows(cloudStorageData, currentKeys)}</tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Prev
          </button>
          <span>{currentPage}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default CloudStorageDataPage;
