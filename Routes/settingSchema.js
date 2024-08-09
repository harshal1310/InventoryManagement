const express = require('express');
const router = express.Router();
const pool = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');

// Middleware to parse JSON data
router.use(bodyParser.json());

// Helper function to execute queries
async function queryDatabase(query, params = []) {
    try {
        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        throw new Error(error);
    }
}

// Handle POST request to /manageBranch
router.post('/manageBranch', async (req, res) => {
    console.log("Received save branch request");
    const company_id = parseInt(req.user.companyId);
    const user_id = req.user.email;

    // Extract data from request body
    const { branchName, branchLocation } = req.body;

    // Validate data
    if (!branchName || !branchLocation) {
        return res.status(400).json({ message: 'Branch name and location are required.' });
    }

    // SQL query to insert branch data
    const query = 'INSERT INTO branches (branch_name, branch_location, company_id, email) VALUES ($1, $2, $3, $4)';
    const values = [branchName, branchLocation, company_id, user_id];

    try {
        // Execute query
        await queryDatabase(query, values);
        // Respond with success message
        res.status(200).json({ message: 'Branch added successfully.' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Handle GET request to fetch branches
router.get('/branches', async (req, res) => {
    console.log("Fetching branches...");
    const company_id = parseInt(req.user.companyId);  // Ensure companyId is an integer

    const query = 'SELECT branch_name FROM branches WHERE company_id = $1';

    try {
        const results = await queryDatabase(query, [company_id]);

        // Map results to a simpler format
        const branches = results.map(row => row.branch_name);

        res.status(200).json({ branches });
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ message: 'Failed to fetch branches', error: error.message });
    }
});

// Handle POST request to /manageService
router.post('/manageService', async (req, res) => {
    console.log("Received save service request");

    // Extract data from request body
    const { serviceName, serviceDescription, branchName } = req.body;

    // Validate data
    if (!serviceName || !serviceDescription || !branchName) {
        return res.status(400).json({ message: 'Service name, description, and branch name are required.' });
    }

    // SQL query to insert service data
    const query = 'INSERT INTO services (service_name, service_description, branch_name) VALUES ($1, $2, $3)';
    const values = [serviceName, serviceDescription, branchName];

    try {
        // Execute query
        await queryDatabase(query, values);
        // Respond with success message
        res.status(200).json({ message: 'Service added successfully.' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
