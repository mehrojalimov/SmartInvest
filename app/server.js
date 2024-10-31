const pg = require("pg");
const express = require("express");
const bodyParser = require("body-parser");  // Middleware for parsing JSON

const app = express();
const port = 3000;
const hostname = "localhost";

// Database connection setup
const env = require("../env.json");
const Pool = pg.Pool;
const pool = new Pool(env);
pool.connect().then(() => {
  console.log(`Connected to database ${env.database}`);
});

app.use(express.static("public"));
app.use(bodyParser.json());  // Parse incoming JSON requests

// Route to add a book
app.post("/add-book", async (req, res) => {
  const { title, genre, quality } = req.body;
  try {
    await pool.query(
      "INSERT INTO books (title, genre, quality) VALUES ($1, $2, $3)",
      [title, genre, quality]
    );
    res.json({ message: "Book added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error adding book" });
  }
});

// Route to search for books
app.get("/search-books", async (req, res) => {
  const { genre } = req.query;
  try {
    let result;
    if (genre) {
      result = await pool.query("SELECT * FROM books WHERE genre = $1", [genre]);
    } else {
      result = await pool.query("SELECT * FROM books");
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving books" });
  }
});

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
