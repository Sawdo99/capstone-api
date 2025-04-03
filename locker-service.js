const mongoose = require('mongoose');
// mongoose.set('useFindAndModify', false);

require("dotenv").config();

const mongoDBConnectionString = process.env.MONGO_URL;

const lockerSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    visibilty: {
        type: String,
        required: true
    },
    games: {
        type: Array,
        required: true
    },
    movies: {
        type: Array,
        required: true
    },
    books: {
        type: Array,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    updatedAt: {
        type: Date,
        required: true
    },
    createdBy: {
        type: String,
        required: true
    },
    usersWithAccess: { // Array of user IDs who can write to this locker
        type: Array,
        required: true
    },
    ownerId: {
        type: String,
        required: true
    }
});

let Locker;

module.exports.setModel = function (connection) {
    Locker = connection.model('Locker', lockerSchema);

    console.log("Locker model set: ");
    console.log(JSON.stringify(Locker.schema));
}

// functions: createLocker(userId), getLockerById(lockerId), addGame(lockerId, gameId), addMovie(lockerId, movieId), addBook(lockerId, bookId), removeGame(lockerId, gameId), removeMovie(lockerId, movieId), removeBook(lockerId, bookId), deleteLocker(lockerId), getLockerByOwnerId(ownerId)

const generateUniqueLockerId = () => {
    // In a loop,
    // Generate a unique locker ID
    // Check if the locker ID already exists in the Locker collection of the database
    // If it does not exist, return the locker ID

    // For now, return a random string
    return "lockerId";
}

const authorizeUser = (userId, locker) => {
    return locker.ownerId === userId || locker.usersWithAccess.includes(userId);
}

module.exports.createLocker = function (userId) {
    return new Promise((resolve, reject) => {
        // Generate a unique locker ID
        const lockerId = generateUniqueLockerId();
        const date = new Date();

        let locker = new Locker({
            id: lockerId,
            name: "My Locker",
            games: [],
            movies: [],
            books: [],
            createAt: date,
            updatedAt: date,
            createdBy: userId,
            ownerId: userId
        });

        locker.save((err, locker) => {
            if (err) {
                reject(err);
            } else {
                resolve(locker);
            }
        });
    });
}

module.exports.getLockerById = function (lockerId) {
    return new Promise((resolve, reject) => {
        Locker.findOne({ id: lockerId })
            .exec((err, locker) => {
                if (err) {
                    return reject(err);
                }
                if (!locker) {
                    return reject(new Error('Locker not found'));
                }
                resolve(locker);
            });
    });
};

module.exports.addGame = function (lockerId, userId, gameId) {
    return new Promise((resolve, reject) => {
        Locker.findOne({ id: lockerId })
            .exec((err, locker) => {
                if (err) {
                    return reject(err);
                }
                if (!locker) {
                    return reject(new Error('Locker not found'));
                }
                if (!authorizeUser(locker, userId)) {
                    return reject(new Error('Unauthorized'));
                } else {
                    Locker.findOneAndUpdate(
                        { id: lockerId },
                        {
                            $push: { games: gameId },
                            $set: { updatedAt: new Date() }
                        },
                        { new: true }
                    ).exec((err, updatedLocker) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(updatedLocker);
                    });
                }
            });
    });
};

module.exports.addMovie = function (userId, lockerId, movieId) {
    return new Promise((resolve, reject) => {
        Locker.findOne({ id: lockerId })
            .exec((err, locker) => {
                if (err) {
                    return reject(err);
                }
                if (!locker) {
                    return reject(new Error('Locker not found'));
                }
                if (!authorizeUser(locker, userId)) {
                    return reject(new Error('Unauthorized'));
                } else {
                    Locker.findOneAndUpdate(
                        { id: lockerId },
                        {
                            $push: { movies: movieId },
                            $set: { updatedAt: new Date() }
                        },
                        { new: true }
                    ).exec((err, updatedLocker) => {
                        if (err) {
                            return reject(err);
                        }
                        if (!updatedLocker) {
                            return reject(new Error('Locker not found'));
                        }
                        resolve(updatedLocker);
                    });
                }
            });
    });
};

module.exports.addBook = function (lockerId, bookId) {
    return new Promise((resolve, reject) => {
        Locker.findOne({ id: lockerId })
            .exec((err, locker) => {
                if (err) {
                    return reject(err);
                }
                if (!locker) {
                    return reject(new Error('Locker not found'));
                }
                if (!authorizeUser(locker, userId)) {
                    return reject(new Error('Unauthorized'));
                } else {
                    Locker.findOneAndUpdate(
                        { id: lockerId },
                        {
                            $push: { books: bookId },
                            $set: { updatedAt: new Date() }
                        },
                        { new: true }
                    ).exec((err, updatedLocker) => {
                        if (err) {
                            return reject(err);
                        }
                        if (!updatedLocker) {
                            return reject(new Error('Locker not found'));
                        }
                        resolve(updatedLocker);
                    });
                }
            });
    });
};

module.exports.removeGame = function (lockerId, userId, gameId) {
    return new Promise((resolve, reject) => {
        Locker.findOne({ id: lockerId })
            .exec((err, locker) => {
                if (err) {
                    return reject(err);
                }
                if (!locker) {
                    return reject(new Error('Locker not found'));
                }
                if (!authorizeUser(userId, locker)) {
                    return reject(new Error('Unauthorized'));
                } else {  
                    Locker.findOneAndUpdate(
                        { id: lockerId },
                        {
                            $pull: { games: gameId },
                            $set: { updatedAt: new Date() }
                        },
                        { new: true }
                    ).exec((err, updatedLocker) => {
                        if (err) {
                            return reject(err);
                        }
                        if (!updatedLocker) {
                            return reject(new Error('Locker not found'));
                        }
                        resolve(updatedLocker);
                    });
                }
            });
    });
};
   
module.exports.removeMovie = function (lockerId, userId, movieId) {
    return new Promise((resolve, reject) => {
      Locker.findOne({ id: lockerId })
        .exec((err, locker) => {
          if (err) {
            return reject(err);
          }
          if (!locker) {
            return reject(new Error('Locker not found'));
          }
  
          // Check if the user is allowed to remove a movie from this locker
          if (!authorizeUser(userId, locker)) {
            return reject(new Error('Unauthorized'));
          }
  
          // If authorized, proceed with removal
          Locker.findOneAndUpdate(
            { id: lockerId },
            {
              $pull: { movies: movieId },
              $set: { updatedAt: new Date() }
            },
            { new: true }
          ).exec((err, updatedLocker) => {
            if (err) {
              return reject(err);
            }
            if (!updatedLocker) {
              return reject(new Error('Locker not found'));
            }
            resolve(updatedLocker);
          });
        });
    });
  };
  

  module.exports.removeBook = function (lockerId, userId, bookId) {
    return new Promise((resolve, reject) => {
      Locker.findOne({ id: lockerId })
        .exec((err, locker) => {
          if (err) {
            return reject(err);
          }
          if (!locker) {
            return reject(new Error('Locker not found'));
          }
  
          // Check if user is allowed to remove a book from this locker
          if (!authorizeUser(userId, locker)) {
            return reject(new Error('Unauthorized'));
          }
  
          // If authorized, proceed with removal
          Locker.findOneAndUpdate(
            { id: lockerId },
            {
              $pull: { books: bookId },
              $set: { updatedAt: new Date() }
            },
            { new: true }
          ).exec((err, updatedLocker) => {
            if (err) {
              return reject(err);
            }
            if (!updatedLocker) {
              return reject(new Error('Locker not found'));
            }
            resolve(updatedLocker);
          });
        });
    });
  };
  

  module.exports.deleteLocker = function (lockerId, userId) {
    return new Promise((resolve, reject) => {
      Locker.findOne({ id: lockerId })
        .exec((err, locker) => {
          if (err) {
            return reject(err);
          }
          if (!locker) {
            return reject(new Error('Locker not found'));
          }
  
          // Check if user is allowed to delete this locker
          if (!authorizeUser(userId, locker)) {
            return reject(new Error('Unauthorized'));
          }
  
          // If authorized, proceed with removal
          Locker.findOneAndRemove({ id: lockerId })
            .exec((err, deletedLocker) => {
              if (err) {
                return reject(err);
              }
              if (!deletedLocker) {
                return reject(new Error('Locker not found'));
              }
              resolve(deletedLocker);
            });
        });
    });
  };
  

  module.exports.getLockerByOwnerId = function (ownerId, userId) {
    return new Promise((resolve, reject) => {
      // If you want only the actual owner to see their own lockers:
      if (ownerId !== userId) {
        return reject(new Error('Unauthorized'));
      }
  
      Locker.find({ ownerId: ownerId })
        .exec((err, lockers) => {
          if (err) {
            return reject(err);
          }
          resolve(lockers);
        });
    });
  };
  