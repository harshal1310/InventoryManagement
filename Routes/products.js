const express = require('express');
const router = express.Router();
const connection = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');

// Middleware to parse JSON data
router.use(bodyParser.json());


router.post('/addProducts', (req, res) => {
    const { serviceName, serviceDescription, branchName } = req.body;
    const enrolled_by = req.user.email;
    const companyId = req.user.companyId;

    // Fetch branch_id from branches table
    const branchQuery = 'SELECT branch_id FROM branches WHERE branch_name = ? AND company_id = ?';
    connection.query(branchQuery, [branchName, companyId], (err, results) => {
        if (err) {
            console.error('Error fetching branch_id:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        const branchId = results[0].branch_id;

        // Insert supplier into the suppliers table
        const insertQuery = 'INSERT INTO Service (name, description, price, enrolled_date, enrolled_by, branch_id) VALUES (?, ?, ?, ?, ?, ?)';
        connection.query(insertQuery, [serviceName, serviceDescription, 4, new Date(), enrolled_by, branchId], (err, results) => {
            if (err) {
                console.error('Error inserting supplier:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            return res.status(201).json({ message: 'added succesfully' });
        });
        });
    });


    router.get('/products', (req, res) => {
        console.log("products")
        const { branch } = req.query;
        console.log(branch)
        const companyId = req.user.companyId;
    
        if (!branch) {
            return res.status(400).json({ message: 'Branch name is required' });
        }
       // SELECT Service.*             FROM Service             INNER JOIN branches ON Service.branch_id = branches.branch_id             WHERE branches.branch_name = 'branch1';
        const query = `
            SELECT Service.*
            FROM Service
            INNER JOIN branches ON Service.branch_id = branches.branch_id
            WHERE branches.branch_name = ? and branches.company_id = ?
        `;
    
        connection.query(query, [branch,companyId], (err, results) => {
            if (err) {
                console.error('Error fetching products:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
          //  console.log(results)
            res.json(results);
        });
    });  
  // Update a supplier
  router.put('/api/suppliers/:id', (req, res) => {
    const { id } = req.params;
    const { name, contact_person, phone_number, email, address, company_id, enrollment_date, enrolled_by } = req.body;
  
    const query = 'UPDATE suppliers SET name = ?, contact_person = ?, phone_number = ?, email = ?, address = ?, company_id = ?, enrollment_date = ?, enrolled_by = ? WHERE id = ?';
    connection.query(query, [name, contact_person, phone_number, email, address, company_id, enrollment_date, enrolled_by, id], (err) => {
      if (err) {
        console.error('Error updating supplier:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.json({ message: 'Supplier updated successfully' });
    });
  });
  
  // Delete a supplier
  router.delete('/api/suppliers/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM suppliers WHERE id = ?';
    connection.query(query, [id], (err) => {
      if (err) {
        console.error('Error deleting supplier:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.json({ message: 'Supplier deleted successfully' });
    });
  });

  module.exports = router