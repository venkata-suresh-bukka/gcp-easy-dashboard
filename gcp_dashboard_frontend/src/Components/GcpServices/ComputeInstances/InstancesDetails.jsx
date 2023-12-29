import React, { useState, useEffect } from 'react';
import Switch from 'react-switch';
import './InstancesDetails.css';
import { URLs } from '../../Urls';
import { useNavigate } from 'react-router-dom';

function InstanceList({ instanceDetails, user_email }) {
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [prevToggleStatus, setPrevToggleStatus] = useState({}); // New state to store previous toggle status
  const [toggleStatus, setToggleStatus] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedInstance !== null) {
      setConfirmationDialogOpen(true);
    }
  }, [selectedInstance]);

  const handleToggleChange = (instanceName, instanceState) => {
    // Toggle the status without waiting for confirmation
    setToggleStatus((prevToggleStatus) => ({
      ...prevToggleStatus,
      [instanceName]: !prevToggleStatus[instanceName],
    }));

    // Set the selected instance for confirmation
    setSelectedInstance(instanceName);

    // Open the confirmation dialog only if the toggle status changes
    setConfirmationDialogOpen((prevConfirmationDialogOpen) => {
      const newConfirmationDialogOpen =
        prevToggleStatus !== undefined && prevToggleStatus[instanceName] !== !prevToggleStatus[instanceName];
      return newConfirmationDialogOpen;
    });
  };

  const handleStartStopClick = (instanceName, instanceDetails) => {
    const instance = instanceDetails.find((instance) => instance.name === instanceName);
    if (!instance) {
      console.error('Instance not found:', instanceName);
      return;
    }

    const action = instance.status === 'RUNNING' ? 'shutdown' : 'start';

    const payload = {
      project_id: instance.project_id,
      zone: instance.zone,
      user_email: user_email,
      instance_name: instanceName,
      action: action,
    };

    fetch(URLs().ChangeInstanceState, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('API Response:', data);
      })
      .catch((error) => {
        console.error('Error making API call:', error);
      })
      .finally(() => {
        setConfirmationDialogOpen(false);
        setSelectedInstance(null);
        setPrevToggleStatus({ ...toggleStatus });
      });
  };

  const getConfirmationMessage = () => {
    const selectedInstanceState = instanceDetails.find((instance) => instance.name === selectedInstance)?.status;
    const isRunning = selectedInstanceState === 'RUNNING';
    const isTerminated = selectedInstanceState === 'TERMINATED'
    const toggleOn = toggleStatus[selectedInstance];

    if (isTerminated) {
      return `You are about to start the VM: ${selectedInstance} (VM is currently stopped)`;
    } else if (isRunning) {
      return `You are about to stop the VM: ${selectedInstance} (VM is currently running)`;
    } 

    return ''; 
  };

  const handleInstanceClick = (instance) => {
    const serializedInstance = encodeURIComponent(JSON.stringify(instance));
  
    navigate(`/compute_engine/instance/${instance.name}?data=${serializedInstance}`);
  };  
  
  return (
    <div>
      <h2>Instance Details</h2>
      {instanceDetails.length === 1 && instanceDetails[0] === 'No instances found in this zone' ? (
        <p>No instances found in this zone</p>
      ) : (
        <div className='instances-card-container'>
          {instanceDetails.map((instance, index) => (
            <div key={index} className="instances-card">
              <div style={{ float: 'right', marginRight: '20px', marginTop: '10px' }}>
                <Switch
                  onChange={() => handleToggleChange(instance.name, instance.status)}
                  checked={instance.status === 'RUNNING'}
                />
              </div>
              <p className='instance-data-value' onClick={() => handleInstanceClick(instance)}><span className='instance-data-key'>Name:</span> {instance.name}</p>
              <p className='instance-data-value' onClick={() => handleInstanceClick(instance)}><span className='instance-data-key'>Status:</span> {instance.status}</p>
            </div>
          ))}
        </div>
        
      )}
      
      {/* Confirmation dialog */}
      {confirmationDialogOpen && (
        <div className="confirmation-dialog">
          <p>{getConfirmationMessage()}</p>
          <button onClick={() => handleStartStopClick(selectedInstance, instanceDetails)}>Confirm</button>
          <button onClick={() => setConfirmationDialogOpen(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default InstanceList;
