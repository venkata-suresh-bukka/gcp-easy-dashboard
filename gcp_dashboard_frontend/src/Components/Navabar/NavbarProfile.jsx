// UserDropdown.js
import React from "react";
import { LogOutButton } from "./LogOutButton";
const NavbarProfile = ({ firstname, lastname, onLogout }) => {
  return (
    <div className="user-dropdown">
      <p>{firstname}, {lastname}</p>
      <LogOutButton />
    </div>
  );
};

export default NavbarProfile;
