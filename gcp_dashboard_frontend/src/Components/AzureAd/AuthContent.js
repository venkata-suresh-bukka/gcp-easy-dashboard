import React, { useState } from "react";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import AuthLogin from "./AuthLogin";
import Navbar from "../Navabar/Navbar";
import { BrowserRouter as Router } from "react-router-dom";
import Home from "../LoggedIn/Home";
import { useMsal } from "@azure/msal-react";
import Main from "./MainRoutes";
import VaultLogin from "../VaultComponents/VaultAuth";
import ProfileContent from "./ProfileContent";

export const AuthContent = () => {
  const { accounts, inProgress } = useMsal();
  const loggedInAccount = accounts[0];
  console.log(loggedInAccount); 

  const [vaultData, setVaultData] = useState(null);

  const handleVaultLogin = (data) => {
    setVaultData(data);
  };

  return (
    <div className="App">
      <AuthenticatedTemplate>
        <Router>
          <ProfileContent />
        </Router>
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <AuthLogin />
      </UnauthenticatedTemplate>
    </div>
  );
};
