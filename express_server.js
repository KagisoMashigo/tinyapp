const { generateRandomString, accountMatcher, duplicateEmailMatcher, getUserByEmail, urlsForUserID } = require("./helpers");
const express = require("express");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// Database containing url data
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
    password: "hello"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "hey"
  }
}

// Homepage GET route
app.get("/", (req, res) => {
  const userID = req.cookies["user_id"];
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
  const shortURL = generateRandomString(); // shortURL is the output after form submission; being the random string
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session["user_id"]}; // .body can be used by POST reqs but not GET reqs // longURL is the key in the database where output is stored
  res.redirect(`/urls/${shortURL}`); // here the output is rediredted to urls/randomString where it is not found error 303 so browser looks in "response header"
});

// new urls page
app.get("/urls/new", (req, res) => { // here the browser requests a form
  const userID = req.session["user_id"];
  const templateVars = { user: users[userID] };
  if (userID) {
    res.render("urls_new", templateVars); // server then consults the urls_new template to get the html info and sends it back to the browser where it is then rendered
  } else {
    res.redirect("/login");
  }
});

// GET route for registering
app.get("/register", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[userID] }; // need specific more TVs here
  res.render("user_registration", templateVars);
});

// Registration functionality
app.post("/register", (req, res) => {
  const newUserId = generateRandomString();
  const password1 = req.body.password;
  const hashedPassword = bcrypt.hashSync(password1, 10);
  users[newUserId] = { id: newUserId, email: req.body.email, password: hashedPassword };
  if (!users[newUserId]["email"] || !users[newUserId]["password"]) {
    res.status(404);
    res.send("404 - SOMTHING'S MISSING, TRY AGAIN BUDDY.");
  } else if (!duplicateEmailMatcher(users, users[newUserId])) {
    res.status(400);
    res.send("Sorry, that email is already taken! Let's give this another go eh?");
  } else {
    req.session["user_id"] = newUserId;
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
  const longURL = urlDatabase[req.params.shortURL].longURL; // this is a good example of how to get into the object
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("404 - not found!");
  }
});

// Checks if user authorised to delete
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["user_id"];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[userID] }; // here the browser looks up the longURL from the database where it was previously stored, passes the short and long url to the template
  if (urlsForUserID(urlDatabase, userID)) {
    res.render("urls_show", templateVars);
  } else {
    res.status(403);
    res.send("Cant delete that.");
  }
});

// Delete button functionality
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.session["user_id"];
  if (urlsForUserID(urlDatabase, userID)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.status(403);
    res.send("Cant delete that.");
  }
});

// Allows for url editing
app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL; // everytime you submit a form the data will be available in req.body. If you need to grab data from the url it is in req.params.
  res.redirect("/urls");
});

// Parses the url data
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Listening to the server
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
