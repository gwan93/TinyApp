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
};
app.use(cookieSession(sessionConfig));
const flash = require('connect-flash');
app.use(flash());

// middleware for flash popups 
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})

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
    req.flash('error', 'That page does not exist. Please try again.');
    res.redirect('/urls');
    return;
  } else if (req.session.user_id.id !== urlDatabase[req.params.shortURL]['userID']) {
    req.flash('error', 'You do not have permission to view that page.');
    res.redirect("/urls");
    return;
  }
  next();
};

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    req.flash('success', 'You are already logged in.');
    res.redirect('/urls');
  }
  const templateVars = { userID: req.session.user_id };
  res.render("urls_login", {templateVars, users });
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    req.flash('success', 'You are already logged in.');
    res.redirect('/urls');
  }
  const templateVars = { userID: req.session.user_id };
  res.render("urls_register", {templateVars, users});
});

app.get("/u/:shortURL", (req, res) => {
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    res.redirect('/urls');
    return;
  }

  // create new visit object with visit details
  if (req.session.hasOwnProperty("user_id")) {
    const v = {
      user: req.session.user_id.id || 'Unregistered Visitor',
      time: new Date(Date.now()).toUTCString()
      }
    urlDatabase[req.params.shortURL]['visits'].push(v);
    
  } else {
    const v = {
      user: 'Unregistered Visitor',
      time: new Date(Date.now()).toUTCString()
    }
    urlDatabase[req.params.shortURL]['visits'].push(v);
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
  const uniqueVisitors = [];
  for (let visitor of urlDatabase[req.params.shortURL]['visits']) {
    if (!uniqueVisitors.includes(visitor['user'])) {
      uniqueVisitors.push(visitor['user']);
    }
  }
  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[req.params.shortURL]['longURL'],
    visitorCount: urlDatabase[req.params.shortURL]['visits'].length,
    uniqueVisitors: uniqueVisitors,
    viewlog: urlDatabase[req.params.shortURL]['visits'],
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
  res.render("urls_index", {templateVars, users });
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
  req.flash('success', 'Successfully created.');
  res.redirect(`/urls/${shortURL}`);
});

// delete a url
app.delete("/urls/:shortURL", isLoggedIn, isAuthor, (req, res) => {
  delete urlDatabase[req.params.shortURL];
  req.flash('success', 'Successfully deleted URL.');
  res.redirect("/urls");
});

// update a url
app.put("/urls/:shortURL", isLoggedIn, isAuthor, (req, res) => {
  urlDatabase[req.params.shortURL]['longURL'] = req.body['newURL'];
  req.flash('success', 'Successfully updated URL.');
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
      req.flash('success', 'Successfully logged in. Welcome!');
      res.redirect('/urls');
      return;
    }
  }
  res.status(403);
  req.flash('error', 'Invalid email or password. Please try again.');
  res.redirect('/login');
});

// user logout
app.post("/logout", (req, res) => {
  req.session = null; // deletes the user's cookie upon logout
  res.redirect('/urls');
});

// post user registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (getUserByEmail(email, users)) {
    res.status(400);
    req.flash('error', 'A user with that email already exists.');
    res.redirect('/register');
    return;
  } else if (email === "" || password === "") {
    res.status(400);
    req.flash('error', 'Empty email/password is not allowed.');
    res.redirect('/register');
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
  req.flash('success', 'Welcome! You may now create new URLs.');
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});