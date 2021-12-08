const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const { restart } = require("nodemon");

// makes data readable when we POST
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

// sets express to automatically search views folder for ejs files (we omit views/)
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  let randomStr = "";
  let length = 6;
  let possibleChar = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i < length; i++) {
    randomStr += possibleChar[Math.floor(Math.random() * possibleChar.length)];
  }
  return randomStr;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

// loops through urlDatabase to output key + values on page
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase,
  username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

// populates new shortURL link page
app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase,
    username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

// takes in a parameter (:shortURL)
app.get("/urls/:shortURL", (req, res) => {
  // uses same parameter on top for shortURL, longURL outputs value
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
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
  const username = req.body.username
  
  res.cookie("username", username)

  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});