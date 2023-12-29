import { callMsGraph } from "./graph";
import { loginRequest } from "./authConfig";
import { useMsal } from "@azure/msal-react";
import React, { useState, useEffect } from "react";
import Main from "./MainRoutes";
import "../Navabar/Loader.css"
import Loader from "../Navabar/Loader";
import Navbar from "../Navabar/Navbar";
import "./ProfileContent.css"

const ProfileContent = () => {
  const { instance, accounts } = useMsal();
  const [graphData, setGraphData] = useState(null);

  const name = accounts[0] && accounts[0].name;
  
  useEffect(() => {
    const request = {
      ...loginRequest,
      account: accounts[0],
    };

    instance
      .acquireTokenSilent(request)
      .then((response) => {
        callMsGraph(response.accessToken).then((response) =>
          setGraphData(response)
        );
      })
      .catch((e) => {
        instance.acquireTokenPopup(request).then((response) => {
          callMsGraph(response.accessToken).then((response) =>
            setGraphData(response)
          );
        });
      });
  }, []);

  return (
    <div className="nav-main">
      {graphData ? (
        <Navbar graphData={graphData} />
      ) : (
        <></>
      )}
      {graphData ? (
        
        <Main graphData={graphData} />
      ) : (
        <Loader></Loader>
      )}
    </div>
  );
};

export default ProfileContent;