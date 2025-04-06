const mongoose = require('mongoose');
require("dotenv").config();

const lockerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  visibility: { type: String, required: true }, // Consider renaming to "visibility" if needed
  games: { type: Array, required: true },
  movies: { type: Array, required: true },
  books: { type: Array, required: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  createdBy: { type: String, required: true },
  usersWithAccess: { type: Array, required: true },
  ownerId: { type: String, required: true }
});

let Locker;


// mock data for testing
const mockLockers = [
    {
        id: "1",
        name: "My First Locker",
        visibility: "private",
        games: ["game1", "game2"],
        movies: ["movie1"],
        books: ["book1"],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user1",
        usersWithAccess: ["user2"],
        ownerId: "user1"
    },
    {
        id: "2",
        name: "My Second Locker",
        visibility: "public",
        games: ["game2"],
        movies: [],
        books: ['book2'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user3",
        usersWithAccess: [],
        ownerId: "user3"
    }
];

module.exports.addMockData = function () {
  // This function is for testing purposes only
  // It should be removed in production
  // If the locker collection is empty, add mock data
  Locker.find({}, (err, lockers) => {
    if (err) console.error(err);
    if (lockers.length === 0) {
      Locker.insertMany(mockLockers);
    }
  });
}

const authorizeUser = (userId, locker) => {
  return locker.ownerId === userId || locker.usersWithAccess.includes(userId);
};

module.exports.setModel = function (connection) {
  Locker = connection.model('Locker', lockerSchema);
  console.log("Locker model set:");
  console.log(JSON.stringify(Locker.schema));
};

const generateUniqueLockerId = () => {
  // Replace this with your actual unique ID generation logic.
  return "lockerId";
};

module.exports.createLocker = function (userId) {
  return new Promise((resolve, reject) => {
    const lockerId = generateUniqueLockerId();
    const date = new Date();
    let locker = new Locker({
      id: lockerId,
      name: "My Locker",
      visibility: "private", // Provide a default value or update the field name if needed
      games: [],
      movies: [],
      books: [],
      createdAt: date,
      updatedAt: date,
      createdBy: userId,
      usersWithAccess: [],
      ownerId: userId
    });
    locker.save((err, locker) => {
      if (err) reject(err);
      else resolve(locker);
    });
  });
};

module.exports.getLockerById = function (lockerId) {
  return new Promise((resolve, reject) => {
    Locker.findOne({ id: lockerId }).exec((err, locker) => {
      if (err) return reject(err);
      if (!locker) return reject(new Error('Locker not found'));
      resolve(locker);
    });
  });
};

module.exports.addGame = function (lockerId, userId, gameId) {
  return new Promise((resolve, reject) => {
    Locker.findOne({ id: lockerId }).exec((err, locker) => {
      if (err) return reject(err);
      if (!locker) return reject(new Error('Locker not found'));
      if (!authorizeUser(userId, locker)) return reject(new Error('Unauthorized'));
      Locker.findOneAndUpdate(
        { id: lockerId },
        { $push: { games: gameId }, $set: { updatedAt: new Date() } },
        { new: true }
      ).exec((err, updatedLocker) => {
        if (err) return reject(err);
        resolve(updatedLocker);
      });
    });
  });
};

module.exports.addMovie = function (lockerId, userId, movieId) {
  return new Promise((resolve, reject) => {
    Locker.findOne({ id: lockerId }).exec((err, locker) => {
      if (err) return reject(err);
      if (!locker) return reject(new Error('Locker not found'));
      if (!authorizeUser(userId, locker)) return reject(new Error('Unauthorized'));
      Locker.findOneAndUpdate(
        { id: lockerId },
        { $push: { movies: movieId }, $set: { updatedAt: new Date() } },
        { new: true }
      ).exec((err, updatedLocker) => {
        if (err) return reject(err);
        if (!updatedLocker) return reject(new Error('Locker not found'));
        resolve(updatedLocker);
      });
    });
  });
};

module.exports.addBook = function (lockerId, userId, bookId) {
  return new Promise((resolve, reject) => {
    Locker.findOne({ id: lockerId }).exec((err, locker) => {
      if (err) return reject(err);
      if (!locker) return reject(new Error('Locker not found'));
      if (!authorizeUser(userId, locker)) return reject(new Error('Unauthorized'));
      Locker.findOneAndUpdate(
        { id: lockerId },
        { $push: { books: bookId }, $set: { updatedAt: new Date() } },
        { new: true }
      ).exec((err, updatedLocker) => {
        if (err) return reject(err);
        if (!updatedLocker) return reject(new Error('Locker not found'));
        resolve(updatedLocker);
      });
    });
  });
};

module.exports.removeGame = function (lockerId, userId, gameId) {
  return new Promise((resolve, reject) => {
    Locker.findOne({ id: lockerId }).exec((err, locker) => {
      if (err) return reject(err);
      if (!locker) return reject(new Error('Locker not found'));
      if (!authorizeUser(userId, locker)) return reject(new Error('Unauthorized'));
      Locker.findOneAndUpdate(
        { id: lockerId },
        { $pull: { games: gameId }, $set: { updatedAt: new Date() } },
        { new: true }
      ).exec((err, updatedLocker) => {
        if (err) return reject(err);
        if (!updatedLocker) return reject(new Error('Locker not found'));
        resolve(updatedLocker);
      });
    });
  });
};

module.exports.removeMovie = function (lockerId, userId, movieId) {
  return new Promise((resolve, reject) => {
    Locker.findOne({ id: lockerId }).exec((err, locker) => {
      if (err) return reject(err);
      if (!locker) return reject(new Error('Locker not found'));
      if (!authorizeUser(userId, locker)) return reject(new Error('Unauthorized'));
      Locker.findOneAndUpdate(
        { id: lockerId },
        { $pull: { movies: movieId }, $set: { updatedAt: new Date() } },
        { new: true }
      ).exec((err, updatedLocker) => {
        if (err) return reject(err);
        if (!updatedLocker) return reject(new Error('Locker not found'));
        resolve(updatedLocker);
      });
    });
  });
};

module.exports.removeBook = function (lockerId, userId, bookId) {
  return new Promise((resolve, reject) => {
    Locker.findOne({ id: lockerId }).exec((err, locker) => {
      if (err) return reject(err);
      if (!locker) return reject(new Error('Locker not found'));
      if (!authorizeUser(userId, locker)) return reject(new Error('Unauthorized'));
      Locker.findOneAndUpdate(
        { id: lockerId },
        { $pull: { books: bookId }, $set: { updatedAt: new Date() } },
        { new: true }
      ).exec((err, updatedLocker) => {
        if (err) return reject(err);
        if (!updatedLocker) return reject(new Error('Locker not found'));
        resolve(updatedLocker);
      });
    });
  });
};

module.exports.deleteLocker = function (lockerId, userId) {
  return new Promise((resolve, reject) => {
    Locker.findOne({ id: lockerId }).exec((err, locker) => {
      if (err) return reject(err);
      if (!locker) return reject(new Error('Locker not found'));
      if (!authorizeUser(userId, locker)) return reject(new Error('Unauthorized'));
      Locker.findOneAndDelete({ id: lockerId }).exec((err, deletedLocker) => {
        if (err) return reject(err);
        if (!deletedLocker) return reject(new Error('Locker not found'));
        resolve(deletedLocker);
      });
    });
  });
};
