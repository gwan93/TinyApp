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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.get("/login", (req, res) => {
  const templateVars = { userID: req.cookies.user_id };
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

app.get("/urls/new", (req, res) => {
  const templateVars = { userID: req.cookies.user_id };
  res.render("urls_new", {templateVars, users});
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    userID: req.cookies.user_id
  };
  res.render("urls_show", {templateVars, users});
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    userID: req.cookies.user_id
  };
  // console.log('get /urls, templatevarsuseridemail is', templateVars['userID']['email']);
  // console.log('get /urls, tempaltevars is', templateVars)
  res.render("urls_index", {templateVars, users});
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// create a new url
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  console.log('the urlDatabase has been updated to now be: \n', urlDatabase);
  res.redirect(`/urls`);         // Respond with 'Ok' (we will replace this)
});

// delete a url
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// update a url
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body['newURL'];
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
    } 
  }
  res.status(403);
  res.send('Invalid email or password. Please try again.');
})

// user logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
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