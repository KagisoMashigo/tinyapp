const { assert } = require('chai');
const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail(testUsers, "user@example.com")
    const expectedOutput = testUsers["userRandomID"];
    assert.strictEqual(user, expectedOutput, 'these users strictly match');
  });

  it('should return undefined if no match', function() {
    const user = getUserByEmail(testUsers, "noUser@example.com")
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput, 'these users strictly match');
  });
});