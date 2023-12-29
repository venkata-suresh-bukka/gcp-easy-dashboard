import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './CloudFunctionsDataPage.css';
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

function CloudFunctionDetailsPage() {
  const { functionName } = useParams();
  const location = useLocation();
  const navigate = useNavigate(); 
  const [cloudFunction, setCloudFunction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [keys, setKeys] = useState([]);

  useEffect(() => {
    const serializedCloudFunction = new URLSearchParams(location.search).get('data');
    if (serializedCloudFunction) {
      const deserializedCloudFunction = JSON.parse(decodeURIComponent(serializedCloudFunction));
      setCloudFunction(deserializedCloudFunction);
      setKeys(Object.keys(deserializedCloudFunction));
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
    navigate('/cloud_functions');
  };

  return (
    <div className="cloud-function-data-page-container">
      <div className='cloud-run-navigate-btn-heading-container'>
        <button className='navigate-cloud-function-btn' onClick={handleGoBack}>
          <FaArrowLeft /> Back
        </button>
        <p className='cloud-function-data-page-heading'><strong>{cloudFunction?.function_name}</strong></p>
      </div>
      
      {cloudFunction && (
        <div>
          <table className="cloud-function-details-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>{renderTableRows(cloudFunction, currentKeys)}</tbody>
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

export default CloudFunctionDetailsPage;
