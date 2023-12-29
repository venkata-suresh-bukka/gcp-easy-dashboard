import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { URLs } from '../../Urls';
import Dropdown from '../../LoggedIn/ProjectsDropdown';
import CloudFunctionsList from './CloudFunctionDetails';
import Sidebar from '../../LoggedIn/SideNavbar';
import '../../LoggedIn/Home.css';

function CloudFunctions({ email }) {
  const [userProjects, setUserProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [cloudFunctionDetails, setCloudFunctionDetails] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const user_email = email;
      const storedProjects = JSON.parse(sessionStorage.getItem('cloudFunctionProjects')) || [];
      const storedRegions = JSON.parse(sessionStorage.getItem('cloudFunctionRegions')) || [];

      // Use session data if available
      if (storedProjects.length > 0 && storedRegions.length > 0) {
        setUserProjects(storedProjects);
        setSearchResults(storedProjects);
        setRegions(storedRegions);

        // Set the selected options from session storage
        setSelectedProject(sessionStorage.getItem('selectedCloudFunctionProject') || '');
        setSelectedRegion(sessionStorage.getItem('selectedCloudFunctionRegion') || '');
      } else {
        try {
          // Fetch user GCP projects
          const projectsResponse = await axios.post(URLs().GetAllGcpProjectsForUser, { user_email });
          const projects = projectsResponse.data.projects;

          // Store data in session storage
          sessionStorage.setItem('cloudFunctionProjects', JSON.stringify(projects));
          setUserProjects(projects);
          setSearchResults(projects);

          // Fetch GCP regions
          const regionsResponse = await axios.post(URLs().FetchGcpRegions, { user_email });
          const regions = regionsResponse.data.regions.regions;

          // Store data in session storage
          sessionStorage.setItem('cloudFunctionRegions', JSON.stringify(regions));
          setRegions(regions);
        } catch (error) {
          console.error('Failed to fetch user GCP projects or regions:', error);
        }
      }
    };

    fetchData();
  }, [email]);

  useEffect(() => {
    const storedCloudFunctionDetails = JSON.parse(sessionStorage.getItem('cloudFunctionDetails')) || [];
    setCloudFunctionDetails(storedCloudFunctionDetails);

    // Set the selected options from session storage
    setSelectedProject(sessionStorage.getItem('selectedCloudFunctionProject') || '');
    setSelectedRegion(sessionStorage.getItem('selectedCloudFunctionRegion') || '');
  }, []);

  const handleSearch = async () => {
    try {
      // Your existing search logic

      // Example logic for fetching cloud function details
      const response = await axios.post(URLs().FetchCloudFunctionDetails, {
        project_id: selectedProject,
        region: selectedRegion,
        user_email: email,
      });
      const details = response.data.instances;

      // Store cloud function details in session storage
      sessionStorage.setItem('cloudFunctionDetails', JSON.stringify(details));
      setCloudFunctionDetails(details);

      // Store selected project and region in session storage
      sessionStorage.setItem('selectedCloudFunctionProject', selectedProject);
      sessionStorage.setItem('selectedCloudFunctionRegion', selectedRegion);
    } catch (error) {
      console.error('Failed to fetch cloud function details:', error);
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
      sessionStorage.setItem('cloudFunctionProjects', JSON.stringify(projects));
      setUserProjects(projects);
      setSearchResults(projects);

      // Fetch GCP regions
      const regionsResponse = await axios.post(`${URLs().FetchGcpRegions}?timestamp=${timestamp}`, { user_email: email });
      const regions = regionsResponse.data.regions.regions;

      // Store data in session storage
      sessionStorage.setItem('cloudFunctionRegions', JSON.stringify(regions));
      setRegions(regions);
    } catch (error) {
      console.error('Failed to refresh user GCP projects or regions:', error);
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
            <Dropdown
              projects={searchResults}
              selectedProject={selectedProject}
              onProjectChange={(e) => setSelectedProject(e.target.value)}
              regions={regions}
              selectedRegion={selectedRegion}
              onRegionChange={(e) => setSelectedRegion(e.target.value)}
              isCloudStorage={false}
            />
            <button onClick={handleSearch}>Search</button>
            <button onClick={handleRefresh}>Refresh</button>
          </div>
          <div className='intances-container'>
            <CloudFunctionsList cloudFunctions={cloudFunctionDetails} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CloudFunctions;
