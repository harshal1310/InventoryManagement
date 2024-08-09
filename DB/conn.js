const { Client } = require('pg');
require('dotenv').config(); 

const dbUrl = process.env.DB_URL;

// Create a connection to the PostgreSQL database using the URL
const connection = new Client({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false // For self-signed certificates; set to `true` if using a trusted certificate
    }
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the PostgreSQL database!');

    // List of table creation queries in the correct order
    const tableQueries = [
        `CREATE TABLE IF NOT EXISTS companies (
            company_id SERIAL PRIMARY KEY,
            company_name VARCHAR(255)  NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS branches (
            branch_id SERIAL PRIMARY KEY,
            branch_name VARCHAR(255) NOT NULL,
            branch_location VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            company_id INT REFERENCES companies(company_id),
            email VARCHAR(100) NOT NULL
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

        `CREATE TABLE IF NOT EXISTS invoices (
            id SERIAL PRIMARY KEY,
            order_id INT UNIQUE NOT NULL REFERENCES orders(order_id),
            pdf_data BYTEA NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    const executeQueries = async () => {
        for (const query of tableQueries) {
            try {
                const res = await connection.query(query);
                console.log('Table created or already exists:', res.command);
            } catch (err) {
                console.error('Error creating table:', err.stack);
            }
        }

        
    };

    executeQueries();
});

module.exports = connection;