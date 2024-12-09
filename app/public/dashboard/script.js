let cashBalance = 1000; // Starting cash balance
let totalAssets = 0; // Starting total assets
let portfolioHistory = []; // Array to store portfolio value over time
let dates = []; // Array to store dates for the x-axis of the chart


/*************************************************************************************************************
 *                                     Fetch Stock                                                           *
 ************************************************************************************************************/
async function fetchPortfolio() {
    const response = await fetch("/api/portfolio");
    const data = await response.json();
  
    const table = document.getElementById("purchasedStocksTable");
    table.innerHTML = "";
  
    data.portfolio.forEach(stock => {
      table.innerHTML += `
        <tr>
          <td>${stock.stock_name}</td>
          <td>${stock.total_quantity}</td>
        </tr>
      `;
    });
  }
  
  window.onload = fetchPortfolio;

document.getElementById('fetch-data').addEventListener('click', async () => {
    const symbol = document.getElementById('symbol').value.toUpperCase();
    if (!symbol) {
        alert('Please enter a stock symbol!');
        return;
    }
    const url = `/api/stock/${symbol}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `No data found for ${symbol} or error in API call.`);
        }
        const quote = data;
        document.getElementById('stock-data').innerHTML = `
            <h2>Stock: ${symbol}</h2>
            <p><strong>Time:</strong> ${quote.time}</p>
            <p><strong>Open:</strong> $${parseFloat(quote.open).toFixed(2)}</p>
            <p><strong>High:</strong> $${parseFloat(quote.high).toFixed(2)}</p>
            <p><strong>Low:</strong> $${parseFloat(quote.low).toFixed(2)}</p>
            <p><strong>Price:</strong> $${parseFloat(quote.price).toFixed(2)}</p>
            <p><strong>Volume:</strong> ${quote.volume.toLocaleString()}</p>
        `;
    } catch (error) {
        document.getElementById('stock-data').innerHTML = `<p>Error: ${error.message}</p>`;
        console.error('Error fetching stock data:', error);
    }
});


async function fetchCurrentPrice(symbol) {
    const url = `/api/stock/${symbol}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `Error fetching data for ${symbol}.`);
        }
        return data.price;
    } catch (error) {
        console.error('Error fetching current stock price:', error);
        return 0; // Return 0 if there is an error fetching the price
    }
}

/*************************************************************************************************************
 *                                     Buy Stock                                                           *
 ************************************************************************************************************/
// Buy stock function
async function buyStock(symbol, amount) {
    try {
        const response = await fetch("/api/portfolio/transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                stock_name: symbol,
                transaction_type: "BUY",
                quantity: amount,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to buy stock");
        }

        alert("Stock bought successfully!");
        return result; // Returning result for further updates if needed
    } catch (error) {
        console.error("Error buying stock:", error);
        alert("An error occurred while buying the stock. Please try again.");
        throw error; // Re-throwing to handle in the calling function if needed
    }
}

// Event listener for buying stocks
document.getElementById("buy-stock").addEventListener("click", async () => {
    const symbolInput = document.getElementById("symbol");
    const amountInput = document.getElementById("buy-amount");
    const priceElement = document.querySelector("#stock-data p:nth-child(6)");

    // Validate inputs
    const symbol = symbolInput?.value.trim().toUpperCase();
    const amount = parseFloat(amountInput?.value);
    const stockPrice = parseFloat(priceElement?.textContent.split("$")[1]);

    if (!symbol) {
        alert("Please enter a valid stock symbol.");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount greater than 0.");
        return;
    }

    if (!stockPrice) {
        alert("Please fetch stock data to retrieve the price.");
        return;
    }

    // Check cash balance
    const numberShares = amount / stockPrice;
    if (cashBalance < amount) {
        alert("Not enough cash to complete the purchase.");
        return;
    }

    try {
        // Deduct cash and update UI
        cashBalance -= amount;
        const result = await buyStock(symbol, amount);

        updateCashDisplay(); // Update displayed cash balance
        addOrUpdateRow(symbol, numberShares, stockPrice); // Update portfolio row
        updatePortfolioChart(); // Refresh the portfolio chart
    } catch (error) {
        // Error handling if needed
        console.error("Transaction failed:", error);
    }
});


/*************************************************************************************************************
 *                                     Sell Stock                                                           *
 ************************************************************************************************************/
function sellStock(button, symbol) {
    const row = button.parentNode.parentNode; // Get the table row for the stock
    const currentPrice = parseFloat(row.cells[2].innerText.slice(1)); // Parse the stock price, removing "$"
    const currentShares = parseFloat(row.cells[1].innerText); // Parse the volume (shares)

    if (isNaN(currentPrice) || isNaN(currentShares)) {
        alert('Invalid stock data. Please ensure the stock information is correct.');
        return;
    }

    // Calculate the total sell value
    const totalSellValue = currentShares * currentPrice;

    // Update cash balance
    cashBalance += totalSellValue;
    updateCashDisplay();

    // Remove the row from the table
    row.parentNode.removeChild(row);

    // Recalculate total assets after selling
    updateTotalAssets();

    alert(`Successfully sold all shares of ${symbol} for $${totalSellValue.toFixed(2)}.`);
}
document.getElementById('sell-stock').addEventListener('click', () => {
    const symbol = document.getElementById('symbol').value.toUpperCase();
    const amount = parseFloat(document.getElementById('sell-amount').value);
    if (!symbol || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid stock symbol and amount!');
        return;
    }
    const row = findRow(symbol);
    if (!row) {
        alert('No such stock in portfolio!');
        return;
    }
    const currentPrice = parseFloat(row.cells[2].innerText.slice(1)); // Remove $
    const sharesToSell = amount / currentPrice;
    const currentShares = parseFloat(row.cells[1].innerText);

    if (currentShares < sharesToSell) {
        alert('Not enough shares to sell!');
        return;
    }

    const remainingShares = currentShares - sharesToSell;
    cashBalance += amount;
    updateCashDisplay();

    if (remainingShares <= 0) {
        row.parentNode.removeChild(row); // Remove row if no shares are left
    } else {
        row.cells[1].innerText = remainingShares.toFixed(2);
    }

    updateTotalAssets(); // Update total assets after the sell

    updatePortfolioChart(); // Update the chart

});



/*************************************************************************************************************
 *                                     Update Data                                                           *
 ************************************************************************************************************/

document.getElementById('update-assets').addEventListener('click', async () => {
    let newTotalAssets = 0;
    const rows = document.querySelectorAll('#stock-table tbody tr');
    for (const row of rows) {
        const symbol = row.cells[0].innerText;
        const shares = parseFloat(row.cells[1].innerText);
        const currentPrice = await fetchCurrentPrice(symbol);
        const assetValue = shares * currentPrice;
        newTotalAssets += assetValue;
    }
    totalAssets = newTotalAssets;
    updateTotalAssetsDisplay();
});

function updateTotalAssetsDisplay() {
    document.getElementById('total-assets').innerText = `Total Assets: $${totalAssets.toFixed(2)}`;
    updatePortfolioChart();
}

async function updateTotalAssets() {
    let newTotalAssets = 0;
    const rows = document.querySelectorAll('#stock-table tbody tr');
    for (const row of rows) {
        const symbol = row.cells[0].innerText;
        const shares = parseFloat(row.cells[1].innerText);
        const currentPrice = await fetchCurrentPrice(symbol);
        const assetValue = shares * currentPrice;
        newTotalAssets += assetValue;
    }
    totalAssets = newTotalAssets;
    updateTotalAssetsDisplay();
}

function updateCashDisplay() {
    document.getElementById('cash-display').innerText = `Cash Balance: $${cashBalance.toFixed(2)}`;
}

function addOrUpdateRow(symbol, numberShares, price) {
    let row = findRow(symbol);
    if (!row) {
        row = document.createElement('tr');
        row.innerHTML = `
            <td>${symbol}</td>
            <td>${numberShares.toFixed(2)}</td>
            <td>$${price.toFixed(2)}</td>
            <td><button class="action-button" onclick="sellStock(this, '${symbol}')">Sell</button></td>
        `;
        document.getElementById('table-body').appendChild(row);
    } else {
        const existingShares = parseFloat(row.cells[1].innerText);
        const newShares = existingShares + numberShares;
        row.cells[1].innerText = newShares.toFixed(2);
        row.cells[2].innerText = `$${price.toFixed(2)}`;
    }
}

function findRow(symbol) {
    const rows = document.querySelectorAll('#stock-table tbody tr');
    for (let row of rows) {
        if (row.cells[0].innerText === symbol) {
            return row;
        }
    }
    return null;
}

function updatePortfolioChart() {
    if (dates.length === 0 || portfolioHistory.length === 0) {
        dates.push(new Date().toLocaleDateString());
        portfolioHistory.push(totalAssets);
    }

    portfolioChart.data.labels = dates;
    portfolioChart.data.datasets.forEach((dataset) => {
        dataset.data = portfolioHistory;
    });

    portfolioChart.update();
}

async function endOfDayUpdate() {
    // Function to simulate end of day update based on market close prices
    let newTotalAssets = 0;
    const rows = document.querySelectorAll('#stock-table tbody tr');
    for (const row of rows) {
        const symbol = row.cells[0].innerText;
        const currentPrice = await fetchCurrentPrice(symbol); // Fetch the closing price for the day
        const shares = parseFloat(row.cells[1].innerText);
        newTotalAssets += shares * currentPrice;
    }
    totalAssets = newTotalAssets;
    updateTotalAssetsDisplay();
    updatePortfolioChart(); // Update the chart at the end of the day with the new asset value
}


/*************************************************************************************************************
 *                                     Portfolio Char                                                       *
 ************************************************************************************************************/
const ctx = document.getElementById('portfolioChart').getContext('2d');
const portfolioChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: dates,
        datasets: [
            {
                label: 'Portfolio Value ($)',
                data: portfolioHistory,
                borderColor: '#c2b067',
                color: '#c2b067',
                tension: 0.3,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7,
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: '#c2b067',
                    font: {
                        size: 14,
                    },
                },
            },
            tooltip: {
                backgroundColor: 'black',
                titleColor: 'white',
                bodyColor: 'white',
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Date',
                    color: '#c2b067'
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Portfolio Value ($)',
                    color: '#c2b067'
                },
                ticks: {
                    color: '#c2b067', // Y-axis tick color
                },
                grid: {
                    color: 'rgba(255, 215, 0, 0.2)', // Light gold gridlines
                },
                beginAtZero: false,
            },
        },
    },
});


window.onload = () => {
    fetchPortfolio();
    updateCashDisplay(); // Initial display update
    updateTotalAssetsDisplay();
    updatePortfolioChart(); // Initial chart display when page loads
};
