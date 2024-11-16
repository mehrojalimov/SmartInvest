const axios = require('axios');
const config = require('../../env.json');  // Assuming the API key is in this file.

const getStockPrice = async (symbols) => {
    try {
        const response = await axios.get('https://yahoo-finance166.p.rapidapi.com/stock/v2/get-summary', {
            params: {
                symbol: symbols,  // Comma separated symbols like 'AAPL,GOOGL,TSLA'
                region: 'US'
            },
            headers: {
                'X-RapidAPI-Key': config.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'yahoo-finance166.p.rapidapi.com'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching stock price:', error);
    }
};

module.exports = { getStockPrice };
