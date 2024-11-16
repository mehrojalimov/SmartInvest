const express = require('express');
const { getStockPrice } = require('../services/yahoo-finance');  // Import the function

const app = express();
const port = 3000;

app.get('/stock-price', async (req, res) => {
    const symbols = req.query.symbols || 'AAPL,GOOGL,TSLA';  // Default to AAPL, GOOGL, TSLA
    const stockData = await getStockPrice(symbols);
    res.json(stockData);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
