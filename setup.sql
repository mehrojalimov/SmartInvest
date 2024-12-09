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
CREATE TABLE stocks(
    stock_id SERIAL PRIMARY KEY,
    stock_name VARCHAR(100),
    stock_date DATE,
    stock_value INT(50)

);


