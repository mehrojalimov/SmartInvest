let cashBalance = 1000; // Starting cash balance
let totalAssets = 0; // Starting total assets

// Hardcoded data for the portfolio chart
let portfolioHistory = [1000, 700, 800]; // Values for the last two days
let dates = [
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(), // Two days ago
    new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(), // Yesterday
];

function updatePortfolioChart() {
    const totalPortfolioValue = totalAssets; // Total portfolio value including cash and assets
    const today = new Date().toLocaleDateString(); // Get today's date

    const lastDate = dates.length > 0 ? new Date(dates[dates.length - 1]) : new Date();
    const nextDate = new Date(lastDate.setDate(lastDate.getDate() + 1)).toLocaleDateString();

    // Check if the current date already has a record
    const lastIndex = dates.length - 1;
    if (lastIndex === -1 || dates[lastIndex] !== nextDate) {
        // If no record for today, add a new entry
        dates.push(nextDate);
        portfolioHistory.push(totalPortfolioValue);
    } else {
        // Update today's value to reflect any transactions or price changes
        portfolioHistory[lastIndex] = totalPortfolioValue;
    }

    // Update the chart with new data
    portfolioChart.data.labels = dates;
    portfolioChart.data.datasets.forEach((dataset) => {
        dataset.data = portfolioHistory;
    });
    portfolioChart.update();

    // Update database with new data
    savePortfolioHistoryToDatabase();
}

document.getElementById('update-cash').addEventListener('click', () => {
    const cashInput = document.getElementById('cash-input');
    const newCashBalance = parseFloat(cashInput.value);

    // Validate user input
    if (isNaN(newCashBalance) || newCashBalance < 0) {
        alert('Please enter a valid positive number for cash balance.');
        return;
    }

    // Update the cash balance
    cashBalance += newCashBalance;
    updateCashDisplay(); // Refresh the display
    cashInput.value = ''; // Clear the input field
});

function updateCashDisplay() {
    const cashAmountElement = document.getElementById('cash-amount');
    cashAmountElement.textContent = `$${cashBalance.toFixed(2)}`;
}

async function loadPortfolioHistoryFromDatabase() {
    try {
        const response = await fetch('/api/portfolio/history', { method: 'GET' });
        const data = await response.json();

        if (data.history && data.dates) {
            portfolioHistory = data.history;
            dates = data.dates.map(date => new Date(date).toLocaleDateString());
        }

        console.log('Portfolio history loaded:', { portfolioHistory, dates });
    } catch (error) {
        console.error('Error loading portfolio history from database:', error);
    }
}




async function savePortfolioHistoryToDatabase() {
    try {
        await fetch('/api/portfolio/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                portfolioHistory,
                dates
            }),
        });
        console.log('Portfolio history saved successfully.');
    } catch (error) {
        console.error('Error saving portfolio history to database:', error);
    }
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

        const quote = data; // Assuming data is directly the quote object

        // Display stock data
        document.getElementById('stock-data').innerHTML = `
            <h2>Stock: ${symbol}</h2>
            <p><strong>Time:</strong> ${quote.time}</p>
            <p><strong>Open:</strong> ${quote.open}</p>
            <p><strong>High:</strong> ${quote.high}</p>
            <p><strong>Low:</strong> ${quote.low}</p>
            <p><strong>Price:</strong> ${quote.price}</p>
            <p><strong>Volume:</strong> ${quote.volume}</p>
        `;
    } catch (error) {
        document.getElementById('stock-data').innerHTML = `<p>Error: ${error.message}</p>`;
        console.error('Error fetching stock data:', error);
    }
});

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

async function buyStock() {
    const stockSymbol = document.getElementById("stockSymbol").value;
    const amount = document.getElementById("buyAmount").value;
  
    await fetch("/api/portfolio/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stock_name: stockSymbol,
        transaction_type: "BUY",
        quantity: amount
      }),
    });
  
    alert("Stock bought successfully!");
    fetchPortfolio(); // Refresh portfolio
  }

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
  

  function updateTotalAssetsDisplay() {
    document.getElementById('total-assets').innerText = `Total Assets: $${totalAssets.toFixed(2)}`;
}

document.getElementById('buy-stock').addEventListener('click', () => {
    const symbol = document.getElementById('symbol').value.toUpperCase();
    const amount = parseFloat(document.getElementById('buy-amount').value); // Correctly define `amount` here

    if (!symbol || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid stock symbol and amount!');
        return;
    }

    const priceElement = document.querySelector('#stock-data p:nth-child(6)');
    const stockPrice = parseFloat(priceElement.textContent.split(': ')[1]);

    if (!stockPrice) {
        alert('Fetch stock data first to retrieve the price!');
        return;
    }

    const numberShares = amount / stockPrice;
    if (cashBalance < amount) {
        alert('Not enough cash to buy!');
        return;
    }
    cashBalance -= amount;
    updateCashDisplay();
    addOrUpdateRow(symbol, numberShares, stockPrice);

    updateTotalAssets();
    updatePortfolioChart();
});


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


const ctx = document.getElementById('portfolioChart').getContext('2d');
const portfolioChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: dates,
        datasets: [
            {
                label: '',
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
                display: false,
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    color: '#c2b067',
                    text: 'Dates',
                },
                ticks: {
                    display: false,
                },
                grid: {
                    display: true,
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Value ($)',
                    color: '#c2b067'
                },
                ticks: {
                    color: 'rgba(194, 176, 103, 0.8)',
                },
                grid: {
                    color: 'rgba(194, 176, 103, 0.2)',
                },
                beginAtZero: false,
            },
        },
    },
});

window.onload = async () => {
    await loadPortfolioHistoryFromDatabase(); // Load saved data
    fetchPortfolio();
    updateCashDisplay(); // Initial display update
    updateTotalAssetsDisplay();
    updatePortfolioChart(); // Initialize chart with loaded data
};
