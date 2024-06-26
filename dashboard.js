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
