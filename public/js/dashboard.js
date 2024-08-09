var xValues = ["January", "February", "March", "April", "May", "June", "July"];
var ySalesValues = [1200, 1500, 1800, 2200, 2500, 2800, 3000];
var yOrdersValues = [30, 40, 35, 50, 55, 60, 70];
var barColors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#FF6384"];

new Chart("salesChart", {
    type: "bar",
    data: {
        labels: xValues,
        datasets: [{
            backgroundColor: barColors,
            data: ySalesValues
        }]
    },
    options: {
        legend: { display: false },
        title: {
            display: true,
            text: "Sales Per Month"
        }
    }
});

new Chart("ordersChart", {
    type: "bar",
    data: {
        labels: xValues,
        datasets: [{
            backgroundColor: barColors,
            data: yOrdersValues
        }]
    },
    options: {
        legend: { display: false },
        title: {
            display: true,
            text: "Orders Per Month"
        }
    }
});

document.querySelectorAll('.sidebar ul li a').forEach(item => {
    item.addEventListener('click', event => {
        let submenu = item.nextElementSibling;
        if (submenu && submenu.classList.contains('submenu')) {
            event.preventDefault();
            submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
});

async function fetchDashboardData() {
    try {
        const response = await fetch('/api/dashboardSales'); // Adjust the URL to match your backend API endpoint
        const data = await response.json();

        // Update the dashboard cards with data
        document.getElementById('total-sales').textContent = `$${data.totalSales}`;
        document.getElementById('todays-delivery').textContent = data.todaysDelivery;
        document.getElementById('todays-orders').textContent = data.todaysOrders;
        document.getElementById('payment-received').textContent = `$${data.paymentReceived}`;
        document.getElementById('total-orders').textContent = data.totalOrders;
        document.getElementById('pending-orders').textContent = data.pendingOrders;
        document.getElementById('completed-orders').textContent = data.completedOrders;
        document.getElementById('todays-customers').textContent = data.todaysCustomers;
        document.getElementById('this-month-customers').textContent = data.thisMonthCustomers;
        document.getElementById('today-collected-amount').textContent = `$${data.todayCollectedAmount}`;
        document.getElementById('this-month-expense').textContent = `$${data.thisMonthExpense}`;

        // Populate the invoices table
        const invoicesList = document.getElementById('invoices-list');
        invoicesList.innerHTML = ''; // Clear any existing content

        data.last10Invoices.forEach(invoice => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${invoice.invoiceNumber}</td>
                <td>${invoice.customer}</td>
                <td>${invoice.date}</td>
                <td>$${invoice.amount}</td>
                <td>${invoice.time}</td>
                <td>${invoice.status}</td>
            `;
            invoicesList.appendChild(row);
        });

        // Optionally, update your charts using Chart.js with the fetched data
        // updateSalesChart(data.salesChartData);
        // updateOrdersChart(data.ordersChartData);

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}
