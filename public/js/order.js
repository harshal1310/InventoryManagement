document.addEventListener('DOMContentLoaded', function() {
    const createOrderLink = document.querySelector('.submenu a[href="create-order.html"]');
    const viewOrdersLink = document.querySelector('.submenu a[href="view-orders.html"]');

    if (createOrderLink) {
        createOrderLink.onclick = function() {
            document.getElementById('create-order-section').style.display = 'block';
            document.getElementById('view-orders-section').style.display = 'none';
        };
    } else {
        console.error('Create Order link not found.');
    }

    if (viewOrdersLink) {
        viewOrdersLink.onclick = function() {
            document.getElementById('create-order-section').style.display = 'none';
            document.getElementById('view-orders-section').style.display = 'block';
        };
    } else {
        console.error('View Orders link not found.');
    }

    fetchBranches();

    function fetchBranches() {
        fetch('/api/branches')
            .then(response => response.json())
            .then(data => {
                console.log(data);
                populateBranchDropdown(data.branches);
            })
            .catch(error => {
                console.error('Error fetching branches:', error);
            });
    }

    function populateBranchDropdown(branches) {
        const branchSelect = document.getElementById('branch');
        if (branchSelect) {
            const options = branches.map(branch => `<option value="${branch}">${branch}</option>`).join('');
            branchSelect.innerHTML = options;

            if (branches.length > 0) {
                branchSelect.value = branches[0];
            }

            branchSelect.addEventListener('change', () => {
                const selectedBranch = branchSelect.value;
            });
        } else {
            console.error('Branch dropdown not found.');
        }
    }

    window.saveOrder =function () {
        const orderForm = document.getElementById('orderForm');
        if (!orderForm) {
            console.error('Order form not found.');
            return;
        }

        const formData = new FormData(orderForm);
        const order = {
            customer_id: formData.get('customer'),
            branch: formData.get('branch'),
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

            if (productSelect && quantityInput && priceInput && amountInput) {
                const product = productSelect.value;
                const quantity = quantityInput.value;
                const price = priceInput.value;
                const amount = amountInput.value;

                order.products.push({
                    name: product,
                    quantity: quantity,
                    price: price,
                    amount: amount
                });
            } else {
                console.error('Product row elements not found.');
            }
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
});
