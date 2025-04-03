const mongoose = require('mongoose');
// mongoose.set('useFindAndModify', false); // To avoid deprecation warning

const bcrypt = require('bcryptjs');

require("dotenv").config();

let mongoDBConnectionString = process.env.MONGO_URL;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    password: String, 
    locker: String
});

let User; // to be defined on new connection

module.exports.setModel = function (connection) {
    User = connection.model("User", userSchema);

    console.log("User model set: ");
    console.log(JSON.stringify(User.schema));
    console.log("User model connection: ");
    console.log(JSON.stringify(connection));
    console.log("User model connection state: ");
    console.log(connection.readyState);
}

module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject){

        if (userData.password != userData.password2) {
            reject("Password does not match");
        } else {
            bcrypt.hash(userData.password, 10).then(hash => {

                userData.password = hash;

                let newUser = new User(userData);

                newUser.save(err => {
                    if (err) {
                        if (err.code == 1100) {
                            reject("User name already taken");
                        } else {
                            reject("There was an error creating the user:" + err);
                        }
                    } else {
                        resolve("User" + userData.userName + "successfully registered");
                    }
                });
            })
            .catch(err => reject(err));
        }
    });
};

module.exports.validateUser = function (userData) {
    return new Promise(function (resolve, reject){
        User.findOne({userName: userData.userName})
        .exec()
        .then(user => {
            bcrypt.compare(userData.password, user.password).then(res => {
                if (res === true) {
                    resolve(user);
                } else {
                    reject("Incorrect password for user" + userData.userName);
                }
            });
        }).catch(err => {
            reject("Unable to find user" + userData.userName);
        });
    });
};

module.exports.getUserLocker = function (id) {
    return new Promise(function (resolve, reject) {

        User.findById(id)
            .exec()
            .then(user => {
                resolve(user.lockerID)
            }).catch(err => {
                reject(`Unable to get Locker ID for user with id: ${id}`);
            });
    });
}


module.exports.addUserToLocker = function (userId, item) {
    return new Promise((resolve, reject) => {
      User.findByIdAndUpdate(
        userId,
        { $push: { locker: item } },
        { new: true }
      )
        .exec()
        .then((updatedUser) => {
          if (!updatedUser) {
            return reject(`User not found with id: ${userId}`);
          }
          resolve(updatedUser.locker);
        })
        .catch((err) => {
          reject(`Unable to add to locker for user with id: ${userId}. Error: ${err}`);
        });
    });
  };

module.exports.removeUserFromLocker = function (userId, item) {
    return new Promise((resolve, reject) => {
      User.findByIdAndUpdate(
        userId,
        { $pull: { locker: item } },
        { new: true }
      )
        .exec()
        .then((updatedUser) => {
          if (!updatedUser) {
            return reject(`User not found with id: ${userId}`);
          }
          resolve(updatedUser.locker);
        })
        .catch((err) => {
          reject(`Unable to remove from locker for user with id: ${userId}. Error: ${err}`);
        });
    });
  };