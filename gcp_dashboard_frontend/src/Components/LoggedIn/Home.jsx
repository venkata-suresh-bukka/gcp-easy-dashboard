import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { URLs } from '../Urls';
import './Home.css';
import Dropdown from './ProjectsDropdown';
import InstanceList from '../GcpServices/ComputeInstances/InstancesDetails';
import Sidebar from './SideNavbar';

function Home({ email }) {
  const [userProjects, setUserProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [instanceDetails, setInstanceDetails] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const user_email = email;
      const storedProjects = JSON.parse(sessionStorage.getItem('userProjects')) || [];
      const storedZones = JSON.parse(sessionStorage.getItem('zones')) || [];

      // Use session data if available
      if (storedProjects.length > 0 && storedZones.length > 0) {
        setUserProjects(storedProjects);
        setSearchResults(storedProjects);
        setZones(storedZones);

        // Set the selected options from local state
        setSelectedProject(sessionStorage.getItem('selectedProject') || '');
        setSelectedZone(sessionStorage.getItem('selectedZone') || '');
      } else {
        try {
          // Fetch user GCP projects
          const projectsResponse = await axios.post(URLs().GetAllGcpProjectsForUser, { user_email });
          const projects = projectsResponse.data.projects;

          // Store data in session storage
          sessionStorage.setItem('userProjects', JSON.stringify(projects));
          setUserProjects(projects);
          setSearchResults(projects);

          // Fetch GCP zones
          const zonesResponse = await axios.post(URLs().FetchGcpZones, { user_email });
          const zones = zonesResponse.data.zones;

          // Store data in session storage
          sessionStorage.setItem('zones', JSON.stringify(zones));
          setZones(zones);
        } catch (error) {
          console.error('Failed to fetch user GCP projects or zones:', error);
        }
      }
    };

    fetchData();
  }, [email]);

  useEffect(() => {
    const storedInstanceDetails = JSON.parse(sessionStorage.getItem('instanceDetails')) || [];
    setInstanceDetails(storedInstanceDetails);

    // Set the selected options from local state
    setSelectedProject(sessionStorage.getItem('selectedProject') || '');
    setSelectedZone(sessionStorage.getItem('selectedZone') || '');
  }, []);

  const handleSearch = async () => {
    try {
      // Your existing search logic

      // Example logic for fetching instance details
      const response = await axios.post(URLs().FetchInstanceDetails, {
        project_id: selectedProject,
        zone: selectedZone,
        user_email: email,
      });
      const details = response.data.instances;

      // Store instance details in session storage
      sessionStorage.setItem('instanceDetails', JSON.stringify(details));
      setInstanceDetails(details);

      // Store selected project and zone in session storage
      sessionStorage.setItem('selectedProject', selectedProject);
      sessionStorage.setItem('selectedZone', selectedZone);
    } catch (error) {
      console.error('Failed to fetch instance details:', error);
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
      sessionStorage.setItem('userProjects', JSON.stringify(projects));
      setUserProjects(projects);
      setSearchResults(projects);

      // Fetch GCP zones
      const zonesResponse = await axios.post(`${URLs().FetchGcpZones}?timestamp=${timestamp}`, { user_email: email });
      const zones = zonesResponse.data.zones;

      // Store data in session storage
      sessionStorage.setItem('zones', JSON.stringify(zones));
      setZones(zones);

      // Fetch instance details
      const instanceDetailsResponse = await axios.post(`${URLs().FetchInstanceDetails}?timestamp=${timestamp}`, {
        project_id: selectedProject,
        zone: selectedZone,
        user_email: email,
      });
      const details = instanceDetailsResponse.data.instances;

      // Store instance details in session storage
      sessionStorage.setItem('instanceDetails', JSON.stringify(details));
      setInstanceDetails(details);
    } catch (error) {
      console.error('Failed to refresh user GCP projects, zones, or instance details:', error);
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
              zones={zones}
              selectedZone={selectedZone}
              onZoneChange={(e) => setSelectedZone(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
            <button onClick={handleRefresh}>Refresh</button>
          </div>
          <div className='intances-container'>
            <InstanceList instanceDetails={instanceDetails} user_email={email}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
