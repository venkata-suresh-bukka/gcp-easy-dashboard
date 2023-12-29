// CloudRunDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CloudRunDataPage.css';  // You can create a separate CSS file for styling
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
  

function CloudRunDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cloudRunData, setCloudRunData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [keys, setKeys] = useState([]);

  useEffect(() => {
    const serializedCloudRunData = new URLSearchParams(location.search).get('data');
    if (serializedCloudRunData) {
      const deserializedCloudRunData = JSON.parse(decodeURIComponent(serializedCloudRunData));
      setCloudRunData(deserializedCloudRunData);
      setKeys(Object.keys(deserializedCloudRunData));
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
    // Navigate back to the cloud_run_services page
    navigate('/cloud_run');
  };

  return (
    <div className="cloud-run-data-page-container">
      <div className='cloud-run-navigate-btn-heading-container'>
        <button className='navigate-cloud-run-btn' onClick={handleGoBack}>
          <FaArrowLeft /> Back
        </button>
        <p className='cloud-run-data-page-heading'><strong>{cloudRunData?.service_name}</strong></p>
      </div>
      
      {cloudRunData && (
        <div>
          <table className="cloud-run-details-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>{renderTableRows(cloudRunData, currentKeys)}</tbody>
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

export default CloudRunDetailsPage;
