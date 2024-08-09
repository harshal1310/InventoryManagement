const express = require('express');
const router = express.Router();
const connection = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');

// Middleware to parse JSON and URL-encoded data
router.use(bodyParser.json()); // Ensure this middleware is applied

// Route to save an order
router.post('/saveOrder', (req, res) => {
    console.log("Received save order request");

    const companyId = parseInt(req.user.companyId);
    

    const {
        customer_id,
        branch,
        service,
        type,
        products = [], // Array of product objects with name, price, quantity
        subtotal,
        tax_amount,
        total_amount,
        pickup_charge,
        pickup_type,
        delivery_charge,
        delivery_type,
        pickup_date,
        delivery_date
    } = req.body;
    if(!branch )
        return  res.status(500).json({ message: 'Please Add Brach' });

    const checkQuery = `SELECT * FROM customers WHERE mobile = ? AND company_id = ?`;

    connection.query(checkQuery, [customer_id, companyId], (error, results) => {
        if (error) {
            console.error('Error checking customer existence:', error);
            return res.status(500).json({ message: 'Failed to check customer existence' });
        }
        if (results.length < 1) {
            console.log("customer not present")
            return res.status(400).json({ message: 'Customer not present' });
        }
    })

    // 1. Validate the branch_id and company_id
    const branchQuery = `
        SELECT branch_id
        FROM branches
        WHERE branch_name = ? AND company_id = ?
    `;
        console.log(branch)
    connection.query(branchQuery, [branch, companyId], (error, results) => {
        if (error) {
            console.error('Error fetching branch details:', error);
            return res.status(500).json({ message: 'Failed to fetch branch details', error: error.message });
        }

        // Check if a branch was found
        if (results.length === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        console.log(results[0].branch_id)
        // 2. Insert the order into the orders table
        const orderQuery = `
            INSERT INTO orders (
                branch_id, customer_mobile, service, type, subtotal, tax_amount, total_amount, pickup_charge, pickup_type,
                delivery_charge, delivery_type, pickup_date, delivery_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const orderValues = [
            results[0].branch_id,
            customer_id,
            service,
            type,
            subtotal,
            tax_amount,
            total_amount,
            pickup_charge,
            pickup_type,
            delivery_charge,
            delivery_type,
            pickup_date,
            delivery_date
        ];

        connection.query(orderQuery, orderValues, (error, orderResults) => {
            if (error) {
                console.error('Error saving order:', error);
                return res.status(500).json({ message: 'Failed to save order', error: error.message });
            }

            const orderId = orderResults.insertId;
            console.log("Saving order items...");

            // 3. Prepare and insert items into the order_items table
            const itemQuery = `
                INSERT INTO order_items (product_name, quantity, unit_price,order_id)
                VALUES ?
            `;
            const itemValues = products.map(product => [product.name, product.quantity, product.price,  orderId]);

            // Check if itemValues is not empty before executing the query
            if (itemValues.length > 0) {
                connection.query(itemQuery, [itemValues], (error) => {
                    if (error) {
                        console.error('Error saving order items:', error);
                        return res.status(500).json({ message: 'Failed to save order items', error: error.message });
                    }

                    res.status(200).json({ message: 'Order and items saved successfully', orderId });
                });
            } else {
                // If there are no items, return a success message without inserting into the order_items table
                res.status(200).json({ message: 'Order saved successfully with no items', orderId });
            }
        });
    });
});

// Route to get all orders
router.get('/getOrders', (req, res) => {
    console.log("Fetching orders...");
    const companyId = req.user.companyId;
    const branchName = req.query.branchName; // Get branch name from query parameters

    if (!branchName) {
        return res.status(400).json({ message: 'Branch name is required' });
    }

    // First, find the branch_id for the given branchName
    const branchQuery = `
        SELECT branch_id
        FROM branches
        WHERE branch_name = ? AND company_id = ?
    `;

    connection.query(branchQuery, [branchName, companyId], (error, branchResults) => {
        if (error) {
            console.error('Error fetching branch ID:', error);
            return res.status(500).json({ message: 'Failed to fetch branch ID', error: error.message });
        }

        if (branchResults.length === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        const branchId = branchResults[0].branch_id;

        // Now fetch orders for the found branch_id
        const orderQuery = `
            SELECT o.order_id, o.branch_id, o.customer_mobile, o.order_status,o.payment_status,o.service, o.total_amount,o.invoice_generated,
                   c.name AS customer_name, c.address AS customer_address,
                   o.pickup_date, o.delivery_date
            FROM orders o
            LEFT JOIN customers c ON o.customer_mobile = c.mobile
            WHERE o.branch_id = ?
        `;

        connection.query(orderQuery, [branchId], (error, orderResults) => {
            if (error) {
                console.error('Error fetching orders:', error);
                return res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
            }
            console.log("orderResults")
            console.log(orderResults);
            
            res.status(200).json(orderResults);
        });
    });
});

// Route to get details of a specific order
router.get('/getOrder/:id', (req, res) => {
    const orderId = req.params.id;
    console.log(`Fetching details for order ID ${orderId}...`);

    const query = `
        SELECT o.order_id, o.branch_id, o.customer_mobile, o.invoice_generated,o.service, o.type, o.subtotal, o.tax_amount, o.total_amount,
               o.pickup_charge, o.pickup_type, o.delivery_charge, o.delivery_type,
               o.pickup_date, o.delivery_date,
               c.name AS customer_name, c.address AS customer_address, c.city AS customer_city,
               i.product_name AS item_name, i.unit_price AS item_price, i.quantity AS item_quantity
        FROM orders o
        LEFT JOIN customers c ON o.customer_mobile = c.mobile
        LEFT JOIN order_items i ON o.order_id = i.order_id
        WHERE o.order_id = ?
    `;

    connection.query(query, [orderId], (error, results) => {
        if (error) {
            console.error('Error fetching order details:', error);
            return res.status(500).json({ message: 'Failed to fetch order details', error: error.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Process results to include items in the response
        const orderDetails = {
            ...results[0],
            items: results.map(row => ({
                item_name: row.item_name,
                item_price: row.item_price,
                item_quantity: row.item_quantity
            })).filter(item => item.item_name) // Filter out any empty rows
        };

        res.status(200).json(orderDetails);
    });
});


router.post('/updateInvoiceGenerated', (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
    }

    const updateQuery = `
        UPDATE orders
        SET invoice_generated = 1
        WHERE order_id = ?
    `;

    connection.query(updateQuery, [orderId], (error, results) => {
        if (error) {
            console.error('Error updating invoice_generated field:', error);
            return res.status(500).json({ message: 'Failed to update invoice_generated field', error: error.message });
        }

        res.status(200).json({ success: true, message: 'Invoice generated successfully' });
    });
});


module.exports = router;
