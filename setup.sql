DROP DATABASE IF EXISTS accounts;
CREATE DATABASE accounts;
\c accounts
DROP TABLE IF EXISTS users;
CREATE TABLE users(
	id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(100)
);

DROP TABLE IF EXISTS stocks;
CREATE TABLE stocks (
    stock_id SERIAL PRIMARY KEY,
    stock_name VARCHAR(100) NOT NULL,
    stock_date DATE NOT NULL,
    stock_value NUMERIC(10, 2) NOT NULL
);

-- Portfolio Table
DROP TABLE IF EXISTS portfolio;
CREATE TABLE portfolio (
    portfolio_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    stock_id INT REFERENCES stocks(stock_id),
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('BUY', 'SELL')),
    quantity INT NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

\q