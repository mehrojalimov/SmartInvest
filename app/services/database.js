const Database = require('better-sqlite3');
const path = require('path');
const argon2 = require('argon2');

class DatabaseService {
  constructor() {
    // Create database in the project root
    this.db = new Database(path.join(__dirname, '../../database.sqlite'));
    this.initializeDatabase();
  }

  initializeDatabase() {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Create tables
    this.createTables();
    
    // Insert sample data
    this.insertSampleData();
  }

  createTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Stocks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stocks (
        stock_id INTEGER PRIMARY KEY AUTOINCREMENT,
        stock_name TEXT UNIQUE NOT NULL
      )
    `);

    // Portfolio table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS portfolio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        stock_id INTEGER NOT NULL,
        total_quantity INTEGER NOT NULL DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (stock_id) REFERENCES stocks (stock_id) ON DELETE CASCADE
      )
    `);

    // Portfolio history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS portfolio_history (
        user_id INTEGER PRIMARY KEY,
        history TEXT NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Transactions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        stock_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
        quantity INTEGER NOT NULL,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (stock_id) REFERENCES stocks (stock_id) ON DELETE CASCADE
      )
    `);
  }

  async insertSampleData() {
    // Check if we already have data
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count > 0) return;

    // Create a default user
    const hashedPassword = await argon2.hash('password123');
    this.db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('demo', hashedPassword);

    // Insert some sample stocks
    const sampleStocks = ['AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL'];

    const insertStock = this.db.prepare('INSERT INTO stocks (stock_name) VALUES (?)');
    sampleStocks.forEach(stock => insertStock.run(stock));

    console.log('Sample data inserted successfully');
  }

  // User methods
  async createUser(username, password) {
    const hashedPassword = await argon2.hash(password);
    try {
      const result = this.db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
      return { id: result.lastInsertRowid, username };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Username already exists');
      }
      throw error;
    }
  }

  async verifyUser(username, password) {
    const user = this.db.prepare('SELECT id, password FROM users WHERE username = ?').get(username);
    if (!user) return null;

    const isValid = await argon2.verify(user.password, password);
    return isValid ? { id: user.id, username } : null;
  }

  getUserById(id) {
    return this.db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
  }

  getUserByUsername(username) {
    return this.db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
  }

  // Stock methods
  getStockByName(stockName) {
    return this.db.prepare('SELECT * FROM stocks WHERE stock_name = ?').get(stockName);
  }

  createStock(stockName) {
    const result = this.db.prepare('INSERT INTO stocks (stock_name) VALUES (?)').run(stockName);
    return result.lastInsertRowid;
  }

  // Portfolio methods
  getPortfolio(userId) {
    return this.db.prepare(`
      SELECT s.stock_name, SUM(p.total_quantity) AS total_quantity
      FROM portfolio p
      JOIN stocks s ON p.stock_id = s.stock_id
      WHERE p.user_id = ?
      GROUP BY s.stock_name
    `).all(userId);
  }

  addTransaction(userId, stockName, transactionType, quantity) {
    // Get or create stock
    let stock = this.getStockByName(stockName);
    if (!stock) {
      const stockId = this.createStock(stockName);
      stock = { stock_id: stockId };
    }

    // Add transaction
    this.db.prepare(`
      INSERT INTO transactions (user_id, stock_id, transaction_type, quantity)
      VALUES (?, ?, ?, ?)
    `).run(userId, stock.stock_id, transactionType, quantity);

    // Update portfolio
    const existingPortfolio = this.db.prepare(`
      SELECT total_quantity FROM portfolio 
      WHERE user_id = ? AND stock_id = ?
    `).get(userId, stock.stock_id);

    if (existingPortfolio) {
      const newQuantity = existingPortfolio.total_quantity + (transactionType === 'BUY' ? quantity : -quantity);
      if (newQuantity <= 0) {
        this.db.prepare('DELETE FROM portfolio WHERE user_id = ? AND stock_id = ?').run(userId, stock.stock_id);
      } else {
        this.db.prepare(`
          UPDATE portfolio SET total_quantity = ?, last_updated = CURRENT_TIMESTAMP
          WHERE user_id = ? AND stock_id = ?
        `).run(newQuantity, userId, stock.stock_id);
      }
    } else if (transactionType === 'BUY') {
      this.db.prepare(`
        INSERT INTO portfolio (user_id, stock_id, total_quantity)
        VALUES (?, ?, ?)
      `).run(userId, stock.stock_id, quantity);
    }
  }

  // Portfolio history methods
  getPortfolioHistory(userId) {
    const result = this.db.prepare('SELECT history FROM portfolio_history WHERE user_id = ?').get(userId);
    return result ? JSON.parse(result.history) : null;
  }

  savePortfolioHistory(userId, history) {
    this.db.prepare(`
      INSERT OR REPLACE INTO portfolio_history (user_id, history, last_updated)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(userId, JSON.stringify(history));
  }

  // Get recent transactions
  getRecentTransactions(userId, limit = 10) {
    return this.db.prepare(`
      SELECT t.*, s.stock_name
      FROM transactions t
      JOIN stocks s ON t.stock_id = s.stock_id
      WHERE t.user_id = ?
      ORDER BY t.transaction_date DESC
      LIMIT ?
    `).all(userId, limit);
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseService;
