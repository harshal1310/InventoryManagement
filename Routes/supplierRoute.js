const express = require('express');
const router = express.Router();
const connection = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');

// Middleware to parse JSON and URL-encoded data
router.use(bodyParser.json()); // Ensure this middleware is applied

let suppliers = [];
let nextId = 1;

// Add new supplier
app.post('/suppliers', (req, res) => {

    const { supplierName, contactPerson, phoneNumber, email, address } = req.body;
    if (!supplierName || !contactPerson || !phoneNumber || !email || !address) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const companyId = req.user.companyId
    const newSupplier = { id: nextId++, supplierName, contactPerson, phoneNumber, email, address };
    suppliers.push(newSupplier);
    res.status(201).json(newSupplier);
});

// Get supplier by ID
app.get('/suppliers/:id', (req, res) => {
    const companyId = req.user.companyId

    const supplier = suppliers.find(s => s.id === parseInt(req.params.id));
    if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(supplier);
});

// Update supplier by ID
app.put('/api/suppliers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const companyId = req.user.companyId

    const { supplierName, contactPerson, phoneNumber, email, address } = req.body;
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
    }
    supplier.supplierName = supplierName;
    supplier.contactPerson = contactPerson;
    supplier.phoneNumber = phoneNumber;
    supplier.email = email;
    supplier.address = address;
    res.json(supplier);
});

// Delete supplier by ID
app.delete('/api/suppliers/:id', (req, res) => {
    const companyId = req.user.companyId

    const id = parseInt(req.params.id);
    suppliers = suppliers.filter(s => s.id !== id);
    res.status(204).end();
});


module.exports = router
