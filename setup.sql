DROP DATABASE IF EXISTS accounts;
CREATE DATABASE accounts;
\c accounts
DROP TABLE IF EXISTS users;
CREATE TABLE users(
	id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(100)
);

-- dummy data
-- INSERT INTO users (username, password) VALUES ('abc', 'TODO');
