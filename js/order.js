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
    fetchBranches()

    function fetchBranches() {
        fetch('/api/branches')
            .then(response => response.json())
            .then(data => {
                console.log(data)
                populateBranchDropdown(data.branches);
            })
            .catch(error => {
                console.error('Error fetching branches:', error);
            });
    }

    /*function populateBranchDropdown(branches) {
        const branchSelect = document.getElementById('branch');
        branchSelect.innerHTML = branches.map(branch => `<option value="${branch}">${branch}</option>`).join('');
    }*/
        function populateBranchDropdown(branches) {
            const branchSelect = document.getElementById('branch');
            
            // Generate the options HTML
            const options = branches.map(branch => `<option value="${branch}">${branch}</option>`).join('');
            
            // Set the innerHTML of the dropdown
            branchSelect.innerHTML = options;
            
            // Set the default selection to the first item
            if (branches.length > 0) {
                branchSelect.value = branches[0]; // Set the value of the select element to the first branch
                fetchOrders(branches[0]); // Fetch orders for the default selection
            }
            
            // Add event listener for change events
            branchSelect.addEventListener('change', () => {
                const selectedBranch = branchSelect.value;
                fetchOrders(selectedBranch);
            });
        }


    
});

//function saveOrder() {
   /* console.log("click on save");
    const formData = new FormData(document.getElementById('orderForm'));
    const orderData = {};
    
    formData.forEach((value, key) => {
        orderData[key] = value;
    });

    fetch('/api/saveOrder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        alert('Order saved successfully');
        console.log(data);
        // Handle the response data if needed
    })
    .catch(error => {
        console.error('Error saving order:', error);
    });



    */





function saveOrder() {
    const orderForm = document.getElementById('orderForm');
    const formData = new FormData(orderForm);
    console.log(formData.get('branch'))
    const order = {
        customer_id: formData.get('customer'),
        branch:formData.get('branch'),
        service: formData.get('service'),
        type: formData.get('type'),
        products: [],
        subtotal: formData.get('subtotal'),
        tax_amount: formData.get('tax'),
        total_amount: formData.get('total'),
        pickup_charge: formData.get('pickup'),
        pickup_type: formData.get('pickupType'),
        delivery_charge: formData.get('delivery'),
        delivery_type: formData.get('deliveryType'),
        pickup_date: formData.get('pickupDate'),
        delivery_date: formData.get('deliveryDate'),
    };

    document.querySelectorAll('.product-row').forEach(row => {
const productSelect = row.querySelector('.product-select');
const quantityInput = row.querySelector('.quantity-input');
const priceInput = row.querySelector('.price-input');
const amountInput = row.querySelector('.amount-input');



const product = productSelect.value;
const quantity = quantityInput.value;
const price = priceInput.value;
const amount = amountInput.value;

console.log('Product:', product);
console.log('Quantity:', quantity);
console.log('Price:', price);
console.log('Amount:', amount);
console.log(order)

// Ensure valid values before pushing to products array

    order.products.push({
        name: product,
        quantity: quantity,
        price: price,
        amount: amount
    });

});
    fetch('/api/saveOrder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
    }).then(response => response.json())
      .then(data => {
          if (data.message === 'Order and items saved successfully') {
              alert('Order saved successfully!');
          } else {
              alert('Error saving order: ' + data.message);
          }
      })
      .catch(error => {
          console.error('Error:', error);
      });
}
