let express = require("express");
let { Pool } = require("pg");
let argon2 = require("argon2"); // or bcrypt, whatever
let cookieParser = require("cookie-parser");
let crypto = require("crypto");
let env = require("../env.json");

let hostname = "localhost";
let port = 3000;

let pool = new Pool(env);
let app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

// global object for storing tokens
// in a real app, we'd save them to a db so even if the server exits
// users will still be logged in when it restarts
let tokenStorage = {};

pool.connect().then(() => {
  console.log("Connected to database");
});

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

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});
