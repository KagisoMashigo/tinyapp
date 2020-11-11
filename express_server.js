const { generateRandomString, accountMatcher, duplicateEmailMatcher, getUserByEmail, urlsForUserID } = require("./helpers");
const express = require("express");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));


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
  //const urlID = urlDatabase[req.params.shortURL].longURL;
  const templateVars = { urls: urlDatabase, user: users[userID] };
  if (urlsForUserID(urlDatabase, userID)) {
    console.log(userID)
    res.render("urls_index", templateVars);
  } else {
    res.status(403);
    res.send("Whoops, looks like you need to login or register to do this.")
  }
});

app.get("/urls/new", (req, res) => { // here the browser requests a form
  const userID = req.cookies["user_id"];
  const templateVars = { user: users[userID] };
  if (userID) {
    res.render("urls_new", templateVars); // server then consults the urls_new template to get the html info and sends it back to the browser where it is then rendered
  } else {
    res.redirect("/login")
  }
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(); // shortURL is the output after form submission; being the random string
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies["user_id"]}; // .body can be used by POST reqs but not GET reqs // longURL is the key in the database where output is stored
  res.redirect(`/urls/${shortURL}`); // here the output is rediredted to urls/randomString where it is not found error 303 so browser looks in "response header"
});

app.get("/register", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[userID] };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => { 
  const userID = generateRandomString();
  users[userID] = { id: userID, email: req.body.email, password: req.body.password };
  // console.log(users[userID])
  //console.log(users)
//console.log("User List: ", users)
console.log(users)

  if (!users[userID]["email"] || !users[userID]["password"]) {
    res.status(404)
    res.send("404 - SOMTHING'S MISSING, TRY AGAIN BUDDY.")
  } else if (duplicateEmailMatcher(users, req.body.email)) {
    console.log(req.body.email)
    console.log(users)
    res.status(400);
    res.send("Sorry, that email is already taken! Let's give this another go eh?")
  } else {
    res.cookie("user_id", userID);
    res.redirect("/urls");
  } 
  //console.log(users)
});

app.post("/login", (req, res) => { 
  if (!accountMatcher(users, req.body.email)) {
    // console.log(req.body.email)
    // console.log(users)
    res.status(403);
    res.send("No email matching that one in the system! Soz.")
    //console.log("Current Users", users)
    //console.log(req.body.email, req.body.password, users.user2RandomID.email, users.user2RandomID.password )
  } else {
    const user = getUserByEmail(users, req.body.email);
    if (user.password === req.body.password) {
      res.cookie("user_id", user.id)
      res.redirect("/urls")
    } else {
      res.status(403);
      res.send("Passwords don't match! Soz.")
    }
  } 
 
});

app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[userID] };
  res.render("login_page", templateVars);
});

app.post("/logout", (req, res) => { //need to clear the cookie and redirect to urls
  res.clearCookie("user_id", req.body["user_id"])
  res.redirect("/login")
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

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
