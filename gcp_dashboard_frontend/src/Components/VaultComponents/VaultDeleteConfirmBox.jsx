import React from "react";
import './VaultDeleteConfirmBox.css'

const VaultDeleteConfirmBox = ({ username, onCancel, onConfirm }) => {
  return (
    <div className="confirmation-dialog">
      <p>Are you sure you want to delete the vault details for <span className="user-name">{username}</span>?</p>
      <div className="buttons">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onConfirm}>OK</button>
      </div>
    </div>
  );
};

export default VaultDeleteConfirmBox;
