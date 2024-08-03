const express = require('express');
const router = express.Router();
const connection = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');

// Middleware to parse JSON data
router.use(bodyParser.json());

// Handle POST request to /manageBranch
router.post('/manageBranch', (req, res) => {
    console.log("Received save branch request");
    const company_id = parseInt(req.user.companyId);
    const user_id = (req.user.email);
    


    // Extract data from request body
    const { branchName, branchLocation } = req.body;

    // Validate data
    if (!branchName || !branchLocation) {
        return res.status(400).json({ message: 'Branch name and location are required.' });
    }

    // SQL query to insert branch data
    const query = 'INSERT INTO branches (branch_name, branch_location,company_id,email) VALUES (?, ?,?,?)';
    const values = [branchName, branchLocation,company_id,user_id];

    // Execute query
    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }

        // Respond with success message
        res.status(200).json({ message: 'Branch added successfully.' });
    });
});




router.get('/branches', (req, res) => {
    console.log("Fetching branches...");
    const company_id = req.user.companyId;  // Ensure companyId is an integer
    console.log(req.user);
    const query = 'SELECT branch_name FROM branches WHERE company_id = ?';

    connection.query(query, [company_id], (error, results) => {
        if (error) {
            console.error('Error fetching branches:', error);
            return res.status(500).json({ message: 'Failed to fetch branches', error: error.message });
        }
        console.log(results)

        // Map results to a simpler format
        const branches = results.map(row => row.branch_name);

        res.status(200).json({ branches });
    });
});
router.post('/manageService', (req, res) => {
    console.log("Received save branch request");

    // Extract data from request body
    const { serviceName, serviceDescription,branchName } = req.body;

    // Validate data
    if (!serviceName || !serviceDescription || !branchName) {
        return res.status(400).json({ message: 'Branch name and location are required.' });
    }
    

    // SQL query to insert branch data
    const query = 'INSERT INTO branches (name, location) VALUES (?, ?)';
    const values = [branchName, branchLocation];

    // Execute query
    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }

        // Respond with success message
        res.status(200).json({ message: 'Branch added successfully.' });
    });
});

module.exports = router;
