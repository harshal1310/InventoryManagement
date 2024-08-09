const express = require('express');
const router = express.Router();
const connection = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(express.urlencoded({ extended: true }));


// Helper function to wrap callback-based query in a promise
function queryDatabase(query, params = [], callback) {
    connection.query(query, params, (error, results) => {
        if (error) {
            return callback(error, null);
        }
        callback(null, results);
    });
}

// Dashboard sales route
router.get('/dashboardSales', (req, res) => {
    // Helper to handle multiple queries
    const handleQueryResults = (queries, callback) => {
        let results = {};
        let completedQueries = 0;
        let hasError = false;

        const checkDone = (err, result, key) => {
            if (hasError) return;
            if (err) {
                hasError = true;
                callback(err, null);
                return;
            }
            results[key] = result;
            completedQueries++;
            if (completedQueries === queries.length) {
                callback(null, results);
            }
        };

        queries.forEach((query, index) => {
            queryDatabase(query.sql, query.params, (err, result) => {
                if (err) {
                    console.error(`Error executing query for ${query.key}:`, err);
                }
                checkDone(err, result, query.key);
            });
        });
    };

    // Define the queries
    const queries = [
        { sql: 'SELECT SUM(total_amount) AS total_sales FROM orders', params: [], key: 'totalSales' },
        { sql: 'SELECT COUNT(*) AS todays_delivery FROM orders WHERE delivery_date = CURDATE()', params: [], key: 'todaysDelivery' },
        { sql: 'SELECT COUNT(*) AS todays_orders FROM orders WHERE DATE(pickup_date) = CURDATE()', params: [], key: 'todaysOrders' },
        { sql: 'SELECT SUM(total_amount) AS payment_received FROM orders WHERE payment_status = "paid"', params: [], key: 'paymentReceived' },
        { sql: 'SELECT COUNT(*) AS total_orders FROM orders', params: [], key: 'totalOrders' },
        { sql: 'SELECT COUNT(*) AS pending_orders FROM orders WHERE order_status = "pending"', params: [], key: 'pendingOrders' },
        { sql: 'SELECT COUNT(*) AS completed_orders FROM orders WHERE order_status = "completed"', params: [], key: 'completedOrders' },
        { sql: 'SELECT COUNT(DISTINCT customer_mobile) AS todays_customers FROM orders WHERE DATE(pickup_date) = CURDATE()', params: [], key: 'todaysCustomers' },
        { sql: 'SELECT COUNT(DISTINCT customer_mobile) AS this_month_customers FROM orders WHERE MONTH(pickup_date) = MONTH(CURDATE()) AND YEAR(pickup_date) = YEAR(CURDATE())', params: [], key: 'thisMonthCustomers' },
        { sql: 'SELECT SUM(total_amount) AS today_collected_amount FROM orders WHERE payment_status = "paid" AND DATE(pickup_date) = CURDATE()', params: [], key: 'todayCollectedAmount' },
        { sql: 'SELECT SUM(total_amount) AS today_collected_amount FROM orders WHERE payment_status = "paid" AND DATE(pickup_date) = CURDATE()', params: [], key: 'todayCollectedAmount' },
        { sql: 'SELECT order_id AS invoiceNumber, customer_mobile AS customer, pickup_date AS date, total_amount AS amount, delivery_date AS time, order_status AS status FROM orders ORDER BY order_id DESC LIMIT 10', params: [], key: 'last10Invoices' }
    ];

    // Execute queries and handle results
    handleQueryResults(queries, (err, results) => {
        if (err) {
            console.error('Error fetching dashboard data:', err);
            res.status(500).json({ error: 'Failed to fetch dashboard data' });
        } else {
            // Check if each result is defined before accessing
            res.json({
                totalSales: results.totalSales && results.totalSales[0] ? results.totalSales[0].total_sales : 0,
                todaysDelivery: results.todaysDelivery && results.todaysDelivery[0] ? results.todaysDelivery[0].todays_delivery : 0,
                todaysOrders: results.todaysOrders && results.todaysOrders[0] ? results.todaysOrders[0].todays_orders : 0,
                paymentReceived: results.paymentReceived && results.paymentReceived[0] ? results.paymentReceived[0].payment_received : 0,
                totalOrders: results.totalOrders && results.totalOrders[0] ? results.totalOrders[0].total_orders : 0,
                pendingOrders: results.pendingOrders && results.pendingOrders[0] ? results.pendingOrders[0].pending_orders : 0,
                completedOrders: results.completedOrders && results.completedOrders[0] ? results.completedOrders[0].completed_orders : 0,
                todaysCustomers: results.todaysCustomers && results.todaysCustomers[0] ? results.todaysCustomers[0].todays_customers : 0,
                thisMonthCustomers: results.thisMonthCustomers && results.thisMonthCustomers[0] ? results.thisMonthCustomers[0].this_month_customers : 0,
                todayCollectedAmount: results.todayCollectedAmount && results.todayCollectedAmount[0] ? results.todayCollectedAmount[0].today_collected_amount : 0,
                thisMonthExpense: results.thisMonthExpense && results.thisMonthExpense[0] ? results.thisMonthExpense[0].this_month_expense : 0,
                last10Invoices: results.last10Invoices || []
            });
        }
    });
});
// Define the other functions similarly...
module.exports = router