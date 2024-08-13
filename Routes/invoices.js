const express = require('express');
const router = express.Router();
const pool = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { connect } = require('http2');

// Middleware to parse JSON and URL-encoded data
router.use(bodyParser.json());
router.use(express.urlencoded({ extended: true }));

// Promisify fs methods
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Directory to save invoices
const invoicesDir = path.join(__dirname, '../invoices'); // Adjust path as needed

// Ensure directory exists
if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
}


router.post('/generateInvoice', async (req, res) => {
    const { orderId, mobile, pickupDate, deliveryDate, service, totalAmount } = req.body;
    const companyId = req.user.companyId;

    try {
        // Fetch order items from the database
        const orderItemsQuery = `
            SELECT oi.*, oi.product_name
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN branches b ON o.branch_id = b.branch_id
            WHERE oi.order_id = $1 AND b.company_id = $2
        `;
        const orderItemsResult = await pool.query(orderItemsQuery, [orderId, companyId]);
        const orderItems = orderItemsResult.rows;

        // Validate and default the totalAmount if undefined
        const validatedTotalAmount = parseFloat(totalAmount) || 0;

        // Create a PDF document
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', async () => {
            const pdfData = Buffer.concat(chunks);
            const filePath = path.join(invoicesDir, `Invoice-${orderId}.pdf`);

            try {
                // Save PDF data to a file
                await writeFile(filePath, pdfData);

                // Save PDF data to PostgreSQL
                const saveInvoiceSql = `
                    INSERT INTO invoices (order_id, pdf_data) 
                    VALUES ($1, $2)
                    ON CONFLICT (order_id) 
                    DO UPDATE SET pdf_data = EXCLUDED.pdf_data`;
                await pool.query(saveInvoiceSql, [orderId, pdfData]);

                // Update the order to indicate that the invoice has been generated
                const updateOrderSql = 'UPDATE orders SET invoice_generated = 1 WHERE order_id = $1';
                await pool.query(updateOrderSql, [orderId]);
                console.log("invoice generated succesfully")

                res.status(200).json({ success: true, message: 'Invoice generated successfully', filePath: `/invoices/Invoice-${orderId}.pdf` });
            } catch (err) {
                console.error('Error saving invoice:', err);
                res.status(500).json({ success: false, message: 'Error saving invoice' });
            }
        });

        // Invoice Title
        doc.fontSize(28).fillColor('#c76334').text('PROFORMA INVOICE', { align: 'center' });
        doc.moveDown();

        // Company information
        doc.fontSize(12).fillColor('black').text('Zylker Design Labs', { align: 'right' });
        doc.text('14B, Northern Street, Greater South Avenue', { align: 'right' });
        doc.text('New York, New York 10001, U.S.A', { align: 'right' });
        doc.moveDown();

        // Bill To & Ship To
        doc.fontSize(14).text('Bill To:', { underline: true });
        doc.fontSize(12).text('Jack Little');
        doc.text('3242 Chandler Hollow Road');
        doc.text('Pittsburgh, 15222 Pennsylvania');
        doc.moveDown();

        doc.text('Ship To:', { underline: true });
        doc.text('3242 Chandler Hollow Road');
        doc.text('Pittsburgh, 15222 Pennsylvania');
        doc.moveDown();

        // Invoice Details
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#c76334'); // Horizontal line
        doc.moveDown(1);
        doc.text(`Invoice #: INV-${orderId}`, { align: 'right' });
        doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.text('Terms: Due on Receipt', { align: 'right' });
        doc.text(`Due Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown(2);

        // Table Header with adjusted margins and alignment
        const startX = 50;
        const descriptionX = 90;  // Item description starts here
        const qtyX = 110;          // Quantity column position
        const rateX = 140;         // Rate column position
        const amountX = 180;       // Amount column position

        doc.fillColor('#c76334').fontSize(12)
            .text('#', startX, doc.y, { continued: true })
            .text('Item & Description', descriptionX, doc.y, { continued: true })
            .text('Qty', qtyX, doc.y, { align: 'center', continued: true })
            .text('Rate', rateX, doc.y, { align: 'center', continued: true })
            .text('Amount', amountX, doc.y, { align: 'center' });

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#c76334'); // Horizontal line
        doc.moveDown(0.5);

        // Table Body
        let itemNumber = 1;
        orderItems.forEach(item => {
            const unitPrice = parseFloat(item.unit_price) || 0;
            const totalPrice = parseFloat(item.total_price) || 0;
            const unitPriceFormatted = unitPrice.toFixed(2);
            const totalPriceFormatted = totalPrice.toFixed(2);

            doc.fillColor('black').fontSize(12)
                .text(itemNumber++, startX, doc.y, { continued: true })
                .text(item.product_name, descriptionX, doc.y, { continued: true })
                .text(item.quantity.toString(), qtyX, doc.y, { align: 'center', continued: true })
                .text(unitPriceFormatted, rateX, doc.y, { align: 'center', continued: true })
                .text(totalPriceFormatted, amountX, doc.y, { align: 'center' });
            doc.moveDown(1);
        });

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#c76334'); // Horizontal line

        // Totals section
        doc.moveDown(2);
        doc.text('Sub Total:', rateX, doc.y, { align: 'right', continued: true });
        doc.text(validatedTotalAmount.toFixed(2), amountX, doc.y, { align: 'right' });
        doc.moveDown(0.5);
        doc.text('Tax Rate:', rateX, doc.y, { align: 'right', continued: true });
        doc.text('5%', amountX, doc.y, { align: 'right' });
        doc.moveDown(0.5);
        doc.fontSize(16).text('Total:', rateX, doc.y, { align: 'right', continued: true });
        doc.text(validatedTotalAmount.toFixed(2), amountX, doc.y, { align: 'right' });
        doc.moveDown(2);

        // Terms & Conditions
        doc.fontSize(12).text('Terms & Conditions:', { underline: true });
        doc.text('All payments must be made in full before the commencement of any design work.');

        doc.end();

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ success: false, message: 'Error generating invoice' });
    }
});
router.get('/invoices/:fileName', (req, res) => {
    const filePath = path.join(invoicesDir, req.params.fileName);
    res.sendFile(filePath);
});

router.get('/getInvoice/:orderId', async (req, res) => {
    console.log("getinvocie")
    const { orderId } = req.params;

    try {
        // Retrieve PDF data from PostgreSQL
        const sql = 'SELECT pdf_data FROM invoices WHERE order_id = $1';
        const result = await pool.query(sql, [orderId]);

        if (result.rows.length > 0) {
            const pdfData = result.rows[0].pdf_data;
            res.contentType('application/pdf');
            res.send(pdfData);
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (err) {
        console.error('Error retrieving invoice from database:', err);
        res.status(500).json({ message: 'Error retrieving invoice' });
    }
});

router.get('/getinvoices', async (req, res) => {
    console.log("in voces")
    const companyId = req.user.companyId
    try {
        const invoices = await pool.query(
            `SELECT o.order_id AS invoiceNumber,
            o.customer_mobile AS Number, 
            c.name AS customer, 
            o.delivery_date AS date, 
            o.total_amount AS amount, 
            o.order_status AS orderStatus, 
            o.payment_status AS paymentStatus 
     FROM orders o 
     JOIN customers c ON o.customer_mobile = c.mobile 
     JOIN branches b ON o.branch_id = b.branch_id 
     WHERE b.company_id = $1 
     ORDER BY o.order_id DESC`,
    [companyId]             
        );
        res.status(201).json(invoices.rows);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});
module.exports = router;
