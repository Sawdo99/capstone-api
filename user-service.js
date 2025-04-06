const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require("dotenv").config();

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String, 
  locker: String
});

let User;

module.exports.setModel = function (connection) {
  User = connection.model("User", userSchema);
  console.log("User model set:");
  console.log(JSON.stringify(User.schema));
  console.log("User model connection state:");
  console.log(connection.readyState);
};

module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      return reject("Passwords do not match");
    } else {
      bcrypt.hash(userData.password, 10)
        .then(hash => {
          userData.password = hash;
          let newUser = new User(userData);
          newUser.save(err => {
            if (err) {
              if (err.code === 11000) {
                reject("Username already taken");
              } else {
                reject("Error creating the user: " + err);
              }
            } else {
              resolve("User " + userData.username + " successfully registered");
            }
          });
        })
        .catch(err => reject(err));
    }
  });
};

module.exports.validateUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ username: userData.username }).exec()
      .then(user => {
        if (!user) return reject("Unable to find user " + userData.username);
        bcrypt.compare(userData.password, user.password)
          .then(result => {
            if (result === true) resolve(user);
            else reject("Incorrect password for user " + userData.username);
          });
      })
      .catch(err => {
        reject("Unable to find user " + userData.username);
      });
  });
};

module.exports.getUserLocker = function (id) {
  return new Promise((resolve, reject) => {
    User.findById(id).exec()
      .then(user => resolve(user.locker))
      .catch(err => reject(`Unable to get Locker ID for user with id: ${id}`));
  });
};

module.exports.addUserToLocker = function (userId, item) {
  return new Promise((resolve, reject) => {
    User.findByIdAndUpdate(
      userId,
      { $push: { locker: item } },
      { new: true }
    ).exec()
      .then(updatedUser => {
        if (!updatedUser) return reject(`User not found with id: ${userId}`);
        resolve(updatedUser.locker);
      })
      .catch(err => reject(`Unable to add to locker for user with id: ${userId}. Error: ${err}`));
  });
};

module.exports.removeUserFromLocker = function (userId, item) {
  return new Promise((resolve, reject) => {
    User.findByIdAndUpdate(
      userId,
      { $pull: { locker: item } },
      { new: true }
    ).exec()
      .then(updatedUser => {
        if (!updatedUser) return reject(`User not found with id: ${userId}`);
        resolve(updatedUser.locker);
      })
      .catch(err => reject(`Unable to remove from locker for user with id: ${userId}. Error: ${err}`));
  });
};
