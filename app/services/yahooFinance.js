const axios = require("axios");

const ALPHA_VANTAGE_API_KEY = "your_alpha_vantage_api_key";  // Replace with your actual API key
const BASE_URL = "https://www.alphavantage.co/query";

// Function to fetch stock price data
async function getStockPrice(symbol) {
  try {
    const params = {
      function: "TIME_SERIES_INTRADAY",
      symbol: symbol,
      interval: '5min',
      apikey: ALPHA_VANTAGE_API_KEY
    };
    const response = await axios.get(BASE_URL, { params });
    const data = response.data;

    if (!data || data["Error Message"]) {
      throw new Error(`No data found for ${symbol} or error in API call.`);
    }

    // Assuming you want the latest entry from the time series data
    const timeSeries = data["Time Series (5min)"];
    const latestEntry = Object.keys(timeSeries)[0];
    const latestData = timeSeries[latestEntry];

    return {
      symbol: symbol,
      time: latestEntry,
      open: latestData["1. open"],
      high: latestData["2. high"],
      low: latestData["3. low"],
      close: latestData["4. close"],
      volume: latestData["5. volume"]
    };
  } catch (error) {
    console.error("Error fetching stock data from Alpha Vantage:", error);
    throw error;  // Re-throw to handle it in the calling function
  }
}

module.exports = {
  getStockPrice
};
