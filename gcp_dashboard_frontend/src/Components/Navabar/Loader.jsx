import React from "react";
import "./Loader.css"; // Import the CSS file for styling


const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader">
        <div className="circle">
        </div>
        <p className="loading-text">Loading....</p>
      </div>
    </div>
  );
};

export default Loader;