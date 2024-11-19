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
            throw new Error(data.error || 'Invalid stock symbol');
        }

        // Display stock data
        document.getElementById('stock-data').innerHTML = `
            <h2>Stock: ${symbol}</h2>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Open:</strong> ${data.open}</p>
            <p><strong>High:</strong> ${data.high}</p>
            <p><strong>Low:</strong> ${data.low}</p>
            <p><strong>Close:</strong> ${data.close}</p>
            <p><strong>Volume:</strong> ${data.volume}</p>
        `;
    } catch (error) {
        document.getElementById('stock-data').innerHTML = `<p>${error.message}</p>`;
        console.error('Error fetching stock data:', error);
    }
});
