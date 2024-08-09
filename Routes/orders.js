const express = require('express');
const router = express.Router();
const pool = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');

// Middleware to parse JSON and URL-encoded data
router.use(bodyParser.json()); // Ensure this middleware is applied

// Helper function to execute queries
async function queryDatabase(query, params = []) {
    try {
        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        throw new Error(error);
    }
}

// Route to save an order
router.post('/saveOrder', async (req, res) => {
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

    if (!branch) return res.status(500).json({ message: 'Please Add Branch' });

    try {
        // Check if customer exists
        const checkQuery = `SELECT * FROM customers WHERE mobile = $1 AND company_id = $2`;
        const customerResults = await queryDatabase(checkQuery, [customer_id, companyId]);

        if (customerResults.length < 1) {
            console.log("Customer not present");
            return res.status(400).json({ message: 'Customer not present' });
        }

        // Validate branch
        const branchQuery = `SELECT branch_id FROM branches WHERE branch_name = $1 AND company_id = $2`;
        const branchResults = await queryDatabase(branchQuery, [branch, companyId]);

        if (branchResults.length === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        const branchId = branchResults[0].branch_id;

        // Insert order
        const orderQuery = `
            INSERT INTO orders (
                branch_id, customer_mobile, service, type, subtotal, tax_amount, total_amount, pickup_charge, pickup_type,
                delivery_charge, delivery_type, pickup_date, delivery_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING order_id
        `;
        const orderValues = [
            branchId,
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
        const orderResults = await queryDatabase(orderQuery, orderValues);
        const orderId = orderResults[0].order_id;
        console.log("Saving order items...");

        // Insert items
        const itemQuery = `
            INSERT INTO order_items (product_name, quantity, unit_price, order_id)
            VALUES ${products.map((_, i) => `($1, $2, $3, $${i + 4})`).join(', ')}
        `;
        const itemValues = products.flatMap(product => [product.name, product.quantity, product.price, orderId]);

        if (products.length > 0) {
            await queryDatabase(itemQuery, itemValues);
        }

        res.status(200).json({ message: 'Order and items saved successfully', orderId });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ message: 'Failed to save order', error: error.message });
    }
});

// Route to get all orders
router.get('/getOrders', async (req, res) => {
    console.log("Fetching orders...");
    const companyId = req.user.companyId;
    const branchName = req.query.branchName;

    if (!branchName) {
        return res.status(400).json({ message: 'Branch name is required' });
    }

    try {
        // Find branch_id
        const branchQuery = `SELECT branch_id FROM branches WHERE branch_name = $1 AND company_id = $2`;
        const branchResults = await queryDatabase(branchQuery, [branchName, companyId]);

        if (branchResults.length === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        const branchId = branchResults[0].branch_id;

        // Fetch orders
        const orderQuery = `
            SELECT o.order_id, o.branch_id, o.customer_mobile, o.order_status, o.payment_status, o.service, o.total_amount, o.invoice_generated,
                   c.name AS customer_name, c.address AS customer_address,
                   o.pickup_date, o.delivery_date
            FROM orders o
            LEFT JOIN customers c ON o.customer_mobile = c.mobile
            WHERE o.branch_id = $1
        `;

        const orderResults = await queryDatabase(orderQuery, [branchId]);

        res.status(200).json(orderResults);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
});

// Route to get details of a specific order
router.get('/getOrder/:id', async (req, res) => {
    const orderId = req.params.id;
    console.log(`Fetching details for order ID ${orderId}...`);

    try {
        const query = `
            SELECT o.order_id, o.branch_id, o.customer_mobile, o.invoice_generated, o.service, o.type, o.subtotal, o.tax_amount, o.total_amount,
                   o.pickup_charge, o.pickup_type, o.delivery_charge, o.delivery_type,
                   o.pickup_date, o.delivery_date,
                   c.name AS customer_name, c.address AS customer_address, c.city AS customer_city,
                   i.product_name AS item_name, i.unit_price AS item_price, i.quantity AS item_quantity
            FROM orders o
            LEFT JOIN customers c ON o.customer_mobile = c.mobile
            LEFT JOIN order_items i ON o.order_id = i.order_id
            WHERE o.order_id = $1
        `;

        const results = await queryDatabase(query, [orderId]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const orderDetails = {
            ...results[0],
            items: results.map(row => ({
                item_name: row.item_name,
                item_price: row.item_price,
                item_quantity: row.item_quantity
            })).filter(item => item.item_name) // Filter out any empty rows
        };

        res.status(200).json(orderDetails);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Failed to fetch order details', error: error.message });
    }
});

// Route to update invoice_generated
router.post('/updateInvoiceGenerated', async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
    }

    try {
        const updateQuery = `
            UPDATE orders
            SET invoice_generated = 1
            WHERE order_id = $1
        `;

        await queryDatabase(updateQuery, [orderId]);

        res.status(200).json({ success: true, message: 'Invoice generated successfully' });
    } catch (error) {
        console.error('Error updating invoice_generated field:', error);
        res.status(500).json({ message: 'Failed to update invoice_generated field', error: error.message });
    }
});

module.exports = router;
