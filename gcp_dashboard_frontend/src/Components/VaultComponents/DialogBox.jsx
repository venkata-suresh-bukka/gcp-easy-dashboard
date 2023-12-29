import React from "react";
import './DialogBox.css'
const DialogBox = ({ title, message, onClose }) => {
  return (
    <div className="dialog-box">
      <div className="dialog-content">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default DialogBox;
