const generateRandomString = function() {
  let randNum = Math.floor((Math.random() * 1000 + 10000));
  let randString = 'a' + randNum;
  return randString;
};

const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user]['email'] === email) {
      return user;
    }
  }
};

const isLoggedIn = (req, res, next) => {
  // Checks if a user is logged in by detecting the existence of a cookie
  if (req.session.user_id) {
    next();
  } else {
    console.log('You are not logged in. Please log in to view and create URLs.');
    res.redirect('/login');
  }
};

const urlsForUser = (loggedInID, database) => {
  // For show page. Returns a filtered database.
  // The user can only see URLs that they are the owner of.
  const filteredDatabase = {};
  for (const id in database) {
    if (database[id]['userID'] === loggedInID) {
      filteredDatabase[id] = database[id];
    }
  }
  return filteredDatabase;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  isLoggedIn,
  urlsForUser
};