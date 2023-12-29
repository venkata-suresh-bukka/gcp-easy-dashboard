import React, { useState } from 'react';
import { URLs } from '../Urls';
import './VaultPage.css'

const VaultLoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({ username: '', password: '', secretPath: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Send form data to the POST API and handle the response
    const response = await fetch(URLs().VaultAuth, {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    onLogin(data); // Pass the response data to the parent component
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Add input fields for username, password, and secret path */}
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <input
          type="text"
          placeholder="Vault Secret Path"
          value={formData.secretPath}
          onChange={(e) => setFormData({ ...formData, secretPath: e.target.value })}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default VaultLoginForm;
