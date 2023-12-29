import React, { Component } from "react";
import { Link } from "react-router-dom";
import { MenuItems } from "./MenuItems";
import "./NavbarStyles.css";
import AppLogo from "../static/icons/gcp_easy_icon_4.png";
import NavbarProfile from "./NavbarProfile";
import 'bootstrap/dist/css/bootstrap.css';

class Navbar extends Component {
  state = {
    dropdownOpen: false,
    closeTimeout: null, 
  };

  toggleDropdown = () => {
    this.setState((prevState) => ({ dropdownOpen: !prevState.dropdownOpen }));
  };

  closeDropdown = () => {
    // Use setTimeout to add a delay before closing the dropdown
    const timeout = setTimeout(() => {
      this.setState({ dropdownOpen: false });
    }, 300); // Adjust the delay time (in milliseconds) as needed
    this.setState({ closeTimeout: timeout });
  };

  cancelCloseTimeout = () => {
    // Clear the timeout when re-entering the dropdown
    if (this.state.closeTimeout) {
      clearTimeout(this.state.closeTimeout);
    }
  };

  render() {
    const firstName = this.props.graphData.givenName;
    const lastName = this.props.graphData.surname;

    return (
      <nav sticky="top" className="NavbarItems">
        <div className="logo-app-name">
          <img src={AppLogo} className="navbar-logo" alt="applogo" />
          <p className="app-name">Gcp | E@sy</p>
        </div>
        <div
          className="menu-icons"
          onMouseEnter={this.toggleDropdown}
          onMouseLeave={this.closeDropdown}
        >
          <i
            className={this.state.dropdownOpen ? "fas fa-times" : "fas fa-bars"}
          ></i>
        </div>

        <ul className={this.state.dropdownOpen ? "nav-menu active" : "nav-menu"}>
          {MenuItems.map((item, index) => {
            return (
              <li key={index}>
                <Link className={item.cName} to={item.url}>
                  <i className={item.icon}></i>
                  {item.title}
                </Link>
              </li>
            );
          })}
          <div
            className="login-icon"
            onMouseEnter={this.toggleDropdown}
            onMouseLeave={this.closeDropdown}
          >
            <i className="fas fa-user-circle fa-3x profile-icon" />
            {this.state.dropdownOpen && (
              <div
                className="dropdown-content"
                onMouseEnter={this.cancelCloseTimeout}
                onMouseLeave={this.closeDropdown}
              >
                <NavbarProfile firstname={firstName} lastname={lastName} onLogout={this.props.onLogout} />
              </div>
            )}
          </div>
        </ul>
        
      </nav>
      
    );
    
  }
}

export default Navbar;
