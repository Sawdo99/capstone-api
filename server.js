const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require('passport-jwt');

const userService = require('./user-service');
const lockerService = require('./locker-service');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Passport JWT Strategy
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'secret', // for demo; ideally use an environment variable
};

const strategy = new JwtStrategy(jwtOptions, (jwt_payload, next) => {
  // Typically, you'd fetch the user from DB here:
  const user = { id: jwt_payload.id };
  // If found, call next(null, user), otherwise next(null, false)
  next(null, user);
});

passport.use(strategy);

// connect to MongoDB
const mongoose = require('mongoose');
const mongoDBConnectionString = process.env.MONGO_URL;

// make a function to connect to the database and assign the locker and user models
mongoose.connect(mongoDBConnectionString)
  .then((connection) => {
    console.log('Connected to MongoDB');
  
    // Define models after the connection is established
    // userService.User = mongoose.model('User', userService.userSchema);
    // lockerService.Locker = mongoose.model('Locker', lockerService.lockerSchema);
    userService.setModel(connection);
    lockerService.setModel(connection);

    //ROUTES
    // Basic test route
    app.get('/', (req, res) => {
      res.send('API server is running!');
    });

   
    //AUTH / USERS
    // Login
    app.post('/login', (req, res) => {
      const { username, password } = req.body;
      userService
        .validateUser({ userName: username, password })
        .then((user) => {
          // Create a JWT with the user’s _id (or custom field you prefer)
          const payload = { id: user._id.toString() };
          const token = jwt.sign(payload, jwtOptions.secretOrKey);
          res.json({ message: 'ok', token });
        })
        .catch((err) => {
          res.status(401).json({ message: 'Invalid credentials', error: err });
        });
    });

    // Register
    app.post('/register', (req, res) => {
      userService
        .registerUser(req.body)
        .then((msg) => {
          res.json({ message: msg });
        })
        .catch((err) => {
          res.status(400).json({ error: err });
        });
    });

    //LOCKERS
    // Create a new locker for a user
    app.post('/locker/:userId',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId } = req.params;
        lockerService
          .createLocker(userId)
          .then((locker) => {
            res.json(locker);
          })
          .catch((err) => {
            res.status(500).json({ error: err.message });
          });
      }
    );

    // Get a locker by ID (requires JWT)
    app.get('/locker/:userId/:lockerId',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId } = req.params;
        lockerService
          .getLockerById(lockerId)
          .then((locker) => {
            // Ensure the requesting user can read it (owner or in usersWithAccess)
            if (
              locker.ownerId !== userId &&
              !locker.usersWithAccess.includes(userId)
            ) {
              return res.status(403).json({ message: 'Unauthorized' });
            }
            res.json(locker);
          })
          .catch((err) => {
            res.status(404).json({ error: err.message });
          });
      }
    );

    // Add a game to a locker
    app.post('/locker/:userId/:lockerId/games',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId } = req.params;
        const { gameId } = req.body;
        lockerService
          .addGame(lockerId, userId, gameId)
          .then((updatedLocker) => {
            res.json(updatedLocker);
          })
          .catch((err) => {
            res.status(400).json({ error: err.message });
          });
      }
    );

    // Remove a game from a locker
    app.delete('/locker/:userId/:lockerId/games/:gameId',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId, gameId } = req.params;
        lockerService
          .removeGame(lockerId, userId, gameId)
          .then((updatedLocker) => {
            res.json(updatedLocker);
          })
          .catch((err) => {
            res.status(400).json({ error: err.message });
          });
      }
    );

    // Add a movie to a locker
    app.post('/locker/:userId/:lockerId/movies',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId } = req.params;
        const { movieId } = req.body;
        lockerService
          .addMovie(userId, lockerId, movieId)
          .then((updatedLocker) => {
            res.json(updatedLocker);
          })
          .catch((err) => {
            res.status(400).json({ error: err.message });
          });
      }
    );

    // Remove a movie from a locker
    app.delete('/locker/:userId/:lockerId/movies/:movieId',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId, movieId } = req.params;
        lockerService
          .removeMovie(lockerId, userId, movieId)
          .then((updatedLocker) => {
            res.json(updatedLocker);
          })
          .catch((err) => {
            res.status(400).json({ error: err.message });
          });
      }
    );

    // Add a book to a locker
    app.post('/locker/:userId/:lockerId/books',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId } = req.params;
        const { bookId } = req.body;
        lockerService
          .addBook(lockerId, bookId) // note addBook signature differs from addMovie
          .then((updatedLocker) => {
            res.json(updatedLocker);
          })
          .catch((err) => {
            res.status(400).json({ error: err.message });
          });
      }
    );

    // Remove a book from a locker
    app.delete('/locker/:userId/:lockerId/books/:bookId',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId, bookId } = req.params;
        lockerService
          .removeBook(lockerId, userId, bookId)
          .then((updatedLocker) => {
            res.json(updatedLocker);
          })
          .catch((err) => {
            res.status(400).json({ error: err.message });
          });
      }
    );

    // Delete an entire locker
    app.delete('/locker/:userId/:lockerId',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId } = req.params;
        lockerService
          .deleteLocker(lockerId, userId)
          .then((deletedLocker) => {
            res.json(deletedLocker);
          })
          .catch((err) => {
            res.status(400).json({ error: err.message });
          });
      }
    );

    // Start the server
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // Exit the process with a failure code
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic
});
// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('Received SIGINT. Exiting gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
// Handle SIGTERM (kill command)
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Exiting gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
  // set a timeout to force exit if not closed
  setTimeout(() => {
    console.error('Forcing exit...');
    process.exit(1);
  }, 10000); // 10 seconds
});
