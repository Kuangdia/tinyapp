//-------------Constants-------------//
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const { restart } = require("nodemon");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');



//-------------Import Helper Functions-------------//
const {
  generateRandomString,
  getUserByEmail,
  urlsForUser
} = require("./helpers");



//-------------MiddleWare Functions-------------//
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['S3cR3t'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));



//-------------Default Database-------------//
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: bcrypt.hashSync('123', 10)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync('123', 10)
  }
};


//-------------Listening for Connections-------------//
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});



//-------------URLs Homepage-------------//
app.get("/", (req, res) => {
  res.redirect("/urls");
});


// shows your current short and long URLs along with edit and delete functions for them
app.get("/urls", (req, res) => {
  const userId = req.session["user_id"];
  const templateVars = {
    urls: urlsForUser(userId, urlDatabase),
    user: users[userId]
  };

  if (!users[userId]) {
    res.status(403).send("Please login to use TinyAPP. <br></br><a href='/login'>Click to login.</a>");
  }

  res.render("urls_index", templateVars);
});


app.post("/urls", (req, res) => {
  const userID = req.session["user_id"];
  const longURL = req.body.longURL;
  const newKey = generateRandomString();

  // generates a new urlDatabase object
  urlDatabase[newKey] = { longURL, userID };

  res.redirect(`/urls/${newKey}`);
});



//-------------Login Page-------------//
app.get("/login", (req, res) => {
  const userId = req.session["user_id"];
  const templateVars = {
    urls: urlsForUser(userId, urlDatabase),
    user: users[userId]
  };

  res.render("login", templateVars);
});


app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(405).send("Your email and password cannot be blank.<br></br><a href='/login'>Click to login.</a>");
  }
  
  const user = getUserByEmail(users, email);
  if (!user) {
    return res.status(403).send("Your username does not exist.<br></br><a href='/login'>Click to login.</a>");
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Your password is incorrect.<br></br><a href='/login'>Click to login.</a>");
  }

  req.session["user_id"] = user.id;

  res.redirect("/urls");
});



//-------------Registration Page-------------//
app.get("/register", (req, res) => {
  const userId = req.session["user_id"];
  const templateVars = {
    urls: urlsForUser(userId, urlDatabase),
    user: users[userId]
  };

  res.render("register", templateVars);
});


app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString();

  if (!email || !password) {
    return res.status(400).send("Your email and password cannot be blank.<br></br><a href='/register'>Back to registration.<a/>");
  }

  const user = getUserByEmail(users, email);

  if (user) {
    return res.status(400).send("A user with that email already exists.<br></br><a href='/register'>Back to registration.<a/>");
  }

  users[id] = {
    id: id,
    email: email,
    password: hashedPassword
  };

  req.session["user_id"] = id;

  res.redirect("/urls");
});




//-------------Creates, Edit, and Delete URLs-------------//
// page to create new URLs
// users who are not logged in cannot will be prompt to login
app.get("/urls/new", (req, res) => {
  const userId = req.session["user_id"];

  if (!users[userId]) {
    res.status(403).send("You are not logged in.<br></br><a href='/login'>Click to login.</a>");
  } else {
    const templateVars = {
      urls: urlsForUser(userId, urlDatabase),
      user: users[userId]
    };
    res.render("urls_new", templateVars);
  }
});


// page to get short URLs and edit long URLs
// users who did not create the shortURL cannot access it
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session["user_id"];
  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[userId]
  };

  if (userId !== urlDatabase[shortURL].userID) {
    return res.status(401).send("You do not have the permission to access this page.");
  }

  if (!userId) {
    return res.status(401).send("You do not have the permission to access this page.");
  }

  res.render("urls_show", templateVars);
});


// generates new short and long URL on urls homepage
// users must be logged in to access this page
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const userID = req.session["user_id"];
  urlDatabase[shortURL] = { longURL, userID };

  if (!users[userID]) {
    res.status(400).send("You are not logged in.");
  }

  res.redirect("/urls");
});


// edits your existing long URL
app.post("/urls/edit/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});


// deletes your existing URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session["user_id"];
  const shortURL = req.params.shortURL;

  if (!users[userId]) {
    res.status(401).send("You don't have the permission to delete this.");
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});



//-------------Redirects shortURL to LongURL-------------//
// can only redirect existing short URLs
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    res.status(404).send("This URL does not exist.");
  } else {
    const longURL = urlDatabase[shortURL].longURL;
    res.status(302).redirect(longURL);
  }
  
});



//-------------Logout-------------//
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});