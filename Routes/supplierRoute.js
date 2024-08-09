const express = require('express');
const router = express.Router();
const connection = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');

// Middleware to parse JSON and URL-encoded data
router.use(bodyParser.json()); // Ensure this middleware is applied




router.post('/suppliers', (req, res) => {
    const companyId = req.user.companyId;
    const enrolledBy = req.user.email;
    console.log(companyId);
    console.log(enrolledBy);
    console.log(req.body)
    const { supplierName, phoneNumber, address, email } = req.body;
    if (!supplierName || !phoneNumber || !address  || !email ) {
       // console.log(name)
        //console.log(mobile)
        console.log(email)
        console.log(address)
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    const query = 'INSERT INTO suppliers (phone_number, name, address, email, enrollment_date, enrolled_by, company_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
    connection.query(query, [phoneNumber, supplierName, address, enrolledBy,  new Date(), enrolledBy , companyId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ message: 'Added Successfully'});
    });
});

// Get supplier by ID
router.get('/suppliers/:id', (req, res) => {
    const supplierId = parseInt(req.params.id);
    const query = 'SELECT * FROM supplier WHERE id = ?';
    connection.query(query, [supplierId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.json(results[0]);
    });
});

// Update supplier by ID
router.put('/suppliers/:id', (req, res) => {
    const supplierId = parseInt(req.params.id);
    const { name, mobile, address, city, email, enrollment_date, total_orders } = req.body;
    const query = 'UPDATE supplier SET name = ?, mobile = ?, address = ?, city = ?, email = ?, enrollment_date = ?, total_orders = ? WHERE id = ?';
    connection.query(query, [name, mobile, address, city, email, enrollment_date, total_orders, supplierId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.json({ id: supplierId, name, mobile, address, city, email, enrollment_date, total_orders });
    });
});

// Delete supplier by ID
router.delete('/suppliers/:id', (req, res) => {
    const supplierId = parseInt(req.params.id);
    const query = 'DELETE FROM supplier WHERE id = ?';
    connection.query(query, [supplierId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.status(204).end();
    });
});
module.exports = router
