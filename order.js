// order.js

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.submenu a[href="create-order.html"]').onclick = function() {
        document.getElementById('create-order-section').style.display = 'block';
        document.getElementById('view-orders-section').style.display = 'none';
    };

    document.querySelector('.submenu a[href="view-orders.html"]').onclick = function() {
        document.getElementById('create-order-section').style.display = 'none';
        document.getElementById('view-orders-section').style.display = 'block';
    };

    // Default to showing the View Orders section
    document.getElementById('create-order-section').style.display = 'none';
    document.getElementById('view-orders-section').style.display = 'block';
});
