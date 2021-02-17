const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const { generateRandomString, getUserByEmail, isLoggedIn, urlsForUser } = require('./helpers');
app.set("view engine", "ejs"); // set ejs as the view engine
const bcrypt = require('bcrypt');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// used cookieParser in the beginning, use cookieSession instead
// const cookieParser = require('cookie-parser');
// app.use(cookieParser());

const cookieSession = require('cookie-session');
const sessionConfig = {
  name: 'session',
  secret: 'aSuperSecretSecretForCookies!',
  cookie: {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}
app.use(cookieSession(sessionConfig));

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  df39da: { longURL: "https://www.amazon.ca", userID: "user3RandomID" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    hashedPassword: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    hashedPassword: bcrypt.hashSync("dishwasher-funk", 10)
  },
  "user3RandomID": {
    id: "user3RandomID", 
    email: "asdf@asdf", 
    hashedPassword: bcrypt.hashSync("asdf", 10)
  }
}

const isAuthor = (req, res, next) => {
  // Will check request's cookies for the user ID and compares it with user ID
  // for the entry in the database.
  if (req.session.user_id.id !== urlDatabase[req.params.shortURL]['userID']) {
    console.log("You do not have permission to view this page. Please login.");
    res.redirect("/login");
    return;
  }
  next();
};

app.get("/login", (req, res) => {
  const templateVars = { userID: req.session.user_id };
  res.render("urls_login", {templateVars, users});
})

app.get("/register", (req, res) => {
  const templateVars = { userID: req.session.user_id };
  res.render("urls_register", {templateVars, users});
});

app.get("/u/:shortURL", (req, res) => {
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    res.send("Invalid Short URL! Please check again.");
    return;
  }
  const { longURL } = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/new", isLoggedIn, (req, res) => {
  const templateVars = { userID: req.session.user_id };
  res.render("urls_new", {templateVars, users});
});

app.get("/urls/:shortURL", isLoggedIn, isAuthor, (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { 
    shortURL: shortURL,
    longURL: urlDatabase[req.params.shortURL]['longURL'],
    userID: req.session.user_id
  };
  res.render("urls_show", {templateVars, users});
});

app.get("/urls", isLoggedIn, (req, res) => {
  const loggedInID = req.session.user_id.id;
  const filteredDatabase = urlsForUser(loggedInID, urlDatabase);
  const templateVars = { 
    urls: filteredDatabase,
    userID: req.session.user_id
  };
  res.render("urls_index", {templateVars, users});
});


// create a new url
app.post("/urls", isLoggedIn, (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  const newURL = {
    longURL: req.body.longURL,
    userID: req.session.user_id.id
  };
  urlDatabase[shortURL] = newURL;
  // console.log('the urlDatabase has been updated to now be: \n', urlDatabase);
  res.redirect(`/urls`);         // Respond with 'Ok' (we will replace this)
});

// delete a url
app.post("/urls/:shortURL/delete", isLoggedIn, isAuthor, (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// update a url
app.post("/urls/:shortURL", isLoggedIn, isAuthor, (req, res) => {
  urlDatabase[req.params.shortURL]['longURL'] = req.body['newURL'];
  res.redirect(`/urls/${req.params.shortURL}`);
})

// user login
app.post("/login", (req, res) => {
  // verify user's email and password
  const { email, password } = req.body;
  for (let id in users) {
    if (users[id]['email'] === email && bcrypt.compareSync(password, users[id]['hashedPassword'])) {
      const foundUser = users[id];
      req.session.user_id = foundUser; // cookieSession syntax
      // res.cookie("user_id", foundUser); // cookieParser syntax
      console.log("You are now logged in.");
      res.redirect('/urls')
      return; 
    } 
  }
  res.status(403);
  res.send('Invalid email or password. Please try again.');
})

// user logout
app.post("/logout", (req, res) => {
  req.session = null; // cookieSession syntax
  // res.clearCookie("user_id") // cookieParse syntax
  console.log("You are now logged out. Redirecting to Index page.");
  res.redirect('/urls');
})

// post user registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (getUserByEmail(email, users)) {
    res.status(400);
    res.send('A user with that email already exists');
    return;
  } else if (email === "" || password === "") {
    res.status(400);
    res.send('Empty email/password is not allowed.');
    return;
  }
  // store data from req into users object. id, email, password. use generate function for id
  const generateNewID = generateRandomString();
  const newUser = {
    id: generateNewID,
    email: email,
    hashedPassword: bcrypt.hashSync(password,10)
  }
  users[generateNewID] = newUser;
  // console.log(users);
  // set a user cookie with the user's newly generated ID
  req.session.user_id = newUser; // cookieSession syntax
  // res.cookie("user_id", newUser); // cookieParser syntax
  // console.log('users has been updated\n', users);
  res.redirect("/urls");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});