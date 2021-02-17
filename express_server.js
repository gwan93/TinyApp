const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const { generateRandomString, getUserByEmail, isLoggedIn, urlsForUser } = require('./helpers');
app.set("view engine", "ejs"); // set ejs as the view engine
const bcrypt = require('bcrypt');

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require("cookie-session");
const sessionConfig = {
  name: "session",
  secret: "aSuperSecretSecretForCookies!",
  cookie: {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};
app.use(cookieSession(sessionConfig));

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW", visits: [] },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW", visits: [] },
  df39da: { longURL: "https://www.amazon.ca", userID: "user3RandomID", visits: [] }
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
};

const isAuthor = (req, res, next) => {
  // Will check request's cookies for the user ID and compares it with user ID
  // for the entry in the database.

  if (!urlDatabase[req.params.shortURL]) {
    res.send("That page does not exist. Please try again.");
    return;
  } else if (req.session.user_id.id !== urlDatabase[req.params.shortURL]['userID']) {
    console.log("You do not have permission to view this page. Please login.");
    res.redirect("/login");
    return;
  }
  next();
};

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  const templateVars = { userID: req.session.user_id };
  res.render("urls_login", {templateVars, users});
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  const templateVars = { userID: req.session.user_id };
  res.render("urls_register", {templateVars, users});
});

app.get("/u/:shortURL", (req, res) => {
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    res.send("Invalid Short URL! Please check again.");
    return;
  }

  // create new visit object with visit details
  const v = {
    user: req.session.user_id.id || 'Unregistered Visitor',
    time: new Date(Date.now()).toUTCString()
  }

  urlDatabase[req.params.shortURL]['visits'].push(v);
  // console.log(urlDatabase[req.params.shortURL]);
  // const userCookieID = req.session.user_id.id;
  // if (!urlDatabase[req.params.shortURL]['uniqueVisitors'].includes(userCookieID)) {
  //   urlDatabase[req.params.shortURL]['uniqueVisitors'].push(userCookieID);
  // }
  const { longURL } = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/new", isLoggedIn, (req, res) => {
  const templateVars = { userID: req.session.user_id };
  res.render("urls_new", {templateVars, users});
});

app.get("/urls/:shortURL", isLoggedIn, isAuthor, (req, res) => {
  const shortURL = req.params.shortURL;
  const uniqueVisitors = [];
  console.log(urlDatabase[req.params.shortURL]);
  for (let visitor of urlDatabase[req.params.shortURL]['visits']) {
    if (!uniqueVisitors.includes(visitor['user'])) {
      uniqueVisitors.push(visitor['user']);
    }
  }
  console.log(uniqueVisitors);
  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[req.params.shortURL]['longURL'],
    visitorCount: urlDatabase[req.params.shortURL]['visits'].length,
    uniqueVisitors: uniqueVisitors,
    viewlog: urlDatabase[req.params.shortURL]['visits'],
    userID: req.session.user_id
  };
  console.log('visits log is\n', templateVars['viewlog'])
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
  let shortURL = generateRandomString();
  const newURL = {
    longURL: req.body.longURL,
    userID: req.session.user_id.id,  // set url id to logged in user's id
    visits: []
  };
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/${shortURL}`);
});

// delete a url
app.delete("/urls/:shortURL", isLoggedIn, isAuthor, (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// update a url
app.put("/urls/:shortURL", isLoggedIn, isAuthor, (req, res) => {
  urlDatabase[req.params.shortURL]['longURL'] = req.body['newURL'];
  res.redirect(`/urls/`);
});

// user login
app.post("/login", (req, res) => {
  // verify user's email and password
  const { email, password } = req.body;
  for (let id in users) {
    if (users[id]['email'] === email && bcrypt.compareSync(password, users[id]['hashedPassword'])) {
      const foundUser = users[id];
      req.session.user_id = foundUser;
      console.log("You are now logged in.");
      res.redirect('/urls');
      return;
    }
  }
  res.status(403);
  res.send('Invalid email or password. Please try again.');
});

// user logout
app.post("/logout", (req, res) => {
  req.session = null; // deletes the user's cookie upon logout
  console.log("You are now logged out. Redirecting to Index page.");
  res.redirect('/urls');
});

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
  };
  users[generateNewID] = newUser;
  req.session.user_id = newUser; // sets a new cookie
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});