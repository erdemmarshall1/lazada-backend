const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000'; // Assuming the backend is running on port 3000

const updateTheme = async () => {
  try {
    const customCSS = fs.readFileSync(path.join(__dirname, '..', '..', 'new-backend-theme.css'), 'utf-8');

    const themeSettings = {
      primaryColor: '#667eea',
      backgroundColor: '#f0f2f5',
      customCSS,
    };

    const response = await axios.put(`${API_URL}/main/theme`, themeSettings, {
      headers: {
        // You might need to add an authorization header here
        // 'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
      }
    });

    if (response.data.code === 0) {
      console.log('Theme updated successfully!');
    } else {
      console.error('Failed to update theme:', response.data.msg);
    }
  } catch (error) {
    console.error('An error occurred while updating the theme:', error.message);
  }
};

updateTheme();