

const stockTableBody = document.getElementById('table-body');

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

document.getElementById('buy-stock').addEventListener('click', () => {
    const symbol = document.getElementById('symbol').value.toUpperCase();
    if (!symbol) {
        alert('Please enter a stock symbol!');
        return;
    }

    const priceElement = document.querySelector('#stock-data p:nth-child(6)'); // 6th <p> contains the price
    const stockPrice = priceElement?.textContent.split(': ')[1];
    if (!stockPrice) {
        alert('Fetch stock data first to retrieve the price!');
        return;
    }

    const purchaseDate = new Date().toLocaleString();

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${symbol}</td>
        <td>${stockPrice}</td>
        <td>${purchaseDate}</td>
        <td><button class="action-button" onclick="deleteRow(this)">Sell</button></td>
    `;
    stockTableBody.appendChild(row);
});

function deleteRow(button) {
    const row = button.parentNode.parentNode;
    stockTableBody.removeChild(row);
}