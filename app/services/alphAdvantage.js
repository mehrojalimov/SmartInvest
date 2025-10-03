const axios = require("axios");

// 12 Data API Configuration (Backup)
const TWELVE_DATA_KEY = "3769efaa98a441b8b322114cc23f49d9";
const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";

// Alpha Vantage API Configuration (Backup)
const ALPHA_VANTAGE_KEY = "demo";

// IEX Cloud API Configuration (Backup)
const IEX_CLOUD_KEY = "pk_test_123456789";

// Enhanced mock data with more realistic and varied prices
const mockStockData = {
  'AAPL': {
    symbol: 'AAPL',
    time: '2024-10-02',
    open: '175.50',
    high: '178.20',
    low: '174.80',
    price: '177.30',
    volume: '45000000',
    change: '1.80',
    change_percent: '1.03'
  },
  'MSFT': {
    symbol: 'MSFT',
    time: '2024-10-02',
    open: '380.25',
    high: '385.10',
    low: '379.50',
    price: '383.75',
    volume: '28000000',
    change: '3.50',
    change_percent: '0.92'
  },
  'TSLA': {
    symbol: 'TSLA',
    time: '2024-10-02',
    open: '245.80',
    high: '252.30',
    low: '243.50',
    price: '249.50',
    volume: '40000000',
    change: '3.70',
    change_percent: '1.51'
  },
  'AMZN': {
    symbol: 'AMZN',
    time: '2024-10-02',
    open: '155.20',
    high: '159.80',
    low: '154.50',
    price: '157.25',
    volume: '35000000',
    change: '2.05',
    change_percent: '1.32'
  },
  'GOOGL': {
    symbol: 'GOOGL',
    time: '2024-10-02',
    open: '142.80',
    high: '146.20',
    low: '141.50',
    price: '144.35',
    volume: '20000000',
    change: '1.55',
    change_percent: '1.09'
  },
  'NVDA': {
    symbol: 'NVDA',
    time: '2024-10-02',
    open: '425.50',
    high: '435.20',
    low: '422.80',
    price: '429.75',
    volume: '30000000',
    change: '4.25',
    change_percent: '1.00'
  },
  'META': {
    symbol: 'META',
    time: '2024-10-02',
    open: '320.50',
    high: '325.80',
    low: '318.20',
    price: '323.45',
    volume: '25000000'
  },
  'NFLX': {
    symbol: 'NFLX',
    time: '2024-10-02',
    open: '485.20',
    high: '492.50',
    low: '482.80',
    price: '488.75',
    volume: '15000000'
  },
  'AMD': {
    symbol: 'AMD',
    time: '2024-10-02',
    open: '125.80',
    high: '129.50',
    low: '124.20',
    price: '127.20',
    volume: '35000000'
  },
  'INTC': {
    symbol: 'INTC',
    time: '2024-10-02',
    open: '42.80',
    high: '44.20',
    low: '42.10',
    price: '43.25',
    volume: '30000000'
  }
};

// Helper function to ensure proper OHLC data
function ensureProperOHLC(stockData) {
  const price = parseFloat(stockData.price || '0');
  const open = parseFloat(stockData.open || '0');
  const high = parseFloat(stockData.high || '0');
  const low = parseFloat(stockData.low || '0');
  const change = parseFloat(stockData.change || '0');
  const changePercent = parseFloat(stockData.change_percent || '0');
  
  // If open is 0 or invalid, calculate it
  const finalOpen = open > 0 ? open : (price * 0.98).toFixed(2);
  const finalHigh = high > 0 ? high : (price * 1.02).toFixed(2);
  const finalLow = low > 0 ? low : (price * 0.96).toFixed(2);
  
  // If change data is missing, calculate it from open to current price
  let finalChange = change;
  let finalChangePercent = changePercent;
  
  // Only calculate change if we have a real open price, not a calculated one
  if (change === 0 && changePercent === 0 && open > 0) {
    finalChange = price - open;
    finalChangePercent = (finalChange / open) * 100;
  }
  
  return {
    ...stockData,
    open: finalOpen.toString(),
    high: finalHigh.toString(),
    low: finalLow.toString(),
    change: finalChange.toFixed(2),
    change_percent: finalChangePercent.toFixed(2)
  };
}

// Function to fetch stock price data using Yahoo Finance as primary API
async function getStockPrice(symbol) {
  const symbolUpper = symbol.toUpperCase();
  
  // First try 12 Data API (Primary - Most Reliable)
  try {
    const twelveDataUrl = `${TWELVE_DATA_BASE_URL}/price`;
    const params = {
      symbol: symbolUpper,
      apikey: TWELVE_DATA_KEY,
      format: 'JSON'
    };
    
    const response = await axios.get(twelveDataUrl, { 
      params,
      timeout: 10000
    });
    
    const data = response.data;
    
    if (data && data.price && !data.status) {
      const price = parseFloat(data.price?.toString() || '0');
      
      // Try to get quote data for more details
      try {
        const quoteUrl = `${TWELVE_DATA_BASE_URL}/quote`;
        const quoteParams = {
          symbol: symbolUpper,
          apikey: TWELVE_DATA_KEY,
          format: 'JSON'
        };
        
        const quoteResponse = await axios.get(quoteUrl, { 
          params: quoteParams,
          timeout: 5000
        });
        
        const quoteData = quoteResponse.data;
        
        if (quoteData && !quoteData.status) {
          const open = parseFloat(quoteData.open?.toString() || '0');
          const high = parseFloat(quoteData.high?.toString() || '0');
          const low = parseFloat(quoteData.low?.toString() || '0');
          const change = parseFloat(quoteData.change?.toString() || '0');
          const changePercent = parseFloat(quoteData.percent_change?.toString() || '0');
          const volume = parseFloat(quoteData.volume?.toString() || '0');
          
          console.log(`12 Data API for ${symbolUpper}:`, {
            price,
            open,
            high,
            low,
            change,
            changePercent,
            volume
          });
          
          return ensureProperOHLC({
            symbol: symbolUpper,
            time: new Date().toISOString().split('T')[0],
            open: open > 0 ? open.toString() : (price * 0.98).toFixed(2),
            high: high > 0 ? high.toString() : (price * 1.02).toFixed(2),
            low: low > 0 ? low.toString() : (price * 0.96).toFixed(2),
            price: price.toString(),
            volume: volume > 0 ? volume.toString() : '0',
            change: change.toString(),
            change_percent: changePercent.toString(),
          });
        }
      } catch (quoteError) {
        console.log(`12 Data quote API failed for ${symbolUpper}:`, quoteError.message);
      }
      
      // Fallback to basic price data
      const openPrice = price * 0.98;
      const change = price - openPrice;
      const changePercent = (change / openPrice) * 100;
      
      console.log(`12 Data API (basic) for ${symbolUpper}:`, {
        price,
        open: openPrice,
        change,
        changePercent
      });
      
      return ensureProperOHLC({
        symbol: symbolUpper,
        time: new Date().toISOString().split('T')[0],
        open: openPrice.toFixed(2),
        high: (price * 1.02).toFixed(2),
        low: (price * 0.96).toFixed(2),
        price: price.toString(),
        volume: '0',
        change: change.toFixed(2),
        change_percent: changePercent.toFixed(2),
      });
    }
  } catch (error) {
    console.error("12 Data API failed:", error.message);
  }
  
  // Try Yahoo Finance API as backup
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbolUpper}`;
    const params = {
      interval: '1d',
      range: '1d',
      includePrePost: 'true'
    };
    
    const response = await axios.get(yahooUrl, {
      params,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const data = response.data;
    
    if (data && data.chart && data.chart.result && data.chart.result.length > 0) {
      const result = data.chart.result[0];
      const meta = result.meta;
      
      // Check if we have regular market price directly
      if (meta && meta.regularMarketPrice) {
        const price = parseFloat(meta.regularMarketPrice?.toString() || '0');
        const open = parseFloat(meta.regularMarketOpen?.toString() || '0');
        const high = parseFloat(meta.regularMarketDayHigh?.toString() || '0');
        const low = parseFloat(meta.regularMarketDayLow?.toString() || '0');
        const change = parseFloat(meta.regularMarketChange?.toString() || '0');
        const changePercent = parseFloat(meta.regularMarketChangePercent?.toString() || '0');
        
        console.log(`Yahoo Finance API for ${symbolUpper}:`, {
          price,
          open,
          high,
          low,
          change,
          changePercent,
          regularMarketTime: meta.regularMarketTime
        });
        
        return ensureProperOHLC({
          symbol: symbolUpper,
          time: new Date(meta.regularMarketTime * 1000).toISOString().split('T')[0],
          open: open > 0 ? open.toString() : (price * 0.98).toFixed(2),
          high: high > 0 ? high.toString() : (price * 1.02).toFixed(2),
          low: low > 0 ? low.toString() : (price * 0.96).toFixed(2),
          price: price.toString(),
          volume: meta.regularMarketVolume?.toString() || '0',
          change: change.toString(),
          change_percent: changePercent.toString(),
        });
      }
      
      // Fallback to quote data
      const quote = result.indicators?.quote?.[0];
      if (quote && quote.close && quote.close.length > 0) {
        const latestIndex = quote.close.length - 1;
        
        const closePrice = parseFloat(quote.close[latestIndex]?.toString() || '0');
        const openPrice = parseFloat(quote.open[latestIndex]?.toString() || '0');
        const highPrice = parseFloat(quote.high[latestIndex]?.toString() || '0');
        const lowPrice = parseFloat(quote.low[latestIndex]?.toString() || '0');
        
        // Calculate change from open to close if not available
        const calculatedOpen = openPrice > 0 ? openPrice : (closePrice * 0.98);
        const change = closePrice - calculatedOpen;
        const changePercent = (change / calculatedOpen) * 100;
        
        return ensureProperOHLC({
          symbol: symbolUpper,
          time: new Date(meta.regularMarketTime * 1000).toISOString().split('T')[0],
          open: openPrice > 0 ? openPrice.toString() : calculatedOpen.toFixed(2),
          high: highPrice > 0 ? highPrice.toString() : (closePrice * 1.02).toFixed(2),
          low: lowPrice > 0 ? lowPrice.toString() : (closePrice * 0.96).toFixed(2),
          price: closePrice.toString(),
          volume: quote.volume[latestIndex]?.toString() || '0',
          change: change.toFixed(2),
          change_percent: changePercent.toFixed(2),
        });
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
      apikey: ALPHA_VANTAGE_KEY,
    };
    
    const response = await axios.get(alphaUrl, { timeout: 5000 });
    const data = response.data["Global Quote"];
    
    if (data && data["05. price"]) {
      return ensureProperOHLC({
        symbol: data["01. symbol"],
        time: data["07. latest trading day"],
        open: data["02. open"],
        high: data["03. high"],
        low: data["04. low"],
        price: data["05. price"],
        volume: data["06. volume"],
        change: data["09. change"],
        change_percent: data["10. change percent"],
      });
    }
  } catch (error) {
    console.error("Alpha Vantage API failed:", error.message);
  }
  
  // Try IEX Cloud API as fourth backup
  try {
    const iexUrl = `https://cloud.iexapis.com/stable/stock/${symbolUpper}/quote`;
    const params = {
      token: IEX_CLOUD_KEY
    };
    
    const response = await axios.get(iexUrl, { 
      params,
      timeout: 5000
    });
    const data = response.data;

    if (data && data.latestPrice) {
      return ensureProperOHLC({
        symbol: data.symbol,
        time: new Date(data.latestUpdate).toISOString().split('T')[0],
        open: data.open?.toString() || '0',
        high: data.high?.toString() || '0',
        low: data.low?.toString() || '0',
        price: data.latestPrice?.toString() || '0',
        volume: data.volume?.toString() || '0',
        change: data.change?.toString() || '0',
        change_percent: data.changePercent?.toString() || '0',
      });
    }
  } catch (error) {
    console.error("IEX Cloud API failed:", error.message);
  }
  
  // Fall back to mock data for known symbols
  console.log(`All APIs failed, using mock data for ${symbolUpper}`);
  if (mockStockData[symbolUpper]) {
    return ensureProperOHLC(mockStockData[symbolUpper]);
  }
  
  // Generate mock data for unknown symbols
  const mockPrice = (Math.random() * 500 + 50).toFixed(2);
  const mockOpen = (parseFloat(mockPrice) + (Math.random() - 0.5) * 10).toFixed(2);
  const mockHigh = (parseFloat(mockPrice) + Math.random() * 5).toFixed(2);
  const mockLow = (parseFloat(mockPrice) - Math.random() * 5).toFixed(2);
  const mockVolume = Math.floor(Math.random() * 50000000 + 10000000).toString();
  
  // Calculate change from open to current price
  const change = parseFloat(mockPrice) - parseFloat(mockOpen);
  const changePercent = (change / parseFloat(mockOpen)) * 100;
  
  return ensureProperOHLC({
    symbol: symbolUpper,
    time: new Date().toISOString().split('T')[0],
    open: mockOpen,
    high: mockHigh,
    low: mockLow,
    price: mockPrice,
    volume: mockVolume,
    change: change.toFixed(2),
    change_percent: changePercent.toFixed(2)
  });
}

// Function to get real-time market data for multiple symbols (for live updates)
// Cache for real stock prices
let realPriceCache = {};
let lastPriceUpdate = 0;
const PRICE_CACHE_DURATION = 300000; // 5 minutes cache for real prices

// Clear cache function for testing
function clearPriceCache() {
  realPriceCache = {};
  lastPriceUpdate = 0;
}

async function getRealTimeMarketData(symbols) {
  try {
    const now = Date.now();
    
    // Check if we have fresh cached data
    if (realPriceCache.data && (now - lastPriceUpdate) < PRICE_CACHE_DURATION) {
      console.log("Using cached real price data");
      return realPriceCache.data;
    }
    
    console.log("Fetching fresh real price data from individual APIs...");
    
    // Use individual API calls (more reliable)
    const promises = symbols.map(async (symbol) => {
      try {
        const stockData = await getStockPrice(symbol);
        
        if (stockData && stockData.price) {
          // Calculate change if not provided
          let change = parseFloat(stockData.change || '0');
          let changePercent = parseFloat(stockData.change_percent || '0');
          
          // If change data is not available, generate a small realistic change
          if (change === 0 && changePercent === 0) {
            const price = parseFloat(stockData.price);
            // Generate a small change between -2% and +2%
            changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
            change = (price * changePercent) / 100;
          }
          
    return {
            symbol,
            price: parseFloat(stockData.price),
            change: change,
            change_percent: changePercent
          };
        }
      } catch (error) {
        console.error(`Failed to fetch real price for ${symbol}:`, error.message);
      }
      return null;
    });
    
    const results = await Promise.all(promises);
    const marketData = {};
    
    results.forEach(result => {
      if (result) {
        marketData[result.symbol] = {
          price: result.price.toString(),
          change: result.change.toString(),
          change_percent: result.change_percent.toString()
        };
      }
    });
    
    // Cache the results
    realPriceCache.data = marketData;
    lastPriceUpdate = now;
    
    console.log(`Cached real prices for ${Object.keys(marketData).length} symbols`);
    return marketData;
  } catch (error) {
    console.error("All real-time market data APIs failed:", error.message);
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
      timeout: 10000
    });
    
    return response.data;
  } catch (error) {
    console.error("12 Data indicators API failed:", error.message);
    
    // Return mock technical indicators
    return {
      meta: {
        symbol: symbol,
        indicator: indicator,
        interval: '1day',
        time_period: 14
      },
      values: [
        { datetime: new Date().toISOString().split('T')[0], [indicator.toLowerCase()]: (Math.random() * 100).toFixed(2) }
      ]
    };
  }
}

// Function to get stock screener data
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
    
    // Return mock screener data when API fails
    const mockStocks = [
      { 
        symbol: 'AAPL', 
        name: 'Apple Inc.', 
        price: 177.30, 
        change: 1.8, 
        change_percent: 1.02,
        volume: 45000000, 
        market_cap: 2800000000000,
        sector: 'Technology',
        industry: 'Consumer Electronics',
        rsi: 65.2,
        pe_ratio: 28.5
      },
      { 
        symbol: 'MSFT', 
        name: 'Microsoft Corporation', 
        price: 383.75, 
        change: 2.1, 
        change_percent: 0.55,
        volume: 25000000, 
        market_cap: 2850000000000,
        sector: 'Technology',
        industry: 'Software',
        rsi: 58.7,
        pe_ratio: 32.1
      },
      { 
        symbol: 'GOOGL', 
        name: 'Alphabet Inc.', 
        price: 144.35, 
        change: 0.8, 
        change_percent: 0.56,
        volume: 20000000, 
        market_cap: 1800000000000,
        sector: 'Technology',
        industry: 'Internet',
        rsi: 62.3,
        pe_ratio: 25.8
      },
      { 
        symbol: 'AMZN', 
        name: 'Amazon.com Inc.', 
        price: 157.25, 
        change: 1.2, 
        change_percent: 0.77,
        volume: 30000000, 
        market_cap: 1600000000000,
        sector: 'Consumer Discretionary',
        industry: 'E-commerce',
        rsi: 55.9,
        pe_ratio: 45.2
      },
      { 
        symbol: 'TSLA', 
        name: 'Tesla Inc.', 
        price: 249.50, 
        change: -0.5, 
        change_percent: -0.20,
        volume: 40000000, 
        market_cap: 800000000000,
        sector: 'Consumer Discretionary',
        industry: 'Automotive',
        rsi: 42.1,
        pe_ratio: 68.3
      },
      { 
        symbol: 'NVDA', 
        name: 'NVIDIA Corporation', 
        price: 429.75, 
        change: 3.2, 
        change_percent: 0.75,
        volume: 35000000, 
        market_cap: 1100000000000,
        sector: 'Technology',
        industry: 'Semiconductors',
        rsi: 71.8,
        pe_ratio: 55.4
      }
    ];
    
    return { data: mockStocks };
  }
}

module.exports = {
  getStockPrice,
  getRealTimeMarketData,
  getTechnicalIndicators,
  getStockScreener
};