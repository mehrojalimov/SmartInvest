// Function to get the initial price from the HTML table
function getInitialPrice() {
    const table = document.getElementById("stockTable");
    const priceText = table.rows[1].cells[1].textContent;
    return parseFloat(priceText.replace('$', ''));
}

// Function to get the price change from the HTML table
function getPriceChange() {
    const table = document.getElementById("stockChange");
    const changeText = table.rows[1].cells[1].textContent;
    return parseFloat(changeText.replace(/[+$]/g, ''));
}

// Get initial price and price change
const initialPrice = getInitialPrice();
const priceChange = getPriceChange();

// Calculate new price after change
const updatedPrice = initialPrice + priceChange;

// Create data points for the line graph
const dataPoints = [
    { x: 'Initial', y: initialPrice },
    { x: 'Updated', y: updatedPrice }
];

// Create the chart
new Chart("myChart", {
    type: "line",
    data: {
        labels: dataPoints.map(point => point.x),
        datasets: [{
            label: "Stock",
            data: dataPoints.map(point => point.y),
            borderColor: "rgba(0,0,255,0.5)",
            pointRadius: 4,
            pointBackgroundColor: "rgba(0,0,255,1)",
            fill: false,
            tension: 0.1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: 'Price (USD)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Status'
                }
            }
        },
        plugins: {
            legend: {
                display: true
            }
        }
    }
});
