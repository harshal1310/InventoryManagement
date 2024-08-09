const express = require('express');
const router = express.Router();
const pool = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');

// Middleware to parse JSON and URL-encoded data
router.use(bodyParser.json());
router.use(express.urlencoded({ extended: true }));

// Helper function to execute queries
async function queryDatabase(query, params = []) {
    try {
        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        throw new Error(error);
    }
}

// Route to get all customers
router.get('/getCustomers', async (req, res) => {
    console.log("Fetching customers");
    const companyId = req.user.companyId;

    try {
        const query = 'SELECT * FROM customers WHERE company_id = $1';
        const results = await queryDatabase(query, [companyId]);

        console.log(results);
        res.status(200).json(results); // Sending the results directly
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Failed to fetch customers' });
    }
});

// Route to add a new customer
router.post('/add-customer', async (req, res) => {
    console.log("Received request to add customer");
    const companyId = req.user.companyId;

    // Extract customer data from the request body
    const { name, address, city, mobile, enrollmentDate, enrolledBy } = req.body;

    // Validate data
    if (!name || !address || !city || !mobile || !enrollmentDate || !enrolledBy) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    console.log(req.body);

    try {
        // Query to check if the customer already exists
        const checkQuery = 'SELECT * FROM customers WHERE mobile = $1 AND company_id = $2';
        const existingCustomer = await queryDatabase(checkQuery, [mobile, companyId]);

        if (existingCustomer.length > 0) {
            console.log("Customer already present");
            return res.status(400).json({ message: 'Customer already exists' });
        }

        // SQL query to insert customer data
        const insertQuery = `
            INSERT INTO customers (name, address, city, mobile, enrollment_date, enrolled_by, company_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`;

        // Execute the insertion query
        await queryDatabase(insertQuery, [name, address, city, mobile, enrollmentDate, enrolledBy, companyId]);

        res.status(200).json({ message: 'Customer added successfully' });
    } catch (error) {
        console.error('Error adding customer:', error);
        res.status(500).json({ message: 'Failed to add customer' });
    }
});

// Route to update customer information
router.put('/update-customer/:id', async (req, res) => {
    console.log("Received request to update customer");

    const customerId = req.params.id;
    const { name, address, city, mobile, enrollmentDate, enrolledBy } = req.body;

    // Validate data
    if (!name || !address || !city || !mobile || !enrollmentDate || !enrolledBy) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // SQL query to update customer data
        const query = `
            UPDATE customers
            SET name = $1, address = $2, city = $3, mobile = $4, enrollment_date = $5, enrolled_by = $6
            WHERE id = $7`;

        const result = await queryDatabase(query, [name, address, city, mobile, enrollmentDate, enrolledBy, customerId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        console.log('Customer updated successfully');
        res.status(200).json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: 'Failed to update customer' });
    }
});

// Route to delete a customer
router.delete('/delete-customer/:id', async (req, res) => {
    console.log("Received request to delete customer");

    const customerId = req.params.id;

    try {
        // SQL query to delete customer data
        const query = 'DELETE FROM customers WHERE id = $1';
        const result = await queryDatabase(query, [customerId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        console.log('Customer deleted successfully');
        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ message: 'Failed to delete customer' });
    }
});

module.exports = router;
