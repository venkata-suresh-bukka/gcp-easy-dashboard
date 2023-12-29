// Dropdown.js
import React from 'react';
import '../../LoggedIn/ProjectDropdown.css'; // Import the CSS for styling

function CloudStorageDropdown({ projects, selectedProject, onProjectChange }) {
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
    </div>
  );
}

export default CloudStorageDropdown;
