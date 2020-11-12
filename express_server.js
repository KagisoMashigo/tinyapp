const { generateRandomString, accountMatcher, duplicateEmailMatcher, getUserByEmail, urlsForUserID } = require("./helpers");
const express = require("express");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const app = express();
const methodOverride = require('method-override')
const PORT = 8080;
const cookieSession = require('cookie-session');
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// Database containing url data
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

// Bcyrpt passwords
const password = "found";
const hashedPassword = bcrypt.hashSync(password, 10);
const password2 = "hello";
const hashedPassword2 = bcrypt.hashSync(password2, 10);

// Database containing user data
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: hashedPassword
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: hashedPassword2
  }
};

// Homepage GET route
app.get("/", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = { urls: urlDatabase, user: users[userID] };
  res.render("homepage", templateVars);
});

// urls page GET
app.get("/urls", (req, res) => {
  const userID = req.session["user_id"];
  if (userID) {
    const userUrls = urlsForUserID(urlDatabase, userID);
    const templateVars = { urls: userUrls, user: users[userID] };
    res.render("urls_index", templateVars);
  } else {
    res.status(403);
    res.send("Whoops, looks like you need to login or register to do this.");
  }
});

// urls page POST
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session["user_id"]};
  res.redirect(`/urls/${shortURL}`);
});

// New urls page
app.get("/urls/new", (req, res) => { 
  const userID = req.session["user_id"];
  const templateVars = { user: users[userID] };
  if (userID) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// GET route for registering
app.get("/register", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[userID] };
  res.render("register", templateVars);
});

// Registration functionality
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  if (!req.body.email || !req.body.password) {
    res.status(404);
    res.send("404 - SOMTHING'S MISSING, TRY AGAIN BUDDY.");
  } else if (duplicateEmailMatcher(users, req.body.email)) {
    res.status(400);
    res.send("Sorry, that email is already taken! Let's give this another go eh?");
  } else {
    users[userID] = { id: userID, email: req.body.email, password: hashedPassword };
    req.session["user_id"] = userID;
    res.redirect("/urls");
  }
});

// Login functionality
app.post("/login", (req, res) => {
  if (!accountMatcher(users, req.body.email)) {
    res.status(403);
    res.send("No email matching that one in the system! Soz.");
  } else {
    const user = getUserByEmail(users, req.body.email);
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session["user_id"] = user.id;
      res.redirect("/urls");
    } else {
      res.status(403);
      res.send("Passwords don't match! Soz.");
    }
  }
});

// GET route for login
app.get("/login", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[userID] };
  res.render("login_page", templateVars);
});

// Logout functionality
app.post("/logout", (req, res) => {
  req.session["user_id"] = null;
  res.redirect("/login");
});

// Newly created url edit link
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL; 
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("404 - not found!");
  }
});

// Checks if user authorised to access url
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[userID] };
  if (urlsForUserID(urlDatabase, userID)) {
    res.render("urls_show", templateVars);
  } else {
    res.status(403);
    res.send("Cant access that.");
  }
});

// Delete button functionality
app.delete('/urls/:shortURL', (req, res) => {
  const userID = req.session["user_id"];
  if (urlsForUserID(urlDatabase, userID)[req.params.shortURL].userID === userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.status(403);
    res.send("Cant delete that.");
  }
});

// Allows for url editing
app.put("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

// Parses the url data for api in json format
app.get("/api/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Listening to the server
app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});
