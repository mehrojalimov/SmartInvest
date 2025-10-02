const axios = require("axios");

// 12 Data API Configuration
const TWELVE_DATA_KEY = "3769efaa98a441b8b322114cc23f49d9";
const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";

// Enhanced mock data with more realistic and varied prices
const mockStockData = {
  'AAPL': {
    symbol: 'AAPL',
    time: '2024-10-02',
    open: '175.50',
    high: '178.20',
    low: '174.80',
    price: '177.30',
    volume: '45000000'
  },
  'MSFT': {
    symbol: 'MSFT',
    time: '2024-10-02',
    open: '380.25',
    high: '385.10',
    low: '379.50',
    price: '383.75',
    volume: '28000000'
  },
  'TSLA': {
    symbol: 'TSLA',
    time: '2024-10-02',
    open: '245.80',
    high: '252.30',
    low: '244.20',
    price: '249.50',
    volume: '35000000'
  },
  'AMZN': {
    symbol: 'AMZN',
    time: '2024-10-02',
    open: '155.40',
    high: '158.90',
    low: '154.80',
    price: '157.25',
    volume: '22000000'
  },
  'GOOGL': {
    symbol: 'GOOGL',
    time: '2024-10-02',
    open: '142.60',
    high: '145.80',
    low: '141.90',
    price: '144.35',
    volume: '18000000'
  },
  'NVDA': {
    symbol: 'NVDA',
    time: '2024-10-02',
    open: '425.50',
    high: '432.80',
    low: '423.90',
    price: '429.75',
    volume: '32000000'
  },
  'META': {
    symbol: 'META',
    time: '2024-10-02',
    open: '320.15',
    high: '325.80',
    low: '318.90',
    price: '323.45',
    volume: '19000000'
  },
  'NFLX': {
    symbol: 'NFLX',
    time: '2024-10-02',
    open: '485.20',
    high: '492.10',
    low: '483.50',
    price: '488.75',
    volume: '15000000'
  },
  'AMD': {
    symbol: 'AMD',
    time: '2024-10-02',
    open: '125.30',
    high: '128.90',
    low: '124.50',
    price: '127.20',
    volume: '25000000'
  },
  'INTC': {
    symbol: 'INTC',
    time: '2024-10-02',
    open: '42.15',
    high: '43.80',
    low: '41.90',
    price: '43.25',
    volume: '30000000'
  }
};

// Function to fetch stock price data using multiple APIs with 12 Data as primary
async function getStockPrice(symbol) {
  const symbolUpper = symbol.toUpperCase();
  
  // First try 12 Data API (Primary - Professional Grade)
  try {
    const twelveDataUrl = `${TWELVE_DATA_BASE_URL}/price`;
    const params = {
      symbol: symbolUpper,
      apikey: TWELVE_DATA_KEY,
      format: 'JSON'
    };
    
    const response = await axios.get(twelveDataUrl, { 
      params,
      timeout: 5000
    });
    
    const data = response.data;
    
    if (data && data.price && !data.status) {
      // Get additional data for OHLCV
      const quoteUrl = `${TWELVE_DATA_BASE_URL}/quote`;
      const quoteParams = {
        symbol: symbolUpper,
        apikey: TWELVE_DATA_KEY,
        format: 'JSON'
      };
      
      try {
        const quoteResponse = await axios.get(quoteUrl, { 
          params: quoteParams,
          timeout: 3000
        });
        
        const quoteData = quoteResponse.data;
        
        if (quoteData && !quoteData.status) {
          return {
            symbol: symbolUpper,
            time: new Date().toISOString().split('T')[0],
            open: quoteData.open?.toString() || data.price,
            high: quoteData.high?.toString() || data.price,
            low: quoteData.low?.toString() || data.price,
            price: data.price?.toString() || '0',
            volume: quoteData.volume?.toString() || '0',
            change: quoteData.change?.toString() || '0',
            change_percent: quoteData.percent_change?.toString() || '0',
          };
        }
      } catch (quoteError) {
        // If quote fails, return basic price data
        return {
          symbol: symbolUpper,
          time: new Date().toISOString().split('T')[0],
          open: data.price,
          high: data.price,
          low: data.price,
          price: data.price?.toString() || '0',
          volume: '0',
          change: '0',
          change_percent: '0',
        };
      }
    }
  } catch (error) {
    console.error("12 Data API failed:", error.message);
  }
  
  // Try Yahoo Finance API as backup
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbolUpper}`;
    
    const response = await axios.get(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    });
    
    const data = response.data;
    
    if (data && data.chart && data.chart.result && data.chart.result.length > 0) {
      const result = data.chart.result[0];
      const meta = result.meta;
      
      // Check if we have regular market price directly
      if (meta && meta.regularMarketPrice) {
        return {
          symbol: symbolUpper,
          time: new Date(meta.regularMarketTime * 1000).toISOString().split('T')[0],
          open: meta.regularMarketOpen?.toString() || '0',
          high: meta.regularMarketDayHigh?.toString() || '0',
          low: meta.regularMarketDayLow?.toString() || '0',
          price: meta.regularMarketPrice?.toString() || '0',
          volume: meta.regularMarketVolume?.toString() || '0',
          change: meta.regularMarketChange?.toString() || '0',
          change_percent: meta.regularMarketChangePercent?.toString() || '0',
        };
      }
      
      // Fallback to quote data
      const quote = result.indicators?.quote?.[0];
      if (quote && quote.close && quote.close.length > 0) {
        const latestIndex = quote.close.length - 1;
        
        return {
          symbol: symbolUpper,
          time: new Date(meta.regularMarketTime * 1000).toISOString().split('T')[0],
          open: quote.open[latestIndex]?.toString() || '0',
          high: quote.high[latestIndex]?.toString() || '0',
          low: quote.low[latestIndex]?.toString() || '0',
          price: quote.close[latestIndex]?.toString() || '0',
          volume: quote.volume[latestIndex]?.toString() || '0',
          change: '0',
          change_percent: '0',
        };
      }
    }
  } catch (error) {
    console.error("Yahoo Finance API failed:", error.message);
  }
  
  // Try Alpha Vantage as third backup
  try {
    const alphaUrl = `https://www.alphavantage.co/query`;
    const params = {
      function: "GLOBAL_QUOTE",
      symbol: symbolUpper,
      apikey: "demo", // Using demo key
    };
    
    const response = await axios.get(alphaUrl, { 
      params,
      timeout: 5000
    });
    
    const data = response.data;
    
    if (data && data["Global Quote"]) {
      const quote = data["Global Quote"];
      
      return {
        symbol: symbolUpper,
        time: quote["07. latest trading day"],
        open: quote["02. open"],
        high: quote["03. high"],
        low: quote["04. low"],
        price: quote["05. price"],
        volume: quote["06. volume"],
        change: quote["09. change"],
        change_percent: quote["10. change percent"],
      };
    }
  } catch (error) {
    console.error("Alpha Vantage API failed:", error.message);
  }
  
  // Try IEX Cloud API as final backup
  try {
    const iexUrl = `https://cloud.iexapis.com/stable/stock/${symbolUpper}/quote`;
    const params = {
      token: "pk_test_1234567890abcdef" // Demo token
    };
    
    const response = await axios.get(iexUrl, { 
      params,
      timeout: 5000
    });
    
    const data = response.data;
    
    if (data && data.symbol) {
      return {
        symbol: data.symbol,
        time: new Date().toISOString().split('T')[0],
        open: data.open?.toString() || '0',
        high: data.high?.toString() || '0',
        low: data.low?.toString() || '0',
        price: data.latestPrice?.toString() || '0',
        volume: data.volume?.toString() || '0',
        change: data.change?.toString() || '0',
        change_percent: data.changePercent?.toString() || '0',
      };
    }
  } catch (error) {
    console.error("IEX Cloud API failed:", error.message);
  }
  
  // Fall back to mock data for known symbols
  console.log(`All APIs failed, using mock data for ${symbolUpper}`);
  if (mockStockData[symbolUpper]) {
    return mockStockData[symbolUpper];
  }
  
  throw new Error(`No data found for ${symbolUpper}`);
}

// Function to get real-time market data for multiple symbols (for live updates)
async function getRealTimeMarketData(symbols) {
  try {
    const twelveDataUrl = `${TWELVE_DATA_BASE_URL}/price`;
    const params = {
      symbol: symbols.join(','),
      apikey: TWELVE_DATA_KEY,
      format: 'JSON'
    };
    
    const response = await axios.get(twelveDataUrl, { 
      params,
      timeout: 10000
    });
    
    return response.data;
  } catch (error) {
    console.error("12 Data real-time API failed:", error.message);
    return null;
  }
}

// Function to get technical indicators for algorithmic screening
async function getTechnicalIndicators(symbol, indicator = 'RSI') {
  try {
    const twelveDataUrl = `${TWELVE_DATA_BASE_URL}/${indicator.toLowerCase()}`;
    const params = {
      symbol: symbol,
      apikey: TWELVE_DATA_KEY,
      interval: '1day',
      time_period: 14,
      format: 'JSON'
    };
    
    const response = await axios.get(twelveDataUrl, { 
      params,
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    console.error(`12 Data ${indicator} API failed:`, error.message);
    return null;
  }
}

// Function to get stock screener data with custom indicators
async function getStockScreener(criteria = {}) {
  try {
    const twelveDataUrl = `${TWELVE_DATA_BASE_URL}/stocks`;
    const params = {
      apikey: TWELVE_DATA_KEY,
      country: 'United States',
      exchange: 'NASDAQ',
      format: 'JSON',
      ...criteria
    };
    
    const response = await axios.get(twelveDataUrl, { 
      params,
      timeout: 10000
    });
    
    return response.data;
  } catch (error) {
    console.error("12 Data screener API failed:", error.message);
    return null;
  }
}


module.exports = {
  getStockPrice,
  getRealTimeMarketData,
  getTechnicalIndicators,
  getStockScreener
};
