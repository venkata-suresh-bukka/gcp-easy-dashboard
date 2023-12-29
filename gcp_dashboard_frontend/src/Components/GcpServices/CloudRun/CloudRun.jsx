import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { URLs } from '../../Urls';
import Dropdown from '../../LoggedIn/ProjectsDropdown';
import Sidebar from '../../LoggedIn/SideNavbar';
import CloudRunServicesList from './CloudRunDetails';
import '../../LoggedIn/Home.css';

function CloudRunServices({ email }) {
  const [userProjects, setUserProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [cloudRunServices, setCloudRunServices] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const user_email = email;
      const storedProjects = JSON.parse(sessionStorage.getItem('cloudRunServicesProjects')) || [];
      const storedRegions = JSON.parse(sessionStorage.getItem('cloudRunServicesRegions')) || [];

      // Use session data if available
      if (storedProjects.length > 0 && storedRegions.length > 0) {
        setUserProjects(storedProjects);
        setSearchResults(storedProjects);
        setRegions(storedRegions);

        // Set the selected options from session storage
        setSelectedProject(sessionStorage.getItem('selectedCloudRunServicesProject') || '');
        setSelectedRegion(sessionStorage.getItem('selectedCloudRunServicesRegion') || '');
      } else {
        try {
          // Fetch user GCP projects
          const projectsResponse = await axios.post(URLs().GetAllGcpProjectsForUser, { user_email });
          const projects = projectsResponse.data.projects;

          // Store data in session storage
          sessionStorage.setItem('cloudRunServicesProjects', JSON.stringify(projects));
          setUserProjects(projects);
          setSearchResults(projects);

          // Fetch GCP regions
          const regionsResponse = await axios.post(URLs().FetchGcpRegions, { user_email });
          const regions = regionsResponse.data.regions.regions;

          // Store data in session storage
          sessionStorage.setItem('cloudRunServicesRegions', JSON.stringify(regions));
          setRegions(regions);
        } catch (error) {
          console.error('Failed to fetch user GCP projects or regions:', error);
        }
      }
    };

    fetchData();
  }, [email]);

  useEffect(() => {
    const storedCloudRunServices = JSON.parse(sessionStorage.getItem('cloudRunServices')) || [];
    setCloudRunServices(storedCloudRunServices);

    // Set the selected options from session storage
    setSelectedProject(sessionStorage.getItem('selectedCloudRunServicesProject') || '');
    setSelectedRegion(sessionStorage.getItem('selectedCloudRunServicesRegion') || '');
  }, []);

  const handleSearch = async () => {
    try {
      // Your existing search logic

      // Example logic for fetching Cloud Run services
      const response = await axios.post(URLs().FetchCloudRunServices, {
        project_id: selectedProject,
        region: selectedRegion,
        user_email: email,
      });
      const services = response.data.services;

      // Store Cloud Run services in session storage
      sessionStorage.setItem('cloudRunServices', JSON.stringify(services));
      setCloudRunServices(services);

      // Store selected project and region in session storage
      sessionStorage.setItem('selectedCloudRunServicesProject', selectedProject);
      sessionStorage.setItem('selectedCloudRunServicesRegion', selectedRegion);
    } catch (error) {
      console.error('Failed to fetch Cloud Run services:', error);
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
      sessionStorage.setItem('cloudRunServicesProjects', JSON.stringify(projects));
      setUserProjects(projects);
      setSearchResults(projects);

      // Fetch GCP regions
      const regionsResponse = await axios.post(`${URLs().FetchGcpRegions}?timestamp=${timestamp}`, { user_email: email });
      const regions = regionsResponse.data.regions.regions;

      // Store data in session storage
      sessionStorage.setItem('cloudRunServicesRegions', JSON.stringify(regions));
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
            />
            <button onClick={handleSearch}>Search</button>
            <button onClick={handleRefresh}>Refresh</button>
          </div>
          <div className='intances-container'>
            <CloudRunServicesList cloudRunServices={cloudRunServices} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CloudRunServices;
