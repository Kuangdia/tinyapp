const express = require("express");
const app = express();
const PORT = 3000; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const { restart } = require("nodemon");

// makes data readable when we POST
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

// sets express to automatically search views folder for ejs files (we omit views/)
app.set("view engine", "ejs");

const urlDatabase = {
  // "b2xVn2": "http://www.lighthouselabs.ca",
  // "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "123"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const findUserEmail = (email) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

// const findUserId = (user_id) => {
//   for (let user in users) {
//     if (user_id === user) {
//       return users[user];
//     }
//   }
//   return null;
// };

function generateRandomString() {
  let randomStr = "";
  let stringLength = 6;
  let possibleChar = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i < stringLength; i++) {
    randomStr += possibleChar[Math.floor(Math.random() * possibleChar.length)];
  }
  return randomStr;
}

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login")
});

app.get("/register", (req, res) => {


  const templateVars = {
    urls: urlDatabase,
  }

  res.render("register")
});

// loops through urlDatabase to output key + values on page
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];

  const templateVars = { 
    urls: urlDatabase,
    user: users[userId]
  };
  res.render("urls_index", templateVars);
});

// populates new shortURL link page
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];

  const user = findUserId(userId);
  if (!userId) {
    res.redirect("/login");
  } else {
    const templateVars = { 
      urls: urlDatabase,
      user: users[userId] 
    };
    res.render("urls_new", templateVars);
  }
});

// takes in a parameter (:shortURL)
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies["user_id"];
  // uses same parameter on top for shortURL, longURL outputs value
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL], 
    user: users[userId] 
  };
  res.render("urls_show", templateVars);
});

// uses same /urls page with get/post
app.post("/urls", (req, res) => {
  // console.log(req.body.longURL);  // Log the POST request body to the console

  // key-value pair shortURL
  const newKey = generateRandomString();
  // key-value pair longURL
  urlDatabase[newKey] = req.body.longURL;
  // console.log(urlDatabase); // see new key-value pairs

  // redirects to /urls/:shortURL
  res.redirect(`/urls/${newKey}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  if (longURL === undefined) {
    return res.status(404).send("bye");
  }
  res.redirect(longURL);
});

app.get("/urls/edit/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = {
    urls: urlDatabase[shortURL]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  // console.log(req.params);
  // console.log(req.body);
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = longURL;

  res.redirect("/urls");
})

app.post("/urls/edit/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  const user = findUserEmail(email);
  if (!user) {
    return res.status(403).send("Your username does not exist")
  }

  if (user.password !== password) {
    return res.status(403).send("Your password is incorrect")
  }

  res.cookie("user_id", user.id);

  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();

  if (!email || !password) {
    return res.status(400).send("Your email and password cannot be blank.")
  }

  const user = findUserEmail(email);
  if (user) {
    return res.status(400).send("A user with that email already exists.")
  }

  users[id] = {
    id: id,
    email: email,
    password: password
  }

  // console.log(users);

  res.cookie("user_id", id);

  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls")
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});