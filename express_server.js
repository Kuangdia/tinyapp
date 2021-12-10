//-------------Constants-------------//
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const { restart } = require("nodemon");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { generateRandomString, getUserByEmail } = require("./helpers");


//-------------MiddleWare-------------//
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['S3cR3t'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))


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

function urlsForUser(userID) {
  const urls = {};

  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === userID) {
      urls[key] = urlDatabase[key];
    }
  }
  return urls;
}


app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const userId = req.session["user_id"];

  const templateVars = { 
    urls: urlsForUser(userId),
    user: users[userId]
  };

  res.render("login", templateVars)
});

app.get("/register", (req, res) => {
  const userId = req.session["user_id"];

  const templateVars = { 
    urls: urlsForUser(userId),
    user: users[userId]
  };

  res.render("register", templateVars)
});



// loops through urlDatabase to output key + values on page
app.get("/urls", (req, res) => {
  const userId = req.session["user_id"];

  if (!users[userId]) {
    return res.send("Please login to use TinyAPP<br></br><a href='/login'>Login</a>")
  }

  console.log(urlDatabase);
  console.log('urlsForUser(userId), :', urlsForUser(userId));

  const templateVars = { 
    urls: urlsForUser(userId),
    user: users[userId]
  };
  res.render("urls_index", templateVars);
});



// populates new shortURL link page
app.get("/urls/new", (req, res) => {
  const userId = req.session["user_id"];

  if (!users[userId]) {
    res.redirect("/login");
  } else {
    const templateVars = { 
      urls: urlsForUser(userId),
      user: users[userId] 
    };
    res.render("urls_new", templateVars);
  }
});

// takes in a parameter (:shortURL)
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session["user_id"];
  // uses same parameter on top for shortURL, longURL outputs value
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL, 
    user: users[userId] 
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  // console.log(req.body.longURL);  // Log the POST request body to the console
  const userID = req.session["user_id"];

  // key-value pair shortURL
  const longURL = req.body.longURL
  const newKey = generateRandomString();
  // key-value pair longURL
  urlDatabase[newKey] = { longURL, userID };
  // console.log(urlDatabase); // see new key-value pairs

  // redirects to /urls/:shortURL
  res.redirect(`/urls/${newKey}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;

  if (longURL === undefined) {
    return res.status(404).send("big error");
  }
  res.redirect(longURL);
});

app.get("/urls/edit/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = {
    urls: urlDatabase[shortURL].longURL
  };
  res.render("urls_show", templateVars);
});



app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const userID = req.session["user_id"];

  // console.log("short", shortURL)
  // console.log("long", longURL)
  // console.log("user", userId)

  if (!users[userID]) {
    res.status(400).send("You are not logged in.")
  }

  urlDatabase[shortURL] = { longURL, userID };
  // console.log('urlDatabase :', urlDatabase);

  res.redirect("/urls");
})



app.post("/urls/edit/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session["user_id"]

  if (!users[userId]) {
    res.status(400).send("You are not logged in.")
  }

  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(400).send("Your email and password cannot be blank.<br></br><a href='/login'>Click to login.</a>")
  }
  
  const user = getUserByEmail(users, email);
  if (!user) {
    return res.status(403).send("Your username does not exist.<br></br><a href='/login'>Click to login.</a>")
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Your password is incorrect.<br></br><a href='/login'>Click to login.</a>")
  }

  req.session["user_id"] = user.id;

  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString();

  if (!email || !password) {
    return res.status(400).send("Your email and password cannot be blank.<br></br><a href='/register'>Back to registration.<a/>")
  }

  const user = getUserByEmail(users, email);
  if (user) {
    return res.status(400).send("A user with that email already exists.<br></br><a href='/register'>Back to registration.<a/>")
  }

  users[id] = {
    id: id,
    email: email,
    password: hashedPassword
  }

  req.session["user_id"] = id;

  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls")
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});