import React, { useState } from "react";
import './VaultForm.css';
import { URLs } from "../Urls";

const VaultForm = ({ onClose, user_email }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secret_path, setSecretPath] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusMessageClassName, setStatusMessageClassName] = useState(""); 

  const handleSave = async () => {
    // Perform validation if needed
    const vaultData = { username, password, secret_path, user_email };
   
    // Make a POST API call to the backend to save the vault data
    try {
      const response = await fetch(URLs().CreateAddVault, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vaultData),
      });
  
      if (response.ok) {
        setStatusMessage('Vault details updated successfully');
        setStatusMessageClassName('success');
      } else {
        // Request indicates an error
        const data = await response.json();
        console.error('Error:', data[0]); 
        const error_msg = data[0].status_message;
        const message = error_msg + " " + response.status;
        console.log(response.status)
  
        // Check if the status code is 200 and the message contains "already existed"
        if (response.status === 200) {
          setStatusMessage(message);
        } else if(response.status === 409) {
          setStatusMessage(message);
          setStatusMessageClassName('error');
        }
        else if(response.status === 401) {
            setStatusMessage(message);
            setStatusMessageClassName('error');
        }
        else if(response.status === 400) {
          setStatusMessage(message);
          setStatusMessageClassName('error');
        }
      }
    } catch (error) {
      console.error("Failed to save vault details:", error);
      setStatusMessage("Failed to save vault details"); 
      setStatusMessageClassName('error');
    }
  };

  return (
    <div className="popup-form">
      <div className="popup-form-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h5>Add Vault Secret</h5>
        <div className={`status-message ${statusMessageClassName}`}>{statusMessage}</div>
        <input
          type="text"
          placeholder="User Email"
          value={user_email}
          disabled
        />
        <input
          type="text"
          placeholder="User Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="text"
          placeholder="Secret Path"
          value={secret_path}
          onChange={(e) => setSecretPath(e.target.value)}
        />
        <button className="vault-form-save-btn" onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default VaultForm;
