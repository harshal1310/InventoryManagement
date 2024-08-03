const express = require('express');
const router = express.Router();
const connection = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');

// Middleware to parse JSON and URL-encoded data
router.use(bodyParser.json());
router.use(express.urlencoded({ extended: true }));

// Define the route to handle customer addition

router.get('/getCustomers', (req, res) => {
    console.log("get")
    const query = 'SELECT * FROM customers';

    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching customers:', error);
            return res.status(500).json({ message: 'Failed to fetch customers' });
        }
        console.log(results);

        res.status(200).json(results); // Sending the results directly
    });
});


router.post('/add-customer', (req, res) => {
    console.log("Received request to add customer");

    // Extract customer data from the request body
    const { name, address, city, mobile, enrollmentDate, enrolledBy } = req.body;

    // Validate data
    if (!name || !address || !city || !mobile || !enrollmentDate || !enrolledBy) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    console.log(req.body)
    // SQL query to insert customer data
    const query = `
        INSERT INTO customers (name, address, city, mobile, enrollment_date, enrolled_by)
        VALUES (?, ?, ?, ?, ?, ?)`;

    // Execute the query
    connection.query(query, [name, address, city, mobile, enrollmentDate, enrolledBy], (error, results) => {
        if (error) {
            console.error('Error inserting customer:', error);
            return res.status(500).json({ message: 'Failed to add customer' });
        }

        res.status(200).json({ message: 'Customer added successfully' });
    });
});


router.put('/update-customer/:id', (req, res) => {
    console.log("Received request to update customer");

    const customerId = req.params.id;
    const { name, address, city, mobile, enrollmentDate, enrolledBy } = req.body;

    // Validate data
    if (!name || !address || !city || !mobile || !enrollmentDate || !enrolledBy) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // SQL query to update customer data
    const query = `
        UPDATE customers
        SET name = ?, address = ?, city = ?, mobile = ?, enrollment_date = ?, enrolled_by = ?
        WHERE id = ?`;

    // Execute the query
    connection.query(query, [name, address, city, mobile, enrollmentDate, enrolledBy, customerId], (error, results) => {
        if (error) {
            console.error('Error updating customer:', error);
            return res.status(500).json({ message: 'Failed to update customer' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        console.log('Customer updated successfully:', results);
        res.status(200).json({ message: 'Customer updated successfully' });
    });
});


router.delete('/delete-customer/:id', (req, res) => {
    console.log("Received request to delete customer");

    const customerId = req.params.id;

    // SQL query to delete customer data
    const query = `DELETE FROM customers WHERE id = ?`;

    // Execute the query
    connection.query(query, [customerId], (error, results) => {
        if (error) {
            console.error('Error deleting customer:', error);
            return res.status(500).json({ message: 'Failed to delete customer' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        console.log('Customer deleted successfully:', results);
        res.status(200).json({ message: 'Customer deleted successfully' });
    });
});


module.exports = router;
