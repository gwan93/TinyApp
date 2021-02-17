const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs"); // set ejs as the view engine

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

function generateRandomString() {
  let randNum = Math.floor((Math.random() * 1000 + 10000));
  let randString = 'a' + randNum;
  return randString;
}

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  df39da: { longURL: "https://www.amazon.ca", userID: "user3RandomID" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
  "user3RandomID": {
    id: "user3RandomID", 
    email: "asdf@asdf", 
    password: "asdf"
  }
}
const isLoggedIn = (req, res, next) => {
  if (req.cookies.user_id) {
    // console.log('Yup, you are logged in!');
    next();
  } else {
    console.log('You are not logged in. Please log in to view and create URLs.'); 
    res.redirect('/login');
  }
};

const urlsForUser = (loggedInID) => {
  const filteredDatabase = {};
  for (const id in urlDatabase) {
    if (urlDatabase[id]['userID'] === loggedInID) {
      filteredDatabase[id] = urlDatabase[id];
    }
  }
  return filteredDatabase;
};

// const isAuthor = (shortURL, loggedInID) => {
//   if (urlDatabase[shortURL]['userID'] !== loggedInID) {
//     console.log("You do not have permission to view this page. Please login.");
//     res.redirect("/login");
//     return false;
//   }
//   return true;
// };

const isAuthor = (req, res, next) => {
  console.log('req params shorturl', urlDatabase[req.params.shortURL]['userID']);
  console.log('cookies', req.cookies.user_id.id);
  if (req.cookies.user_id.id !== urlDatabase[req.params.shortURL]['userID']) {
    console.log("You do not have permission to view this page. Please login.");
    res.redirect("/login");
    return;
  }
  next();
};

app.get("/login", (req, res) => {
  const templateVars = { userID: req.cookies.user_id };
  console.log("You are now logged in.");
  res.render("urls_login", {templateVars, users});
})

app.get("/register", (req, res) => {
  const templateVars = { userID: req.cookies.user_id };
  res.render("urls_register", {templateVars, users});
});

app.get("/u/:shortURL", (req, res) => {
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    res.send("Invalid Short URL! Please check again.");
  }
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/new", isLoggedIn, (req, res) => {
  const templateVars = { userID: req.cookies.user_id };
  res.render("urls_new", {templateVars, users});
});

app.get("/urls/:shortURL", isLoggedIn, isAuthor, (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { 
    shortURL: shortURL,
    longURL: urlDatabase[req.params.shortURL]['longURL'],
    userID: req.cookies.user_id
  };

  res.render("urls_show", {templateVars, users});
});

app.get("/urls", isLoggedIn, (req, res) => {
  const loggedInID = req.cookies.user_id.id;
  const filteredDatabase = urlsForUser(loggedInID);
  // console.log('filtered database is\n', filteredDatabase); 
  const templateVars = { 
    urls: filteredDatabase,
    userID: req.cookies.user_id
  };
  res.render("urls_index", {templateVars, users});
});


// create a new url
app.post("/urls", isLoggedIn, (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  const newURL = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id.id
  };
  urlDatabase[shortURL] = newURL;
  console.log('the urlDatabase has been updated to now be: \n', urlDatabase);
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
    if (users[id]['email'] === email && users[id]['password'] === password) {
      const foundUser = users[id];
      res.cookie("user_id", foundUser);
      res.redirect('/urls')
      return; 
    } 
  }
  res.status(403);
  res.send('Invalid email or password. Please try again.');
})

// user logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  console.log("You are now logged out. Redirecting to Index page.");
  res.redirect('/urls');
})

// post user registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  for (let id in users) {
    if (users[id]['email'] === email) {
      res.status(400);
      res.send('A user with that email already exists');
    } else if (email === "" || password === "") {
      res.status(400);
      res.send('Empty email/password is not allowed.');
    }
  }

  // store data from req into users object. id, email, password. use generate function for id
  const generateNewID = generateRandomString();
  const newUser = {
    id: generateNewID,
    email: email,
    password, password
  }
  users[generateNewID] = newUser;
  // console.log(users);
  // set a user cookie with the user's newly generated ID
  res.cookie("user_id", newUser);
  console.log('users has been updated\n', users);
  // console.log('cookie set');
  res.redirect("/urls");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});