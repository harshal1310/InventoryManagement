const express = require('express');
const router = express.Router();
const connection = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');

// Middleware to parse JSON data
router.use(bodyParser.json());

app.post('/signup', (req, res) => {
    console.log("in signup")
    const { companyName, email, password, country, state, phone } = req.body;

    if (!companyName || !email || !password || !country || !state || !phone) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Generate a unique company name
    const uniqueCompanyName = companyName + '-' + crypto.randomBytes(4).toString('hex');

    // Insert the company into the database
    const companyQuery = 'INSERT INTO companies (company_name) VALUES (?)';
    connection.query(companyQuery, [uniqueCompanyName], (err, results) => {
        if (err) {
            console.error('Error inserting company:', err);
            return res.status(500).json({ message: 'Internal server error.' });
        }

        const companyId = results.insertId;

        // Insert the user into the database
        const userQuery = 'INSERT INTO users (company_id, email, password, country, state, phone) VALUES (?, ?, ?, ?, ?, ?)';
        connection.query(userQuery, [companyId, email, password, country, state, phone], (err) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).json({ message: 'Internal server error.' });
            }

            res.status(201).json({ message: 'User and company created successfully.' });
        });
    });
});

module.exports = router;
