// Used to generate the user ID
const generateRandomString = function() {
  let formOutput = Math.random().toString(36).substring(2,8);
  return formOutput;
}

// Used to match the accounts when logging in
const accountMatcher = function(userDB, newUserEmail) {
  for (let user in userDB) {
    if (userDB[user].email === newUserEmail) {
      return true;
    } 
  }
  return false
}

// Used to match users ID so that app knows when they are logged in
const urlsForUserID = function(urlDB, currentUser) {
  const urlResult = {}; 
  for (let url in urlDB) {
    if (currentUser && urlDB[url]["userID"] === currentUser) {
      urlResult[url] = {
        longURL: urlDB[url]["longURL"],
        userID: urlDB[url]["userID"]
      }
    }
  }
  return urlResult;
}

// Used to idetify users by email addy
const getUserByEmail = function(userDB, email) { // good practice to use dot notation rather than bracket
for (let user in userDB) {
    if (userDB[user].email === email) {
      return userDB[user];
    }
  }
}

// Used to check for duplicate emails
const duplicateEmailMatcher = function(userDB, inputEmail) {
  for (let user in userDB) {
    if (userDB[user].email === inputEmail) {
      return true;
    }
  }
  return false
}

module.exports = { generateRandomString, duplicateEmailMatcher, accountMatcher, getUserByEmail, urlsForUserID }

