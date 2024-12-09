
const alphavantage = require("./services/alphAdvantage.js"); 


// make this script's dir the cwd
// b/c npm run start doesn't cd into src/ to run this
// and if we aren't in its cwd, all relative paths will break
process.chdir(__dirname);


let express = require("express");
let { Pool } = require("pg");
let argon2 = require("argon2"); // or bcrypt, whatever
let cookieParser = require("cookie-parser");
let crypto = require("crypto");
let env = require("../env.json");

let host;
let port = 3000;

/*****************************************************************************************************************
                                            Set up for Fly.io
******************************************************************************************************************/
let databaseConfig;

// fly.io sets NODE_ENV to production automatically, otherwise it's unset when running locally
if (process.env.NODE_ENV == "production") {
	host = "0.0.0.0";
	databaseConfig = { connectionString: process.env.DATABASE_URL };
} else {
	host = "localhost";
  databaseConfig = {
    user: env.user,
    host: env.host,
    database: env.database,
    password: env.password,
    port: env.port,
  };
}

let app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());


let pool = new Pool(databaseConfig);
pool.connect().then(() => {
  console.log("Connected to database");
});

/***************************************************************************************************************
                                        Set up token and cookies
****************************************************************************************************************/
// global object for storing tokens
// in a real app, we'd save them to a db so even if the server exits
// users will still be logged in when it restarts
let tokenStorage = {};

/* returns a random 32 byte string */
function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

// must use same cookie options when setting/deleting a given cookie with res.cookie and res.clearCookie
// or else the cookie won't actually delete
// remember that the token is essentially a password that must be kept secret
let cookieOptions = {
  httpOnly: true, // client-side JS can't access this cookie; important to mitigate cross-site scripting attack damage
  secure: true, // cookie will only be sent over HTTPS connections (and localhost); important so that traffic sniffers can't see it even if our user tried to use an HTTP version of our site, if we supported that
  sameSite: "strict", // browser will only include this cookie on requests to this domain, not other domains; important to prevent cross-site request forgery attacks
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
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/; // Alphanumeric and underscores, 3-20 chars
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
  
/*****************************************************************************************************************
                                                POST and GET methods
*****************************************************************************************************************/
app.post("/create", async (req, res) => {
    let { username, password } = req.body;
  
    if (!validateLogin(req.body)) {
      return res.status(400).send({ error: "Invalid username or password format" });
    }
  
    try {
      // Check if the username already exists
      let userCheck = await pool.query("SELECT 1 FROM users WHERE username = $1", [username]);
      if (userCheck.rows.length > 0) {
        return res.status(409).send({ error: "Username already exists" });
      }
  
      // Hash password
      let hash = await argon2.hash(password);
      await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hash]);
  
      // Auto login
      let token = makeToken();
      tokenStorage[token] = username;
      res.cookie("token", token, cookieOptions).status(201).send({ message: "Account created and logged in" });
  
    } catch (error) {
      console.error("Error creating user:", error);
      res.sendStatus(500);
    }
  });
  

  app.post("/login", async (req, res) => {
    let { body } = req;
  
    // Validate request body
    if (!validateLogin(body)) {
      return res.status(400).send({ error: "Invalid username or password format" });
    }
  
    let { username, password } = body;
    let result;
  
    try {
      // Check if the username exists and get the hashed password
      result = await pool.query("SELECT password FROM users WHERE username = $1", [username]);
    } catch (error) {
      console.error("Database error during SELECT:", error);
      return res.status(500).send({ error: "Internal server error" });
    }
  
    // If the username doesn't exist
    if (result.rows.length === 0) {
      return res.status(400).send({ error: "Incorrect username or password" });
    }
  
    let hash = result.rows[0].password;
    let verifyResult;
  
    try {
      // Verify the provided password matches the stored hash
      verifyResult = await argon2.verify(hash, password);
    } catch (error) {
      console.error("Error during password verification:", error);
      return res.status(500).send({ error: "Internal server error" });
    }
  
    // If password does not match
    if (!verifyResult) {
      console.log("Incorrect credentials for username:", username);
      return res.status(400).send({ error: "Incorrect username or password" });
    }
  
    // Generate and store login token
    let token = makeToken();
    tokenStorage[token] = username;
    console.log("User logged in with token:", token);
  
    return res.cookie("token", token, cookieOptions).status(200).send({ message: "Login successful" });
  });
  
  /* Authorization middleware */
  let authorize = (req, res, next) => {
    let { token } = req.cookies;
    if (!token || !tokenStorage.hasOwnProperty(token)) {
      console.log("Unauthorized access attempt");
      return res.status(403).send({ error: "Unauthorized access" });
    }
    console.log("Authorized token:", token);
    next();
  };
  

app.post("/logout", (req, res) => {
  let { token } = req.cookies;

  if (token === undefined) {
    console.log("Already logged out");
    return res.sendStatus(400); // TODO
  }

  if (!tokenStorage.hasOwnProperty(token)) {
    console.log("Token doesn't exist");
    return res.sendStatus(400); // TODO
  }

  console.log("Before", tokenStorage);
  delete tokenStorage[token];
  console.log("Deleted", tokenStorage);

  return res.clearCookie("token", cookieOptions).send();
});

app.get("/public", (req, res) => {
  return res.send("A public message\n");
});

// authorize middleware will be called before request handler
// authorize will only pass control to this request handler if the user passes authorization
app.get("/private", authorize, (req, res) => {
  return res.send("A private message\n");
});

app.get("/dashboard", authorize, (req, res) => {
  res.sendFile(__dirname + "/public/index.html");  // Serve the dashboard HTML
});

// Fetch stock data from Alphadvantage API
app.get("/api/stock/:symbol", async (req, res) => {
  const stockSymbol = req.params.symbol.toUpperCase();  // Get the symbol from the URL parameter

  try {
    const stockData = await alphavantage.getStockPrice(stockSymbol);  // Assuming this service fetches stock data
    if (!stockData) {
      return res.status(404).json({ error: "Stock not found" });
    }
    return res.json(stockData);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return res.status(500).json({ error: "An error occurred while fetching stock data" });
  }
});

  app.get("/api/portfolio", authorize, async (req, res) => {
    const username = tokenStorage[req.cookies.token];

    try {
      const userResult = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
      if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });

      const user_id = userResult.rows[0].id;

      const portfolio = await pool.query(
        `SELECT s.stock_name,
       SUM(p.total_quantity) AS total_quantity
FROM portfolio p
JOIN stocks s ON p.stock_id = s.stock_id
WHERE p.user_id = $1
GROUP BY s.stock_name;
`,
        [user_id]
      );

      res.status(200).json({ portfolio: portfolio.rows });
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });


  app.post("/api/portfolio/transaction", authorize, async (req, res) => {
      const { stock_name, transaction_type, quantity } = req.body;
      const username = tokenStorage[req.cookies.token];
  
      try {
        const userResult = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
  
        const user_id = userResult.rows[0].id;
  
        // Insert transaction into the portfolio
        await pool.query(
          `INSERT INTO portfolio (user_id, stock_id, transaction_type, quantity, transaction_date)
          VALUES ($1, (SELECT stock_id FROM stocks WHERE stock_name = $2), $3, $4, CURRENT_TIMESTAMP)`,
          [user_id, stock_name, transaction_type, quantity]
        );
  
        res.status(200).json({ message: "Transaction saved successfully" });
      } catch (error) {
        console.error("Error saving transaction:", error.message);
        res.status(500).json({ error: "Failed to save transaction" });
      }
    });

  // Retrieve all stocks
  // app.get('/api/stocks', async (req, res) => {
  //   try {
  //       const result = await pool.query('SELECT * FROM stocks');
  //       res.json(result.rows);
  //   } catch (error) {
  //       console.error('Error fetching stocks:', error);
  //       res.status(500).send('Error fetching stocks.');
  //   }
  // });

  // Save stock to database
  // app.post('/api/stock', async (req, res) => {
  //   const { stock_name, stock_date, stock_value } = req.body;
  //   try {
  //       await pool.query(
  //           `INSERT INTO stocks (stock_name, stock_date, stock_value)
  //           VALUES ($1, $2, $3)
  //           ON CONFLICT (stock_name, stock_date) DO UPDATE 
  //           SET stock_value = EXCLUDED.stock_value`,
  //           [stock_name, stock_date, stock_value]
  //       );
  //       res.status(200).send('Stock data saved successfully.');
  //   } catch (error) {
  //       console.error('Error saving stock data:', error);
  //       res.status(500).send('Error saving stock data.');
  //   }
  // });
  
  
  app.listen(port, host, () => {
  console.log(`http://${host}:${port}`);
});