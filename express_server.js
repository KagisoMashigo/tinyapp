const { generateRandomString, accountMatcher, duplicateEmailMatcher, getUserByEmail, urlsForUserID } = require("./helpers");
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "hello"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "hey"
  }
}

app.get("/", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { urls: urlDatabase, user: users[userID] };
  res.render("homepage", templateVars);
});

//  When sending variables to ejs template, it must be in an opbject
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { urls: urlDatabase, user: users[userID] }; 
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { user: users[userID] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.send("Ok");  // tb replaced
});

app.post("/login", (req, res) => {
  res.cookie('user_id', req.body["user_id"])
  console.log(req.body["user_id"])
  res.redirect("/urls")
});

app.post("/logout", (req, res) => { //need to clear the cookie and redirect to urls
  res.clearCookie("user_id", req.body["user_id"])
  res.redirect("/urls")
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log(longURL) // this is a good example of how to get into the object
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("404 - not found!");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
  const shortURL = req.params.shortURL;
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL], urls: urlDatabase, user: users[userID] };
  // console.log(req.params.shortURL)
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls")
});

app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL; 
  res.redirect("/urls")
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[userID] };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => { 
  const userID = generateRandomString();
  users[userID] = { id: userID, email: req.body.email, password: req.body.password };
  console.log(users[userID])
  console.log(users)
  if (users[userID]["email"] && users[userID]["password"]) {
    if (duplicateEmailFinder(users, users[userID])) {
    res.cookie("user_id", userID);
    res.redirect("/urls");
  } else {
    res.status(400);
    res.send("Sorry, that email is taken already!")
  }
  } else {
    res.status(404)
    res.send("404 - SOMTHING'S MISSING, TRY AGAIN BUDDY.")
  } 
});

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

app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[userID] };
  res.render("login_page", templateVars);
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
