const mysql = require('mysql2');

require('dotenv').config(); 


const dbNamePattern = /(^[a-z_][a-z0-9_]*$)|(^$)/;
// Create a connection to the MySQL database
const dbName = process.env.DB_NAME;

if (!dbNamePattern.test(dbName)) {
    throw new Error(`Database name "${dbName}" does not match the required pattern: /^[a-z_][a-z0-9_]*$/`);
}
/*
const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.PORT
});*/
const dbUrl = new URL(process.env.DB_URL);

const connection = mysql.createConnection({
    host: dbUrl.hostname,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1), // Remove the leading '/'
    port: dbUrl.port
});



connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the PostgreSQL database!');

    // List of table creation queries
    const tableQueries = [
        `CREATE TABLE IF NOT EXISTS branches (
            branch_id SERIAL PRIMARY KEY,
            branch_name VARCHAR(255) NOT NULL,
            branch_location VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            company_id INT REFERENCES companies(company_id),
            email VARCHAR(100) NOT NULL
        );`,

        `CREATE TABLE IF NOT EXISTS companies (
            company_id SERIAL PRIMARY KEY,
            company_name VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY,
            mobile VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            address VARCHAR(255),
            city VARCHAR(100),
            email VARCHAR(100),
            enrollment_date DATE,
            enrolled_by VARCHAR(50),
            total_orders INT DEFAULT 0,
            company_id INT REFERENCES companies(company_id)
        );`,

        `CREATE TABLE IF NOT EXISTS invoices (
            id SERIAL PRIMARY KEY,
            order_id INT UNIQUE NOT NULL REFERENCES orders(order_id),
            pdf_data BYTEA NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS orders (
            order_id SERIAL PRIMARY KEY,
            branch_id INT NOT NULL REFERENCES branches(branch_id),
            customer_mobile VARCHAR(20) NOT NULL REFERENCES customers(mobile),
            service VARCHAR(255),
            type VARCHAR(50),
            subtotal DECIMAL(10,2),
            tax_amount DECIMAL(10,2),
            total_amount DECIMAL(10,2),
            pickup_charge DECIMAL(10,2),
            pickup_type VARCHAR(50),
            delivery_charge DECIMAL(10,2),
            delivery_type VARCHAR(50),
            pickup_date DATE,
            delivery_date DATE,
            order_status VARCHAR(50) DEFAULT 'pending',
            payment_status VARCHAR(50) DEFAULT 'unpaid',
            invoice_generated INT DEFAULT 0
        );`,

        `CREATE TABLE IF NOT EXISTS order_items (
            item_id SERIAL PRIMARY KEY,
            order_id INT NOT NULL REFERENCES orders(order_id),
            product_name VARCHAR(255) NOT NULL,
            quantity INT NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
        );`,

        `CREATE TABLE IF NOT EXISTS service (
            service_id SERIAL PRIMARY KEY,
            branch_id INT REFERENCES branches(branch_id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            enrolled_date DATE,
            enrolled_by VARCHAR(100)
        );`,

        `CREATE TABLE IF NOT EXISTS users1 (
            user_id SERIAL PRIMARY KEY,
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            email VARCHAR(100) UNIQUE NOT NULL,
            phone VARCHAR(20),
            password_hash VARCHAR(255) NOT NULL,
            company_id INT REFERENCES companies(company_id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`
    ];

    // Execute each query in sequence
    tableQueries.forEach(query => {
        client.query(query, (err, res) => {
            if (err) {
                console.error('Error creating table:', err.stack);
            } else {
                console.log('Table created or already exists:', res.command);
            }
        });
    });

    // Close the connection after queries are executed
    connection.end((err) => {
        if (err) {
            console.error('Error closing the connection:', err);
        } else {
            console.log('Database connection closed.');
        }
    });
});

module.exports = connection;