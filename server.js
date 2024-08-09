const express = require('express');
const path = require('path');
const connection = require('./DB/conn.js');
const bodyParser = require('body-parser');
const cors= require('cors');
const crypto = require('crypto');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const jwtSecret = '1234'

//const multer = require("multer");
//const nodemailer = require('nodemailer');
/*const jobRoutes = require('./Routes/JobRoute.js');
const authRoute = require('./Routes/AuthRoute.js');
const candidatesRoute = require('./routes/candidatesRoute');

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cron = require('node-cron');
*/
const customerRoutes = require('./Routes/customers'); // Import the customer routes
const orderRoutes = require('./Routes/orders');
const settings = require('./Routes/settingSchema');
const supplier = require('./Routes/supplierRoute.js')
const products = require('./Routes/products.js')
const invoices = require('./Routes/invoices.js')
const dashboard = require('./Routes/dashboard.js')
//const users = require("./Routes/users");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));


app.use(cookieParser());



// Serve static files (HTML, CSS, JavaScript)
app.use(express.static(path.join(__dirname, 'public')));


const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            return res.sendFile(path.join(__dirname, 'public', 'login.html'));
        }

        req.user = user;
        next();
    });
};


app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/',authenticateToken,(req,res)=> {
    console.log("default")
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
})
app.get('/customers', authenticateToken,(req, res) => {
    console.log(req.user)
    res.sendFile(path.join(__dirname, 'public', 'customers.html'));
});

app.get('/create-order', authenticateToken,(req, res) => {
    console.log(req.user)
    res.sendFile(path.join(__dirname, 'public', 'create-order.html'));
});

app.get('/view-orders', authenticateToken,(req, res) => {
    console.log(req.user)
    res.sendFile(path.join(__dirname, 'public', 'view-orders.html'));
});
app.get('/add-branches', authenticateToken,(req, res) => {
    console.log(req.user)
    res.sendFile(path.join(__dirname, 'public', 'add-branches.html'));
});

app.get('/add-user', authenticateToken,(req, res) => {
    console.log(req.user)
    res.sendFile(path.join(__dirname, 'public', 'add-user.html'));
});
app.get('/add-services', authenticateToken,(req, res) => {
    console.log(req.user)
    res.sendFile(path.join(__dirname, 'public', 'add-services.html'));
});






//app.use("/api",users);
app.get('/login',(req,res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/dashboard',authenticateToken,(req,res)=>{
res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
app.get('/order',authenticateToken,(req,res)=>{
    console.log("in order")
    const orderid = req.query.id
    res.sendFile(path.join(__dirname, 'public', 'specific-order.html'));
    });
    

app.use('/api',authenticateToken,settings);
app.use('/api',authenticateToken,supplier);
app.use('/api',authenticateToken,products);
app.use('/api',authenticateToken, customerRoutes);
app.use('/api',authenticateToken,orderRoutes);
app.use('/api',authenticateToken,invoices);
app.use('/api',authenticateToken,dashboard);




app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    console.log(email);
    console.log(password);

    const query = 'SELECT * FROM users1 WHERE email = ?';
    connection.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        console.log(results)

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = results[0];

        // Verify password
        const passwordIsValid = await bcrypt.compare(password, user.password_hash);

        if (!passwordIsValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ email: user.email, companyId: user.company_id }, jwtSecret, { expiresIn: '1d' });
        res.cookie('token', token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });

        res.json({ message: 'Login successful' });
    });
});



app.post('/signup', async (req, res) => {
    console.log("In signup");

    const { companyName, email, password, phone } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Function to insert company and return companyId
    const insertCompany = () => {
        return new Promise((resolve, reject) => {
            const companyQuery = 'INSERT INTO companies (company_name) VALUES (?)';
            connection.query(companyQuery, [companyName], (err, results) => {
                if (err) {
                    console.error('Error inserting company:', err);
                    return reject(new Error('Internal server error.'));
                }
                resolve(results.insertId);
            });
        });
    };

    try {
        const companyId = await insertCompany();

        // Insert user into the database
        const userQuery = 'INSERT INTO users1 (email, phone, password_hash, company_id) VALUES (?, ?, ?, ?)';
        connection.query(userQuery, [email, phone, hashedPassword, companyId], (err) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).json({ message: 'Internal server error.' });
            }
            const token = jwt.sign({ email, companyId }, jwtSecret, { expiresIn: "1d" });
            res.cookie('token', token, { maxAge: 24 * 60 * 60 * 1000 });
            res.status(201).json({ message: 'User and company created successfully.' });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add your other routes an


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});