import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { URLs } from "../Urls";
import Loader from "../Navabar/Loader";
import VaultForm from "./VaultForm";
import DialogBox from "./DialogBox";
import { FaPlus, FaSync, FaTrash } from "react-icons/fa";
import VaultDeleteConfirmBox from "./VaultDeleteConfirmBox";
const VaultPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [user_email] = useState("venkatasuresh.bukka@dxc.com");

  const [projectStatus, setProjectStatus] = useState(null);
  const [dialogData, setDialogData] = useState(null);

  const [selectedVaultToDelete, setSelectedVaultToDelete] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true); // Set loading state to true
    setProjects([]); // Clear the existing projects
    try {
      const response = await axios.post(URLs().GetAllGcpProjectsForUser, {
        user_email: user_email,
      });
      setProjects(response.data.projects);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setLoading(false);
    }
  }, [user_email]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const openConfirmationDialog = (vaultData) => {
    setSelectedVaultToDelete(vaultData);
    console.log(vaultData)
  };

  const handleCancelDeletion = () => {
    setSelectedVaultToDelete(null);
  };

  const handleConfirmDeletion = () => {
    // Make the API call to delete the selectedVaultToDelete
    axios
      .delete(URLs().DeleteVaultDetails, {
        data: {
          vault_username: selectedVaultToDelete.vault_username,
          user_email: user_email,
        },
      })
      .then((response) => {
        // Handle the successful deletion response here
        console.log("VaultDetails deleted successfully");
        // You can also update the projects list after successful deletion if needed.
        fetchProjects();
      })
      .catch((error) => {
        // Handle any error that occurs during deletion
        console.error("Failed to delete VaultDetails:", error);
      });
  
    setSelectedVaultToDelete(null);
  };

  const handleAddVault = (vaultData) => {
    // Handle the vault data, e.g., make an API call to save it
    console.log("Saving vault data:", vaultData);
    // Close the form
    setIsFormOpen(false);
  };

  const handleProjectStatusClick = (project) => {
    if (project.project_status === "SERVICE_DISABLED") {
      // Set the dialog data for the disabled project
      setDialogData({
        title: "Billing Service Disabled",
        message:
          "Probably your service account doesn't have billing enabled. Please update your service account or enable billing.",
      });
    }
  };

  return (
    <div className="vault-page-container">
      {loading ? (
        <Loader />
      ) : (
        <>
          <div className={`user-projects-card ${isFormOpen ? "hidden" : ""}`}>
            <div className="refresh-icon" onClick={fetchProjects}>
              <FaSync />
            </div>
            {projects.length > 0 ? (
              <ul className={`projects-list ${isFormOpen ? "hidden" : ""}`}>
                {projects.map((project, index) => (
                  <li key={index}>
                    <div className="project-details">
                      <div
                        className={`vault-username ${
                          project.project_status === "SERVICE_DISABLED" ? "disabled" : ""
                        }`}
                      >
                        {project.vault_username}
                      </div>

                      <div
                        className={`project-name ${
                          project.project_status === "SERVICE_DISABLED" ? "disabled" : ""
                        }`}
                        onClick={() => handleProjectStatusClick(project)}
                      >
                        {project.project_id}
                      </div>
                      <FaTrash
                        className="delete-icon"
                        onClick={() => openConfirmationDialog(project)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-vault-details">No vault details and user, please add.</p>
            )}

            <FaPlus className="add-vault-secret" onClick={() => setIsFormOpen(true)} />
          </div>
          {isFormOpen && <VaultForm user_email={user_email} onClose={() => setIsFormOpen(false)} />}
          {dialogData && (
            <DialogBox
              title={dialogData.title}
              message={dialogData.message}
              onClose={() => setDialogData(null)}
            />
          )}
          {selectedVaultToDelete && (
            <VaultDeleteConfirmBox
              username={selectedVaultToDelete.vault_username}
              user_email={selectedVaultToDelete.user_email}
              onCancel={handleCancelDeletion}
              onConfirm={handleConfirmDeletion}
            />
          )}
        </>
      )}
    </div>
  );
};

export default VaultPage;
