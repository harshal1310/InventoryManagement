document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch the invoice data from the backend
        const response = await fetch('/api/getinvoices');
        const invoices = await response.json();

        // Get the tbody element where invoice rows will be injected
        const invoicesList = document.getElementById('invoices-list');

        // Generate HTML for each invoice and append to the table
        invoices.forEach(invoice => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${invoice.invoiceNumber}</td>
                <td>${invoice.customer}</td>
                <td>${invoice.date}</td>
                <td>${invoice.amount}</td>
                <td>${invoice.orderStatus}</td>
                <td>${invoice.paymentStatus}</td>
            `;
            invoicesList.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
    }
});