const express = require("express");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const path = require("path");
const DatabaseService = require("./services/database");
const { getStockPrice, getRealTimeMarketData, getTechnicalIndicators, getStockScreener } = require("./services/alphAdvantage");

// Set up paths relative to project root

let app = express();
let host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
let port = process.env.PORT || 3000;

// CORS middleware (only in development)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

// Serve static files from dist directory in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
} else {
  app.use(express.static("public"));
}
app.use(express.json());
app.use(cookieParser());

// Initialize database
const db = new DatabaseService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Server is running', port: port, host: host });
});

/***************************************************************************************************************
                                        Set up token and cookies
****************************************************************************************************************/
// Global object for storing tokens
let tokenStorage = {};

// Authorization middleware
let authorize = (req, res, next) => {
  let { token } = req.cookies;
  if (!token || !tokenStorage.hasOwnProperty(token)) {
    console.log("Unauthorized access attempt");
    return res.status(403).json({ error: "Unauthorized access" });
  }
  
  // Get username from token and find user
  const username = tokenStorage[token];
  const user = db.getUserByUsername(username);
  
  if (!user) {
    console.log("User not found for token");
    return res.status(403).json({ error: "User not found" });
  }
  
  // Add user info to request
  req.username = username;
  req.userId = user.id;
  req.user = user; // Add full user object for compatibility
  console.log("Authorized user:", username, "ID:", user.id);
  next();
};

/* returns a random 32 byte string */
function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Cookie options
let cookieOptions = {
  httpOnly: true,
  secure: false, // Set to false for localhost development
  sameSite: "lax", // Changed from "strict" to "lax" for better compatibility
};

/******************************************************************************************************************
                                        Set up validate account function
******************************************************************************************************************/
function validateLogin(body) {
  if (!body || typeof body.username !== 'string' || typeof body.password !== 'string') {
    return false;
  }

  const username = body.username.trim();
  const password = body.password;

  // Username and password rules
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  const minPasswordLength = 8;

  // Validate username
  if (!usernameRegex.test(username)) {
    console.log("Username validation failed");
    return false;
  }

  // Validate password length
  if (password.length < minPasswordLength) {
    console.log("Password too short");
    return false;
  }

  return true;
}

// Enhanced validation function for registration with detailed error messages
function validateRegistration(body) {
  if (!body || typeof body.username !== 'string' || typeof body.password !== 'string') {
    return { valid: false, error: "Username and password are required" };
  }

  const username = body.username.trim();
  const password = body.password;

  // Username rules
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  
  // Password rules
  const minPasswordLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // Validate username
  if (username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters long" };
  }
  if (username.length > 20) {
    return { valid: false, error: "Username must be no more than 20 characters long" };
  }
  if (!usernameRegex.test(username)) {
    return { valid: false, error: "Username can only contain letters, numbers, and underscores" };
  }

  // Validate password
  if (password.length < minPasswordLength) {
    return { valid: false, error: "Password must be at least 8 characters long" };
  }
  if (!hasUpperCase) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }
  if (!hasLowerCase) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }
  if (!hasNumbers) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  if (!hasSpecialChar) {
    return { valid: false, error: "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)" };
  }

  return { valid: true };
}

/*****************************************************************************************************************
                                                POST and GET methods
*****************************************************************************************************************/

// Portfolio history endpoints
app.post('/api/portfolio/history', authorize, async (req, res) => {
  const { portfolioHistory, dates } = req.body;
  const userId = req.userId;

  try {
    db.savePortfolioHistory(userId, { portfolioHistory, dates });
    res.status(200).json({ message: 'Portfolio history saved successfully.' });
  } catch (error) {
    console.error('Error saving portfolio history:', error);
    res.status(500).json({ error: 'Error saving portfolio history.' });
  }
});

app.get('/api/portfolio/history', authorize, async (req, res) => {
  const userId = req.userId;

  try {
    const history = db.getPortfolioHistory(userId);
    if (!history) {
      return res.status(404).json({ error: 'No history found.' });
    }
    res.status(200).json(history);
  } catch (error) {
    console.error('Error loading portfolio history:', error);
    res.status(500).json({ error: 'Error loading portfolio history.' });
  }
});

// User authentication endpoints
app.post("/api/create", async (req, res) => {
  const { username, password } = req.body;

  // Validate registration with detailed error messages
  const validation = validateRegistration(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const user = await db.createUser(username, password);
    
    // Auto login
    let token = makeToken();
    tokenStorage[token] = user.username;
    res.cookie("token", token, cookieOptions).status(201).json({ 
      message: "Account created and logged in",
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.message === 'Username already exists') {
      res.status(409).json({ error: "Account already exists with this username" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!validateLogin(req.body)) {
    return res.status(400).json({ error: "Invalid username or password format" });
  }

  try {
    const user = await db.verifyUser(username, password);
    
    if (!user) {
      return res.status(400).json({ error: "Incorrect username or password" });
    }

    // Generate and store login token
    let token = makeToken();
    tokenStorage[token] = username;
    console.log("User logged in with token:", token);

    return res.cookie("token", token, cookieOptions).status(200).json({ 
      message: "Login successful",
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/api/logout", (req, res) => {
  let { token } = req.cookies;

  if (token === undefined) {
    console.log("Already logged out");
    return res.status(400).json({ error: "Already logged out" });
  }

  if (!tokenStorage.hasOwnProperty(token)) {
    console.log("Token doesn't exist");
    return res.status(400).json({ error: "Invalid token" });
  }

  console.log("Before", Object.keys(tokenStorage).length);
  delete tokenStorage[token];
  console.log("After", Object.keys(tokenStorage).length);

  return res.clearCookie("token", cookieOptions).json({ message: "Logged out successfully" });
});

// Public endpoints
app.get("/api/public", (req, res) => {
  return res.json({ message: "A public message" });
});

// Private endpoints
app.get("/api/private", authorize, (req, res) => {
  return res.json({ message: "A private message" });
});

// Auth check endpoint
app.get("/api/auth/check", authorize, (req, res) => {
  return res.json({ 
    authenticated: true, 
    user: { id: req.userId, username: req.username } 
  });
});

// Dashboard endpoint
app.get("/dashboard", authorize, (req, res) => {
  res.sendFile(__dirname + "/public/dashboard/index.html");
});

// Stock data endpoint
app.get("/api/stock/:symbol", async (req, res) => {
  const stockSymbol = req.params.symbol.toUpperCase();

  // Input validation
  if (!stockSymbol || stockSymbol.length < 1 || stockSymbol.length > 10) {
    return res.status(400).json({ error: "Invalid stock symbol" });
  }

  try {
    const stockData = await getStockPrice(stockSymbol);
    if (!stockData) {
      return res.status(404).json({ error: "Stock not found" });
    }
    return res.json(stockData);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    if (error.message.includes('No data found')) {
      return res.status(404).json({ error: "Stock symbol not found or invalid" });
    }
    return res.status(500).json({ error: "An error occurred while fetching stock data" });
  }
});

// Portfolio endpoints
app.get("/api/portfolio", authorize, async (req, res) => {
  const userId = req.userId;

  try {
    const portfolio = db.getPortfolio(userId);
    res.status(200).json({ portfolio });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

// Get cost basis (total amount invested) for each stock
app.get("/api/portfolio/cost-basis", authorize, async (req, res) => {
  const userId = req.userId;

  try {
    const costBasis = db.getCostBasis(userId);
    console.log(`\n💰 COST BASIS DEBUG for User ${userId}:`);
    console.log('  Cost Basis Data:', costBasis);
    console.log('  Total Cost Basis:', costBasis.reduce((sum, item) => sum + item.cost_basis, 0));
    res.status(200).json({ costBasis });
  } catch (error) {
    console.error("Error fetching cost basis:", error);
    res.status(500).json({ error: "Failed to fetch cost basis" });
  }
});

app.post("/api/portfolio/transaction", authorize, async (req, res) => {
  const { stock_name, transaction_type, quantity } = req.body;
  const userId = req.userId;

  // Input validation
  if (!stock_name || !transaction_type || !quantity) {
    return res.status(400).json({ error: "Missing required fields: stock_name, transaction_type, quantity" });
  }

  if (!['BUY', 'SELL'].includes(transaction_type)) {
    return res.status(400).json({ error: "transaction_type must be 'BUY' or 'SELL'" });
  }

  if (isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ error: "quantity must be a positive number" });
  }

  try {
    // Get current stock price
    console.log(`\n🔄 PROCESSING ${transaction_type} TRANSACTION:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Stock: ${stock_name}`);
    console.log(`   Quantity: ${quantity}`);
    
    const stockData = await getStockPrice(stock_name);
    const stockPrice = parseFloat(stockData.price);
    const tradeAmount = stockPrice * parseInt(quantity);
    
    console.log(`   Stock Price: $${stockPrice.toFixed(2)}`);
    console.log(`   Trade Amount: $${tradeAmount.toFixed(2)}`);
    
    // Get portfolio data before transaction
    const portfolioBefore = db.getPortfolio(userId);
    const cashBalanceBefore = db.getUserCashBalance(userId);
    const costBasisBefore = db.getCostBasis(userId);
    
    // Calculate portfolio value before transaction
    let portfolioValueBefore = 0;
    for (const asset of portfolioBefore) {
      try {
        const assetStockData = await getStockPrice(asset.stock_name);
        const assetPrice = parseFloat(assetStockData.price);
        portfolioValueBefore += asset.total_quantity * assetPrice;
      } catch (e) {
        console.log(`   Warning: Could not get price for ${asset.stock_name} for portfolio calculation`);
      }
    }
    
    const totalValueBefore = portfolioValueBefore + cashBalanceBefore;
    const totalInvestedBefore = costBasisBefore.reduce((sum, cb) => sum + cb.cost_basis, 0);
    
    console.log(`\n📊 PORTFOLIO BEFORE TRANSACTION:`);
    console.log(`   Cash Balance: $${cashBalanceBefore.toFixed(2)}`);
    console.log(`   Portfolio Value: $${portfolioValueBefore.toFixed(2)}`);
    console.log(`   Total Value: $${totalValueBefore.toFixed(2)}`);
    console.log(`   Total Invested: $${totalInvestedBefore.toFixed(2)}`);
    console.log(`   Profit/Loss: $${(totalValueBefore - totalInvestedBefore).toFixed(2)}`);
    
    // Execute transaction
    db.addTransaction(userId, stock_name, transaction_type, parseInt(quantity), stockPrice);
    
    // Get portfolio data after transaction
    const portfolioAfter = db.getPortfolio(userId);
    const cashBalanceAfter = db.getUserCashBalance(userId);
    const costBasisAfter = db.getCostBasis(userId);
    
    // Calculate portfolio value after transaction
    let portfolioValueAfter = 0;
    for (const asset of portfolioAfter) {
      try {
        const assetStockData = await getStockPrice(asset.stock_name);
        const assetPrice = parseFloat(assetStockData.price);
        portfolioValueAfter += asset.total_quantity * assetPrice;
      } catch (e) {
        console.log(`   Warning: Could not get price for ${asset.stock_name} for portfolio calculation`);
      }
    }
    
    const totalValueAfter = portfolioValueAfter + cashBalanceAfter;
    const totalInvestedAfter = costBasisAfter.reduce((sum, cb) => sum + cb.cost_basis, 0);
    
    console.log(`\n📊 PORTFOLIO AFTER TRANSACTION:`);
    console.log(`   Cash Balance: $${cashBalanceAfter.toFixed(2)}`);
    console.log(`   Portfolio Value: $${portfolioValueAfter.toFixed(2)}`);
    console.log(`   Total Value: $${totalValueAfter.toFixed(2)}`);
    console.log(`   Total Invested: $${totalInvestedAfter.toFixed(2)}`);
    console.log(`   Profit/Loss: $${(totalValueAfter - totalInvestedAfter).toFixed(2)}`);
    
    console.log(`\n💰 TRANSACTION IMPACT:`);
    console.log(`   Cash Change: $${(cashBalanceAfter - cashBalanceBefore).toFixed(2)}`);
    console.log(`   Portfolio Value Change: $${(portfolioValueAfter - portfolioValueBefore).toFixed(2)}`);
    console.log(`   Total Value Change: $${(totalValueAfter - totalValueBefore).toFixed(2)}`);
    console.log(`   Invested Change: $${(totalInvestedAfter - totalInvestedBefore).toFixed(2)}`);
    console.log(`   Profit/Loss Change: $${((totalValueAfter - totalInvestedAfter) - (totalValueBefore - totalInvestedBefore)).toFixed(2)}`);
    console.log(`\n✅ TRANSACTION COMPLETED SUCCESSFULLY\n`);
    
    res.status(200).json({ 
      message: "Transaction saved successfully",
      tradeAmount: tradeAmount,
      cashBalance: cashBalanceAfter,
      portfolioValue: portfolioValueAfter,
      totalValue: totalValueAfter,
      totalInvested: totalInvestedAfter
    });
  } catch (error) {
    console.error("Error saving transaction:", error.message);
    if (error.message === 'Insufficient stocks to sell') {
      res.status(400).json({ error: "Insufficient stocks to sell" });
    } else if (error.message === 'Cannot sell stock you do not own') {
      res.status(400).json({ error: "Cannot sell stock you do not own" });
    } else if (error.message === 'Insufficient cash balance') {
      res.status(400).json({ error: "Insufficient cash balance" });
    } else {
      res.status(500).json({ error: "Failed to save transaction" });
    }
  }
});

// Cash balance endpoint
app.get("/api/cash-balance", authorize, async (req, res) => {
  const userId = req.userId;

  try {
    const cashBalance = db.getUserCashBalance(userId);
    res.status(200).json({ cashBalance });
  } catch (error) {
    console.error("Error fetching cash balance:", error);
    res.status(500).json({ error: "Failed to fetch cash balance" });
  }
});

// Recent transactions endpoint
app.get("/api/transactions", authorize, async (req, res) => {
  const userId = req.userId;

  try {
    const transactions = db.getRecentTransactions(userId, 10);
    res.status(200).json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: "SQLite",
    version: "1.0.0"
  });
});

// Cache for market data to reduce API calls
let marketDataCache = {};
let lastCacheUpdate = 0;
const CACHE_DURATION = 300000; // 5 minutes cache for real prices

// Clear cache function for testing
function clearMarketDataCache() {
  marketDataCache = {};
  lastCacheUpdate = 0;
}

// Real-time market data endpoint
app.get("/api/market/realtime", async (req, res) => {
  try {
    const symbols = req.query.symbols ? req.query.symbols.split(',') : ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (marketDataCache[symbols.join(',')] && (now - lastCacheUpdate) < CACHE_DURATION) {
      return res.json(marketDataCache[symbols.join(',')]);
    }
    
    const marketData = await getRealTimeMarketData(symbols);
    
    // Check if the response contains an error (API rate limit, etc.)
    if (!marketData || marketData.code || marketData.message) {
      console.log("API returned error, using mock data");
      // Return mock data when API fails - use realistic stock prices
      const realisticPrices = {
        'AAPL': { base: 177.30, range: 0.02 },
        'MSFT': { base: 383.75, range: 0.02 },
        'GOOGL': { base: 144.35, range: 0.02 },
        'AMZN': { base: 157.25, range: 0.02 },
        'TSLA': { base: 249.50, range: 0.03 },
        'NVDA': { base: 429.75, range: 0.02 },
        'META': { base: 485.20, range: 0.02 },
        'NFLX': { base: 485.20, range: 0.02 },
        'AMD': { base: 120.45, range: 0.03 },
        'INTC': { base: 45.80, range: 0.02 },
        'SPY': { base: 520.15, range: 0.01 },
        'QQQ': { base: 450.30, range: 0.01 }
      };
      
      const mockData = {};
      symbols.forEach(symbol => {
        const stockData = realisticPrices[symbol] || { base: 100, range: 0.02 };
        const basePrice = stockData.base;
        const changeAmount = (Math.random() - 0.5) * (basePrice * stockData.range);
        const currentPrice = basePrice + changeAmount;
        const changePercent = (changeAmount / basePrice) * 100;
        
        mockData[symbol] = {
          price: currentPrice.toFixed(2),
          change: changeAmount.toFixed(2),
          change_percent: changePercent.toFixed(2)
        };
      });
      marketDataCache[symbols.join(',')] = mockData;
      lastCacheUpdate = now;
      return res.json(mockData);
    }
    
    // Cache the successful response
    marketDataCache[symbols.join(',')] = marketData;
    lastCacheUpdate = now;
    res.json(marketData);
  } catch (error) {
    console.error("Error fetching real-time market data:", error);
    // Return mock data on error - use realistic stock prices
    const symbols = req.query.symbols ? req.query.symbols.split(',') : ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];
    const realisticPrices = {
      'AAPL': { base: 177.30, range: 0.02 },
      'MSFT': { base: 383.75, range: 0.02 },
      'GOOGL': { base: 144.35, range: 0.02 },
      'AMZN': { base: 157.25, range: 0.02 },
      'TSLA': { base: 249.50, range: 0.03 },
      'NVDA': { base: 429.75, range: 0.02 },
      'META': { base: 485.20, range: 0.02 },
      'NFLX': { base: 485.20, range: 0.02 },
      'AMD': { base: 120.45, range: 0.03 },
      'INTC': { base: 45.80, range: 0.02 },
      'SPY': { base: 520.15, range: 0.01 },
      'QQQ': { base: 450.30, range: 0.01 }
    };
    
    const mockData = {};
    symbols.forEach(symbol => {
      const stockData = realisticPrices[symbol] || { base: 100, range: 0.02 };
      const basePrice = stockData.base;
      const changeAmount = (Math.random() - 0.5) * (basePrice * stockData.range);
      const currentPrice = basePrice + changeAmount;
      const changePercent = (changeAmount / basePrice) * 100;
      
      mockData[symbol] = {
        price: currentPrice.toFixed(2),
        change: changeAmount.toFixed(2),
        change_percent: changePercent.toFixed(2)
      };
    });
    marketDataCache[symbols.join(',')] = mockData;
    lastCacheUpdate = now;
    res.json(mockData);
  }
});

// Technical indicators endpoint for algorithmic screening
app.get("/api/indicators/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { indicator = 'RSI' } = req.query;
    
    const indicators = await getTechnicalIndicators(symbol, indicator);
    
    if (!indicators) {
      return res.status(404).json({ error: "Indicators not found" });
    }
    
    res.json(indicators);
  } catch (error) {
    console.error("Error fetching technical indicators:", error);
    res.status(500).json({ error: "Failed to fetch indicators" });
  }
});

// Stock screener endpoint for algorithmic screening
app.get("/api/screener", async (req, res) => {
  try {
    const criteria = {
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      min_volume: req.query.min_volume,
      max_volume: req.query.max_volume,
      min_market_cap: req.query.min_market_cap,
      max_market_cap: req.query.max_market_cap,
      sector: req.query.sector,
      industry: req.query.industry
    };
    
    // Remove undefined values
    Object.keys(criteria).forEach(key => 
      criteria[key] === undefined && delete criteria[key]
    );
    
    const screenerData = await getStockScreener(criteria);
    
    if (!screenerData) {
      return res.status(503).json({ error: "Screener data unavailable" });
    }
    
    res.json(screenerData);
  } catch (error) {
    console.error("Error fetching screener data:", error);
    res.status(500).json({ error: "Failed to fetch screener data" });
  }
});

// Portfolio analytics endpoint with advanced metrics
app.get("/api/portfolio/analytics", authorize, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    console.log(`\n📈 CALCULATING PORTFOLIO ANALYTICS:`);
    console.log(`   User ID: ${userId}`);
    
    const portfolio = db.getUserPortfolio(userId);
    const transactions = db.getRecentTransactions(userId, 100);
    const cashBalance = db.getUserCashBalance(userId);
    const costBasis = db.getCostBasis(userId);
    
    console.log(`   Portfolio Holdings: ${portfolio.length} stocks`);
    console.log(`   Total Transactions: ${transactions.length}`);
    console.log(`   Cash Balance: $${cashBalance.toFixed(2)}`);
    console.log(`   Cost Basis Entries: ${costBasis.length}`);
    
    // Calculate total invested value using proper cost basis
    const totalCost = costBasis.reduce((sum, cb) => sum + cb.cost_basis, 0);
    
    // Calculate portfolio value and asset allocation
    let totalValue = cashBalance;
    const assetAllocation = {};
    
    // Calculate basic portfolio metrics
    for (const holding of portfolio) {
      try {
        const stockData = await getStockPrice(holding.stock_name);
        const currentPrice = parseFloat(stockData.price);
        const marketValue = holding.total_quantity * currentPrice;
        
        totalValue += marketValue;
        assetAllocation[holding.stock_name] = {
          quantity: holding.total_quantity,
          currentPrice: currentPrice,
          marketValue: marketValue,
          allocation: 0
        };
      } catch (error) {
        console.error(`Error calculating metrics for ${holding.stock_name}:`, error);
        // Skip this holding if we can't get the price - don't use mock data
        console.warn(`Skipping ${holding.stock_name} in analytics due to price fetch error`);
      }
    }
    
    // Calculate allocations
    Object.keys(assetAllocation).forEach(symbol => {
      if (totalValue > 0) {
        assetAllocation[symbol].allocation = (assetAllocation[symbol].marketValue / totalValue) * 100;
      }
    });
    
    // Calculate portfolio value as: Invested Amount + Performance
    const currentMarketValue = totalValue - cashBalance; // Current market value of stocks
    const performance = currentMarketValue - totalCost; // Gain/loss on investments
    const portfolioValue = totalCost + performance; // Invested + Performance
    const unrealizedPnL = performance; // Same as performance
    const totalReturn = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;
    const maxAllocation = Object.keys(assetAllocation).length > 0 ? 
      Math.max(...Object.values(assetAllocation).map(a => a.allocation)) : 0;
    
    console.log(`\n📊 PORTFOLIO ANALYTICS RESULTS:`);
    console.log(`   Total Account Value: $${totalValue.toFixed(2)} (Cash + Portfolio)`);
    console.log(`   Cash Balance: $${cashBalance.toFixed(2)}`);
    console.log(`   Portfolio Value: $${portfolioValue.toFixed(2)} (Invested + Performance)`);
    console.log(`   Total Invested: $${totalCost.toFixed(2)} (Cost basis)`);
    console.log(`   Performance: $${performance.toFixed(2)} (Gain/Loss on investments)`);
    console.log(`   Total Return: ${totalReturn.toFixed(2)}%`);
    console.log(`   Portfolio Diversification: ${Object.keys(assetAllocation).length} stocks`);
    console.log(`   Max Allocation: ${maxAllocation.toFixed(2)}%`);
    console.log(`\n✅ ANALYTICS CALCULATED SUCCESSFULLY\n`);
    
    res.json({
      totalValue: totalValue,
      portfolioValue: portfolioValue,
      totalCost: totalCost,
      cashBalance: cashBalance,
      realizedPnL: 0, // Simplified for now
      unrealizedPnL: unrealizedPnL,
      totalPnL: unrealizedPnL,
      totalReturn: totalReturn,
      assetAllocation: assetAllocation,
      portfolioDiversification: Object.keys(assetAllocation).length,
      riskMetrics: {
        concentration: maxAllocation,
        diversification: Object.keys(assetAllocation).length
      }
    });
  } catch (error) {
    console.error("Error calculating portfolio analytics:", error);
    res.status(500).json({ error: "Failed to calculate analytics" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Serve React app for client-side routing (production only)
if (process.env.NODE_ENV === "production") {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

const server = app.listen(port, host, () => {
  console.log(`SmartInvest Server running on http://${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Working directory: ${process.cwd()}`);
  console.log(`Dist directory exists: ${require('fs').existsSync(path.join(__dirname, '../dist'))}`);
  console.log('Server started successfully');
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close();
  process.exit(0);
});