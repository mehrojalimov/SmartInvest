let cashBalance = 1000; // Starting cash balance
let totalAssets = 0; // Starting total assets


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
    const amount = parseFloat(document.getElementById('buy-amount').value);
    if (!symbol || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid stock symbol and amount!');
        return;
    }
    const priceElement = document.querySelector('#stock-data p:nth-child(6)');
    const stockPrice = parseFloat(priceElement?.textContent.split(': ')[1]);
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
        row.parentNode.removeChild(row);
    } else {
        row.cells[1].innerText = remainingShares.toFixed(2);
    }
});

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

function sellStock(button, symbol) {
    const amount = parseFloat(document.getElementById('sell-amount').value);
    const row = button.parentNode.parentNode;
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
        row.parentNode.removeChild(row);
    } else {
        row.cells[1].innerText = remainingShares.toFixed(2);
    }
}

updateCashDisplay(); // Initial display update
updateTotalAssetsDisplay(); // Initialize total assets display

