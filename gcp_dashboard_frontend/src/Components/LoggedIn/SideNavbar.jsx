import React, { useState } from 'react';
import './SideNavbar.css';
import CloudFunctionSvg from '../static/icons/cloud_functions.svg'
import CloudRunSvg from '../static/icons/cloud_run.svg'
import CloudStorageSvg from '../static/icons/cloud_storage.svg'
import ComputeEngineSvg from '../static/icons/compute_engine.svg'
import { Link } from 'react-router-dom';
import './SideNavbar.css';

const Sidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const [subMenuExpanded, setSubMenuExpanded] = useState(null);

  const toggleSidebar = () => {
    setExpanded(!expanded);
    setSubMenuExpanded(null); // Close any open submenu when toggling the main sidebar
  };

  const toggleSubMenu = (item) => {
    setSubMenuExpanded(subMenuExpanded === item ? null : item);
  };

  return (
    <div className={`sidebar ${expanded ? 'expanded' : ''}`} onMouseEnter={toggleSidebar} onMouseLeave={toggleSidebar}>
      <ul>
        <li>
          {expanded ? (
            <span>
              <div className="sidenav-links" onClick={() => toggleSubMenu('instances')}>
                <img src={ComputeEngineSvg} alt="Compute Engine Icon" />
                Instances
                <div className="dropdown-icon">
                  <i className={`fa ${subMenuExpanded === 'instances' ? 'fa-caret-up' : 'fa-caret-down'}`} />
                </div>
              </div>
              {subMenuExpanded === 'instances' && (
                <ul className="sub-menu">
                  <li>
                    <Link to="/compute_engine" className='sidenav-links'>All Instances</Link>
                  </li>
                  <li>
                    <Link to="/schedule_instances" className='sidenav-links'>Instance Schedule</Link>
                  </li>
                </ul>
              )}
            </span>
          ) : (
            <Link to="/compute_engine" className='sidenav-links'>
              <img src={ComputeEngineSvg} alt="Compute Engine Icon" />
            </Link>
          )}
        </li>
        <li>
          {expanded ? (
            <span>
              <div className="sidenav-links" onClick={() => toggleSubMenu('cloud_functions')}>
                <img src={CloudFunctionSvg} alt="Cloud Functions Icon" />
                Cloud funcitons
                <div className="dropdown-icon">
                  <i className={`fa ${subMenuExpanded === 'cloud_functions' ? 'fa-caret-up' : 'fa-caret-down'}`} />
                </div>
              </div>
              {subMenuExpanded === 'cloud_functions' && (
                <ul className="sub-menu">
                  <li>
                    <Link to="/cloud_functions" className='sidenav-links'>Cloud Functions</Link>
                  </li>
                  <li>
                    <Link to="/functions_option2" className='sidenav-links'>Functions option 2 </Link>
                  </li>
                </ul>
              )}
            </span>
          ) : (
            <Link to="/cloud_functions" className='sidenav-links'>
              <img src={CloudFunctionSvg} alt="Cloud Functions Icon" />
            </Link>
          )}
        </li>

        <li>
          {expanded ? (
            <span>
              <div className="sidenav-links" onClick={() => toggleSubMenu('cloud_run')}>
                <img src={CloudRunSvg} alt="Cloud Run Icon" />
                Cloud Run
                <div className="dropdown-icon">
                  <i className={`fa ${subMenuExpanded === 'cloud_run' ? 'fa-caret-up' : 'fa-caret-down'}`} />
                </div>
              </div>
              {subMenuExpanded === 'cloud_run' && (
                <ul className="sub-menu">
                  <li>
                    <Link to="/cloud_run" className='sidenav-links'>Cloud run</Link>
                  </li>
                  <li>
                    <Link to="/cloud_run2" className='sidenav-links'>run option 2 </Link>
                  </li>
                </ul>
              )}
            </span>
          ) : (
            <Link to="/cloud_run" className='sidenav-links'>
              <img src={CloudRunSvg} alt="Cloud Run Icon" />
            </Link>
          )}
        </li>
        
        <li>
          {expanded ? (
            <span>
              <div className="sidenav-links" onClick={() => toggleSubMenu('cloud_storage')}>
                <img src={CloudStorageSvg} alt="Cloud Run Icon" />
                Cloud Storage
                <div className="dropdown-icon">
                  <i className={`fa ${subMenuExpanded === 'cloud_storage' ? 'fa-caret-up' : 'fa-caret-down'}`} />
                </div>
              </div>
              {subMenuExpanded === 'cloud_storage' && (
                <ul className="sub-menu">
                  <li>
                    <Link to="/cloud_storage" className='sidenav-links'>Cloud storage</Link>
                  </li>
                  <li>
                    <Link to="/cloud_storage" className='sidenav-links'>storage option 2 </Link>
                  </li>
                </ul>
              )}
            </span>
          ) : (
            <Link to="/cloud_storage" className='sidenav-links'>
              <img src={CloudStorageSvg} alt="Cloud Storage Icon" />
            </Link>
          )}
        </li>
        
      </ul>
    </div>
  );
};

export default Sidebar;
