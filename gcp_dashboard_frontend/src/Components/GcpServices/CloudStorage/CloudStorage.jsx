import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { URLs } from '../../Urls';
import CloudStorageDropdown from './CloudStorageDropdown';
import CloudStorageDetails from './CloudStorageDetails';
import Sidebar from '../../LoggedIn/SideNavbar';
import '../../LoggedIn/Home.css';

function CloudStorage({ email }) {
  const [userProjects, setUserProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cloudStorageDetails, setCloudStorageDetails] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const user_email = email;
      const storedProjects = JSON.parse(sessionStorage.getItem('cloudStorageProjects')) || [];

      // Use session data if available
      if (storedProjects.length > 0) {
        setUserProjects(storedProjects);
        setSearchResults(storedProjects);

        // Set the selected option from session storage
        setSelectedProject(sessionStorage.getItem('selectedCloudStorageProject') || '');
      } else {
        try {
          // Fetch user GCP projects
          const projectsResponse = await axios.post(URLs().GetAllGcpProjectsForUser, { user_email });
          const projects = projectsResponse.data.projects;

          // Store data in session storage
          sessionStorage.setItem('cloudStorageProjects', JSON.stringify(projects));
          setUserProjects(projects);
          setSearchResults(projects);
        } catch (error) {
          console.error('Failed to fetch user GCP projects:', error);
        }
      }
    };

    fetchData();
  }, [email]);

  useEffect(() => {
    const storedCloudStorageDetails = JSON.parse(sessionStorage.getItem('cloudStorageDetails')) || [];
    setCloudStorageDetails(storedCloudStorageDetails);

    // Set the selected option from session storage
    setSelectedProject(sessionStorage.getItem('selectedCloudStorageProject') || '');
  }, []);

  const handleSearch = async () => {
    try {
      // Your existing search logic

      // Example logic for fetching Cloud Storage details
      const response = await axios.post(URLs().FetchCloudStorageDetails, {
        project_id: selectedProject,
        user_email: email,
      });
      const details = response.data.buckets;

      // Store Cloud Storage details in session storage
      sessionStorage.setItem('cloudStorageDetails', JSON.stringify(details));
      setCloudStorageDetails(details);

      // Store selected project in session storage
      sessionStorage.setItem('selectedCloudStorageProject', selectedProject);
    } catch (error) {
      console.error('Failed to fetch Cloud Storage details:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      // Force a new API call by adding a timestamp to the URL
      const timestamp = new Date().getTime();

      // Fetch user GCP projects
      const projectsResponse = await axios.post(`${URLs().GetAllGcpProjectsForUser}?timestamp=${timestamp}`, { user_email: email });
      const projects = projectsResponse.data.projects;

      // Store data in session storage
      sessionStorage.setItem('cloudStorageProjects', JSON.stringify(projects));
      setUserProjects(projects);
      setSearchResults(projects);
    } catch (error) {
      console.error('Failed to refresh user GCP projects:', error);
    }
  };

  return (
    <div className="home">
      <div className='dropdown-sidenav-instance-container'>
        <div className='sidenav-container'>
          <Sidebar />
        </div>

        <div className='dropdown-instance-container'>
          <div className="dropdown-search-container">
            <CloudStorageDropdown
              projects={searchResults}
              selectedProject={selectedProject}
              onProjectChange={(e) => setSelectedProject(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
            <button onClick={handleRefresh}>Refresh</button>
          </div>
          <div className='intances-container'>
            <CloudStorageDetails cloudStorage={cloudStorageDetails} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CloudStorage;
