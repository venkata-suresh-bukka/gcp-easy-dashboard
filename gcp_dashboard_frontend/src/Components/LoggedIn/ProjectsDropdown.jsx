// Dropdown.js
import React from 'react';
import './ProjectDropdown.css'; // Import the CSS for styling

function Dropdown({ projects, selectedProject, onProjectChange, regions, selectedRegion, onRegionChange, zones, selectedZone, onZoneChange }) {
  return (
    <div className="dropdown-container">
      <select className="select-project" value={selectedProject} onChange={onProjectChange}>
        <option value=''>Select a Project</option>
        {projects.map((project, index) => (
          <option className="project-option" key={index} value={project.project_id}>
            {project.project_id}
          </option>
        ))}
      </select>
      {regions ? (
        <select className="select-region" value={selectedRegion} onChange={onRegionChange}>
          <option value=''>Select a Region</option>
          {regions.map((region, index) => (
            <option className="region-option" key={index} value={region}>
              {region}
            </option>
          ))}
        </select>
      ) : (
        <select className="select-zone" value={selectedZone} onChange={onZoneChange}>
          <option value=''>Fetch All</option>
          {zones.map((zone, index) => (
            <option className="zone-option" key={index} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export default Dropdown;
