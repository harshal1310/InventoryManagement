const express = require('express');
const router = express.Router();
const pool = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');

router.use(bodyParser.json());
router.use(express.urlencoded({ extended: true }));

// Helper function to wrap query in a promise
function queryDatabase(query, params = []) {
    return pool.query(query, params)
        .then(result => result.rows)
        .catch(error => { throw error; });
}

// Dashboard sales route
router.get('/dashboardSales', async (req, res) => {
    try {
        // Define the queries
        const queries = [
            { sql: 'SELECT SUM(total_amount) AS total_sales FROM orders', params: [], key: 'totalSales' },
            { sql: 'SELECT COUNT(*) AS todays_delivery FROM orders WHERE delivery_date::date = CURRENT_DATE', params: [], key: 'todaysDelivery' },
            { sql: 'SELECT COUNT(*) AS todays_orders FROM orders WHERE DATE(pickup_date) = CURRENT_DATE', params: [], key: 'todaysOrders' },
            { sql: 'SELECT SUM(total_amount) AS payment_received FROM orders WHERE payment_status = $1', params: ['paid'], key: 'paymentReceived' },
            { sql: 'SELECT COUNT(*) AS total_orders FROM orders', params: [], key: 'totalOrders' },
            { sql: 'SELECT COUNT(*) AS pending_orders FROM orders WHERE order_status = $1', params: ['pending'], key: 'pendingOrders' },
            { sql: 'SELECT COUNT(*) AS completed_orders FROM orders WHERE order_status = $1', params: ['completed'], key: 'completedOrders' },
            { sql: 'SELECT COUNT(DISTINCT customer_mobile) AS todays_customers FROM orders WHERE DATE(pickup_date) = CURRENT_DATE', params: [], key: 'todaysCustomers' },
            { sql: 'SELECT COUNT(DISTINCT customer_mobile) AS this_month_customers FROM orders WHERE EXTRACT(MONTH FROM pickup_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM pickup_date) = EXTRACT(YEAR FROM CURRENT_DATE)', params: [], key: 'thisMonthCustomers' },
            { sql: 'SELECT SUM(total_amount) AS today_collected_amount FROM orders WHERE payment_status = $1 AND DATE(pickup_date) = CURRENT_DATE', params: ['paid'], key: 'todayCollectedAmount' },
            { sql: 'SELECT order_id AS invoiceNumber, customer_mobile AS customer, pickup_date AS date, total_amount AS amount, delivery_date AS time, order_status AS status FROM orders ORDER BY order_id DESC LIMIT 10', params: [], key: 'last10Invoices' }
        ];

        // Execute queries and handle results
        const results = await Promise.all(queries.map(query => queryDatabase(query.sql, query.params)
            .then(result => ({ key: query.key, data: result }))
            .catch(err => ({ key: query.key, error: err }))
        ));

        // Transform results into a response object
        const response = results.reduce((acc, result) => {
            if (result.error) {
                console.error(`Error executing query for ${result.key}:`, result.error);
                return acc;
            }
            acc[result.key] = result.data[0] || {};
            return acc;
        }, {});

        res.json({
            totalSales: response.totalSales.total_sales || 0,
            todaysDelivery: response.todaysDelivery.todays_delivery || 0,
            todaysOrders: response.todaysOrders.todays_orders || 0,
            paymentReceived: response.paymentReceived.payment_received || 0,
            totalOrders: response.totalOrders.total_orders || 0,
            pendingOrders: response.pendingOrders.pending_orders || 0,
            completedOrders: response.completedOrders.completed_orders || 0,
            todaysCustomers: response.todaysCustomers.todays_customers || 0,
            thisMonthCustomers: response.thisMonthCustomers.this_month_customers || 0,
            todayCollectedAmount: response.todayCollectedAmount.today_collected_amount || 0,
            last10Invoices: response.last10Invoices || []
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Define other routes similarly...
module.exports = router;
