const express = require('express');
const router = express.Router();
const connection = require('../DB/conn.js'); // Adjust the path as needed
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');


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
    const companyId = req.user.companyId 

    try {
        // Fetch order items from the database
        const orderItemsQuery = 'SELECT * FROM order_items WHERE order_id = ?';
        const [orderItems] = await connection.promise().query(orderItemsQuery, [orderId]);

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

                // Save PDF data to MySQL
                const saveInvoiceSql = 'INSERT INTO invoices (order_id, pdf_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE pdf_data = VALUES(pdf_data)';
                await connection.promise().query(saveInvoiceSql, [orderId, pdfData]);

                // Update the order to indicate that the invoice has been generated
                const updateOrderSql = 'UPDATE orders SET invoice_generated = 1 WHERE order_id = ?';
                await connection.promise().query(updateOrderSql, [orderId]);

                res.status(200).json({ success: true, message: 'Invoice generated successfully', filePath: `/invoices/Invoice-${orderId}.pdf` });
            } catch (err) {
                console.error('Error saving invoice:', err);
                res.status(500).json({ success: false, message: 'Error saving invoice' });
            }
        });
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
        const descriptionX = 150;  // Moved slightly to the right
        const qtyX = 320;          // Aligned to be visible on screen
        const rateX = 400;         // Moved slightly to the right
        const amountX = 480;       // Moved to the right edge

        doc.fillColor('#c76334').fontSize(12)
            .text('#', startX, doc.y, { continued: true })
            .text('Item & Description', descriptionX, doc.y, { continued: true })
            .text('Qty', qtyX, doc.y, { align: 'center', continued: true })
            .text('Rate', rateX, doc.y, { align: 'right', continued: true })
            .text('Amount', amountX, doc.y, { align: 'right' });

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
                .text(unitPriceFormatted, rateX, doc.y, { align: 'right', continued: true })
                .text(totalPriceFormatted, amountX, doc.y, { align: 'right' });
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

        doc.end();   } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ success: false, message: 'Error generating invoice' });
    }
});

//router.post('/generateInvoice', async (req, res) => {
   /* const { orderId, mobile, pickupDate, deliveryDate, service, totalAmount } = req.body;

    try {
        // Fetch order items from the database
        const orderItemsQuery = 'SELECT * FROM order_items WHERE order_id = ?';
        const [orderItems] = await connection.promise().query(orderItemsQuery, [orderId]);

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

                // Save PDF data to MySQL
                const saveInvoiceSql = 'INSERT INTO invoices (order_id, pdf_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE pdf_data = VALUES(pdf_data)';
                await connection.promise().query(saveInvoiceSql, [orderId, pdfData]);

                // Update the order to indicate that the invoice has been generated
                const updateOrderSql = 'UPDATE orders SET invoice_generated = 1 WHERE order_id = ?';
                await connection.promise().query(updateOrderSql, [orderId]);

                res.status(200).json({ success: true, message: 'Invoice generated successfully', filePath: `/invoices/Invoice-${orderId}.pdf` });
            } catch (err) {
                console.error('Error saving invoice:', err);
                res.status(500).json({ success: false, message: 'Error saving invoice' });
            }
        });

        doc.fontSize(16).text('Invoice', { align: 'left' });
        doc.fontSize(12).text(`Invoice #: INV-${orderId}`);
        doc.text(`Created: ${new Date().toLocaleDateString()}`);

        doc.moveDown().font('Helvetica-Bold').text('Sender Address:');
        doc.font('Helvetica').text('Zylker Thread & Weave');
        doc.text('148, Northern Street, Greater South Avenue');
        doc.text('New York, New York 10001, U.S.A');

        doc.moveDown().font('Helvetica-Bold').text('Recipient Address:');
        doc.font('Helvetica').text(`Customer Mobile: ${mobile}`);
        doc.text(`Pickup Date: ${pickupDate}`);
        doc.text(`Delivery Date: ${deliveryDate}`);
        doc.text(`Service: ${service}`);

        doc.moveDown().font('Helvetica-Bold').text('Item & Description');
        doc.text('Quantity', { align: 'center' });
        doc.text('Unit Price', { align: 'right' });
        doc.text('Total Price', { align: 'right' });

        let yPosition = 250; // Starting Y position for items
        orderItems.forEach(item => {
            const unitPrice = parseFloat(item.unit_price);
            const totalPrice = parseFloat(item.total_price);
            const unitPriceFormatted = isNaN(unitPrice) ? '0.00' : unitPrice.toFixed(2);
            const totalPriceFormatted = isNaN(totalPrice) ? '0.00' : totalPrice.toFixed(2);

            doc.font('Helvetica').text(item.product_name, 14, yPosition, { continued: true });
            doc.text(item.quantity.toString(), 100, yPosition, { align: 'center', continued: true });
            doc.text(unitPriceFormatted, 150, yPosition, { align: 'right', continued: true });
            doc.text(totalPriceFormatted, 200, yPosition, { align: 'right' });
            yPosition += 20;
        });

        doc.moveDown().font('Helvetica-Bold').text('Terms & Conditions:');
        doc.font('Helvetica').text('Full payment is due upon receipt of this invoice.');

        doc.end();


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

        // Table Header
        doc.fillColor('#c76334').fontSize(12).text('#', 50, doc.y, { continued: true });
        doc.text('Item & Description', 100, doc.y, { continued: true });
        doc.text('Qty', 300, doc.y, { align: 'center', continued: true });
        doc.text('Rate', 380, doc.y, { align: 'right', continued: true });
        doc.text('Amount', 450, doc.y, { align: 'right' });
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#c76334'); // Horizontal line
        doc.moveDown(0.5);

        // Table Body
        let itemNumber = 1;
        orderItems.forEach(item => {
            const unitPrice = parseFloat(item.unit_price);
            const totalPrice = parseFloat(item.total_price);
            const unitPriceFormatted = isNaN(unitPrice) ? '0.00' : unitPrice.toFixed(2);
            const totalPriceFormatted = isNaN(totalPrice) ? '0.00' : totalPrice.toFixed(2);

            doc.fillColor('black').fontSize(12).text(itemNumber++, 50, doc.y, { continued: true });
            doc.text(item.product_name, 100, doc.y, { continued: true });
            doc.text(item.quantity.toString(), 300, doc.y, { align: 'center', continued: true });
            doc.text(unitPriceFormatted, 380, doc.y, { align: 'right', continued: true });
            doc.text(totalPriceFormatted, 450, doc.y, { align: 'right' });
            doc.moveDown(1);
        });

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#c76334'); // Horizontal line

        // Totals section
        doc.moveDown(2);
        doc.text('Sub Total:', 400, doc.y, { align: 'right', continued: true });
        doc.text(totalAmount.toFixed(2), 450, doc.y, { align: 'right' });
        doc.moveDown(0.5);
        doc.text('Tax Rate:', 400, doc.y, { align: 'right', continued: true });
        doc.text('5%', 450, doc.y, { align: 'right' });
        doc.moveDown(0.5);
        doc.fontSize(16).text('Total:', 400, doc.y, { align: 'right', continued: true });
        doc.text(totalAmount.toFixed(2), 450, doc.y, { align: 'right' });
        doc.moveDown(2);

        // Terms & Conditions
        doc.fontSize(12).text('Terms & Conditions:', { underline: true });
        doc.text('All payments must be made in full before the commencement of any design work.');

        doc.end();
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ success: false, message: 'Error generating invoice' });
    }*/
//});


router.get('/invoices/:fileName', (req, res) => {
    const filePath = path.join(invoicesDir, req.params.fileName);
    res.sendFile(filePath);
});

router.get('/getInvoice/:orderId', (req, res) => {
    const { orderId } = req.params;

    // Retrieve PDF data from MySQL
    const sql = 'SELECT pdf_data FROM invoices WHERE order_id = ?';
    connection.query(sql, [orderId], (err, results) => {
        if (err) {
            console.error('Error retrieving invoice from database:', err);
            res.status(500).json({ message: 'Error retrieving invoice' });
            return;
        }

        if (results.length > 0) {
            const pdfData = results[0].pdf_data;
            res.contentType('application/pdf');
            res.send(pdfData);
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    });
});

module.exports = router