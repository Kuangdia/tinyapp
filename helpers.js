//-------------Constants-------------//
const bcrypt = require('bcryptjs');


// generates a random user_id for new users
function generateRandomString() {
  let randomStr = "";
  let stringLength = 6;
  let possibleChar = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i < stringLength; i++) {
    randomStr += possibleChar[Math.floor(Math.random() * possibleChar.length)];
  }
  return randomStr;
}


// returns a user object from the users object database
const getUserByEmail = (users, email) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }

};

module.exports = {
  generateRandomString,
  getUserByEmail
}