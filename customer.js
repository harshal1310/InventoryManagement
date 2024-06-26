// script.js

document.addEventListener('DOMContentLoaded', function() {
    // Simulated data for demonstration
    const customers = [
        { id: 'C001', name: 'John Doe', mobile: '9428066222', email: 'john.doe@example.com', totalOrders: 10 },
        { id: 'C002', name: 'Jane Smith', mobile: '9876543210', email: 'jane.smith@example.com', totalOrders: 5 },
        { id: 'C003', name: 'Michael Johnson', mobile: '9999999999', email: 'michael.johnson@example.com', totalOrders: 15 },
    ];

    const customerList = document.getElementById('customer-list');

    // Function to populate customer table
    function populateCustomers(customers) {
        customerList.innerHTML = ''; // Clear existing rows
        customers.forEach((customer, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.mobile}</td>
                <td>${customer.email}</td>
                <td>${customer.totalOrders}</td>
                <td>
                    <button onclick="viewCustomerDetails(${index})">View Details</button>
                    <button class="delete" onclick="deleteCustomer(${index})">Delete</button>
                </td>
            `;
            customerList.appendChild(row);
        });
    }

    // Initial population of customers (for demo purposes)
    populateCustomers(customers);

    // Example functions for demo purposes
    window.viewCustomerDetails = function(index) {
        const customer = customers[index];
        alert(`Customer Details:
        Name: ${customer.name}
        Mobile: ${customer.mobile}
        Email: ${customer.email}
        Total Orders: ${customer.totalOrders}`);
    };

    window.deleteCustomer = function(index) {
        if (confirm('Are you sure you want to delete this customer?')) {
            customers.splice(index, 1);
            populateCustomers(customers);
        }
    };
});
