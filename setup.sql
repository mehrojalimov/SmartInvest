DROP DATABASE IF EXISTS accounts;
CREATE DATABASE accounts;
\c accounts

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL
);

DROP TABLE IF EXISTS stocks;
CREATE TABLE stocks (
    stock_id SERIAL PRIMARY KEY,
    stock_name VARCHAR(100) NOT NULL,
    stock_date DATE NOT NULL,
    stock_value INT NOT NULL
);

DROP TABLE IF EXISTS portfolio;
CREATE TABLE portfolio (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_id INT NOT NULL REFERENCES stocks(stock_id) ON DELETE CASCADE,
    total_quantity INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS portfolio_history;
CREATE TABLE portfolio_history (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    history JSONB NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_id INT NOT NULL REFERENCES stocks(stock_id) ON DELETE CASCADE,
    transaction_type VARCHAR(10) NOT NULL, -- BUY or SELL
    quantity INT NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);