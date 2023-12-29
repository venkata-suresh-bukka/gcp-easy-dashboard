import React from "react";
import { useMsal } from "@azure/msal-react";
import { Button } from "react-bootstrap";

/**
 * Renders a sign-out button
 */
export const LogOutButton = () => {
  const { instance } = useMsal();

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: "http://localhost:3000/",
      mainWindowRedirectUri: "/",
      navigateToLoginRequestUrl: true,
    });
  };

  return (
    <Button onClick={handleLogout}>
      Sign out
    </Button>
  );
};
