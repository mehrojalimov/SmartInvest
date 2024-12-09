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
