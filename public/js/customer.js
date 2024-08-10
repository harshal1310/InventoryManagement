document.addEventListener('DOMContentLoaded', function() {
    // Sample customers data
    const customers = [
       ];

    const customerList = document.getElementById('customer-list');

    function populateCustomers(customers) {
        customerList.innerHTML = ''; // Clear existing rows
        customers.forEach((customer, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.address}</td>
                <td>${customer.city}</td>
                <td>${customer.mobile}</td>
                <td>${customer.email}</td>
                <td>${customer.enrollmentDate}</td>
                <td>${customer.enrolledBy}</td>
                <td>${customer.totalOrders}</td>
                <td>
                    <button onclick="viewCustomerDetails(${index})">View Details</button>
                    <button class="update" onclick="openEditModal('${customer.id}')">Edit</button>
                    <button class="delete" onclick="confirmDelete('${customer.id}')">Delete</button>
                </td>
            `;
            customerList.appendChild(row);
        });
    }

    populateCustomers(customers);

    // Modal for Adding Customers
    const modal = document.getElementById("customerModal");
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementsByClassName("close")[0];

    openModalBtn.onclick = function() {
        modal.style.display = "block";
    }

    closeModalBtn.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    function getCustomers() {
        console.log("call get")
        fetch('/api/getCustomers')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text(); // Use text() to see the raw response
            })
            .then(text => {
                console.log('Raw response text:', text); // Log raw response
                try {
                    const data = JSON.parse(text); // Manually parse JSON
                    populateCustomers(data);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            })
            .catch(error => console.error('Error fetching customers:', error));
    }
    
    // Initial call to load customers
    getCustomers();


    // Modal for Editing Customers
    const editModal = document.getElementById("editCustomerModal");
    const editCloseBtn = document.getElementsByClassName("edit-close")[0];

    function openEditModal(customerId) {
        console.log(`Opening edit modal for customer ${customerId}`); // Debug line
        fetch(`/api/customers/${customerId}`)
            .then(response => response.json())
            .then(customer => {
                document.getElementById("edit-customer-id").value = customer.id;
                document.getElementById("edit-customer-name").value = customer.name;
                document.getElementById("edit-customer-address").value = customer.address;
                document.getElementById("edit-customer-city").value = customer.city;
                document.getElementById("edit-contact-no1").value = customer.mobile;
                document.getElementById("edit-enrollment-date").value = customer.enrollmentDate;
                document.getElementById("edit-enrolled-by").value = customer.enrolledBy;

                editModal.style.display = "block";
            })
            .catch(error => console.error('Error fetching customer:', error));
    }

    function closeEditModal() {
        editModal.style.display = "none";
    }

    if (editCloseBtn) {
        editCloseBtn.onclick = function() {
            closeEditModal();
        }
    }

    window.onclick = function(event) {
        if (event.target == editModal) {
            closeEditModal();
        }
    }

    // Add Customer Form
    document.getElementById("addCustomerForm").addEventListener('submit', function(event) {
        event.preventDefault();

        const customerName = document.getElementById("customer-name").value;
        const customerAddress = document.getElementById("customer-address").value;
        const customerCity = document.getElementById("customer-city").value;
        const contactNo1 = document.getElementById("contact-no1").value;
        const enrollmentDate = document.getElementById("enrollment-date").value;
        const enrolledBy = document.getElementById("enrolled-by").value;

        if (!customerName || !customerAddress || !customerCity || !contactNo1 || !enrollmentDate || !enrolledBy) {
            alert('All fields are required.');
            return;
        }

        const customerData = {
            name: customerName,
            address: customerAddress,
            city: customerCity,
            mobile: contactNo1,
            enrollmentDate: enrollmentDate,
            enrolledBy: enrolledBy
        };

        fetch('/api/add-customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Customer added successfully') {
                document.getElementById('addCustomerForm').reset();
                alert('Customer added successfully');
                // Optionally, refresh the customer list here
                // populateCustomers(customers);
            } else {
                alert('Failed to add customer');
            }
        })
        .catch(error => console.error('Error:', error));
    });

    // Delete Customer Confirmation
    function confirmDelete(customerId) {
        console.log(`Confirming delete for customer ${customerId}`); // Debug line
        const confirmation = confirm("Are you sure you want to delete this customer?");
        if (confirmation) {
            fetch(`/api/delete-customer/${customerId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Customer deleted successfully') {
                    alert('Customer deleted successfully');
                    // Optionally, refresh the customer list here
                    // populateCustomers(customers);
                } else {
                    alert('Failed to delete customer');
                }
            })
            .catch(error => console.error('Error:', error));
        }
    }

    // Expose functions to global scope for use in inline event handlers
    window.openEditModal = openEditModal;
    window.confirmDelete = confirmDelete;
});
