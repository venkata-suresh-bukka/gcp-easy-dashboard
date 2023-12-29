import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './InstancesDataPage.css';
import { FaArrowLeft } from 'react-icons/fa'; 

const ITEMS_PER_PAGE = 6;

function renderTableRows(data, keys) {
  return keys.map((key) => (
    <tr key={key}>
      <td>{key}</td>
      <td>
        {typeof data[key] === 'object' ? (
          <table className="nested-table">
            <tbody>{renderTableRows(data[key], Object.keys(data[key]))}</tbody>
          </table>
        ) : (
          data[key].toString()
        )}
      </td>
    </tr>
  ));
}

function InstanceDetailsPage() {
  const { instanceName } = useParams();
  const location = useLocation();
  const [instance, setInstance] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [keys, setKeys] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const serializedInstance = new URLSearchParams(location.search).get('data');
    if (serializedInstance) {
      const deserializedInstance = JSON.parse(decodeURIComponent(serializedInstance));
      setInstance(deserializedInstance);
      setKeys(Object.keys(deserializedInstance));
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
    // Navigate back to the cloud_functions page
    navigate('/compute_engine');
  };
  return (
    <div className="instance-data-page-container">
        <div className='instances-navigate-btn-heading-container'> 
            <button className='instance-navigate-compute-engine-btn' onClick={handleGoBack}>
            <FaArrowLeft /> Back
            </button>
            <p className='instance-data-page-heading'><strong>{instanceName}</strong></p>
        </div>        
      
      {instance && (
        <div>
          <table className="instance-details-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>{renderTableRows(instance, currentKeys)}</tbody>
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

export default InstanceDetailsPage;
