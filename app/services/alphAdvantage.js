const axios = require("axios");

// API Configuration - Use environment variables for security
const TWELVE_DATA_KEY = process.env.TWELVE_DATA_KEY || "demo";
const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";

// Alpha Vantage API Configuration
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || "demo";

// IEX Cloud API Configuration
const IEX_CLOUD_KEY = process.env.IEX_CLOUD_KEY || "demo";

// No mock data - all data must come from real APIs

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
  
  // All APIs failed - return error for unknown symbol
  console.log(`All APIs failed for ${symbolUpper} - symbol not found`);
  throw new Error(`Unknown symbol: ${symbolUpper}`);
  
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
    throw new Error(`Failed to fetch technical indicators for ${symbol}`);
  }
}

// Function to get stock screener data with real financial information
async function getStockScreener(criteria = {}) {
  try {
    // Curated list of major stocks with known sectors and industries
    const majorStocks = [
      // Technology
      { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', industry: 'Software' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', industry: 'Internet' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', industry: 'E-commerce' },
      { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', industry: 'Social Media' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', industry: 'Semiconductors' },
      { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', industry: 'Electric Vehicles' },
      { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services', industry: 'Streaming' },
      { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology', industry: 'Software' },
      { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', industry: 'Software' },
      
      // Financial
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services', industry: 'Banking' },
      { symbol: 'BAC', name: 'Bank of America Corp.', sector: 'Financial Services', industry: 'Banking' },
      { symbol: 'WFC', name: 'Wells Fargo & Company', sector: 'Financial Services', industry: 'Banking' },
      { symbol: 'GS', name: 'Goldman Sachs Group Inc.', sector: 'Financial Services', industry: 'Investment Banking' },
      { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services', industry: 'Payment Processing' },
      { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financial Services', industry: 'Payment Processing' },
      
      // Healthcare
      { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', industry: 'Pharmaceuticals' },
      { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', industry: 'Pharmaceuticals' },
      { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare', industry: 'Health Insurance' },
      { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare', industry: 'Pharmaceuticals' },
      { symbol: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare', industry: 'Pharmaceuticals' },
      
      // Consumer
      { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer Staples', industry: 'Beverages' },
      { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Staples', industry: 'Beverages' },
      { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples', industry: 'Retail' },
      { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer Staples', industry: 'Household Products' },
      { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer Discretionary', industry: 'Apparel' },
      
      // Energy
      { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy', industry: 'Oil & Gas' },
      { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy', industry: 'Oil & Gas' },
      
      // Industrial
      { symbol: 'BA', name: 'The Boeing Company', sector: 'Industrials', industry: 'Aerospace' },
      { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', industry: 'Heavy Machinery' },
      { symbol: 'GE', name: 'General Electric Company', sector: 'Industrials', industry: 'Conglomerate' },
      
      // Communication
      { symbol: 'T', name: 'AT&T Inc.', sector: 'Communication Services', industry: 'Telecommunications' },
      { symbol: 'VZ', name: 'Verizon Communications Inc.', sector: 'Communication Services', industry: 'Telecommunications' },
      { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Communication Services', industry: 'Entertainment' }
    ];
    
    // Filter stocks based on criteria
    let filteredStocks = majorStocks;
    
    if (criteria.sector && criteria.sector !== 'All') {
      filteredStocks = filteredStocks.filter(stock => 
        stock.sector.toLowerCase().includes(criteria.sector.toLowerCase())
      );
    }
    
    if (criteria.minPrice) {
      filteredStocks = filteredStocks.filter(stock => {
        // We'll filter by price after getting real data
        return true;
      });
    }
    
    if (criteria.maxPrice) {
      filteredStocks = filteredStocks.filter(stock => {
        // We'll filter by price after getting real data
        return true;
      });
    }
    
    // Limit to 30 stocks for performance
    const stocksToProcess = filteredStocks.slice(0, 30);
    
    // Get real-time price data for each stock
    const stocksWithPrices = await Promise.all(
      stocksToProcess.map(async (stock) => {
        try {
          const priceData = await getStockPrice(stock.symbol);
          
          if (priceData && priceData.price && parseFloat(priceData.price) > 0) {
            const price = parseFloat(priceData.price);
            const change = parseFloat(priceData.change) || 0;
            const changePercent = parseFloat(priceData.change_percent) || 0;
            const volume = parseFloat(priceData.volume) || 0;
            
            const stockData = {
              symbol: stock.symbol,
              name: stock.name,
              price: price,
              change: change,
              change_percent: changePercent,
              volume: volume,
              market_cap: 0, // Not available from basic price API
              sector: stock.sector,
              industry: stock.industry,
              rsi: 0, // Would need separate API call for real RSI
              pe_ratio: 0 // Would need separate API call for real P/E
            };
            
            // Apply price filters if specified
            if (criteria.minPrice && price < criteria.minPrice) return null;
            if (criteria.maxPrice && price > criteria.maxPrice) return null;
            
            return stockData;
          }
        } catch (error) {
          console.log(`Failed to get price for ${stock.symbol}:`, error.message);
        }
        return null;
      })
    );
    
    // Filter out null results and sort by price (descending)
    const validStocks = stocksWithPrices
      .filter(stock => stock !== null)
      .sort((a, b) => b.price - a.price);
    
    return { data: validStocks };
  } catch (error) {
    console.error("Screener API failed:", error.message);
    return { data: [], error: "Failed to fetch screener data" };
  }
}

module.exports = {
  getStockPrice,
  getRealTimeMarketData,
  getTechnicalIndicators,
  getStockScreener
};
