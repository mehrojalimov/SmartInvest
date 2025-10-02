const axios = require("axios");

const ALPHADVANTAGE_KEY = "MSN79IPXQ66H3JFB";
const BASE_URL = "https://www.alphavantage.co/query";

// Function to fetch stock price data
async function getStockPrice(symbol) {
  try {
    const params = {
      function: "GLOBAL_QUOTE",
      symbol: symbol,
      apikey: ALPHADVANTAGE_KEY,
    };

    const response = await axios.get(BASE_URL, { params });
    const data = response.data;

    if (!data || !data["Global Quote"]) {
      throw new Error(`No data found for ${symbol} or error in API call.`);
    }

    const quote = data["Global Quote"];
    return {
      symbol: symbol,
      time: quote["07. latest trading day"], // Date of the latest trading session
      open: quote["02. open"],
      high: quote["03. high"],
      low: quote["04. low"],
      price: quote["05. price"], // Current price
      volume: quote["06. volume"],
    };
  } catch (error) {
    console.error("Error fetching stock data from Alpha Vantage:", error.message);
    throw error;
  }
}


module.exports = {
  getStockPrice
};
