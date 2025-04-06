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

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'secret'
};

const strategy = new JwtStrategy(jwtOptions, (jwt_payload, next) => {
  const user = { id: jwt_payload.id };
  next(null, user);
});

passport.use(strategy);

const mongoose = require('mongoose');
const mongoDBConnectionString = process.env.MONGO_URL;

mongoose.connect(mongoDBConnectionString)
  .then((connection) => {
    console.log('Connected to MongoDB');
    userService.setModel(connection);
    lockerService.setModel(connection);
    lockerService.addMockData();

    app.get('/', (req, res) => {
      res.send('API server is running!');
    });

    app.post('/login', (req, res) => {
      const { username, password } = req.body;
      userService.validateUser({ username, password })
        .then((user) => {
          const payload = { id: user._id.toString() };
          const token = jwt.sign(payload, jwtOptions.secretOrKey);
          res.json({ message: 'ok', token });
        })
        .catch((err) => {
          res.status(401).json({ message: 'Invalid credentials', error: err });
        });
    });

    app.post('/register', (req, res) => {
      userService.registerUser(req.body)
        .then((msg) => {
          res.json({ message: msg });
        })
        .catch((err) => {
          res.status(400).json({ error: err });
        });
    });

    app.post('/locker/:userId',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId } = req.params;
        lockerService.createLocker(userId)
          .then((locker) => res.json(locker))
          .catch((err) => res.status(500).json({ error: err.message }));
      }
    );

    app.get('/locker/:userId/:lockerId',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId } = req.params;
        lockerService.getLockerById(lockerId)
          .then((locker) => {
            if (locker.ownerId !== userId && !locker.usersWithAccess.includes(userId)) {
              return res.status(403).json({ message: 'Unauthorized' });
            }
            res.json(locker);
          })
          .catch((err) => res.status(404).json({ error: err.message }));
      }
    );

    app.post('/locker/:userId/:lockerId/games',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId } = req.params;
        const { gameId } = req.body;
        lockerService.addGame(lockerId, userId, gameId)
          .then((updatedLocker) => res.json(updatedLocker))
          .catch((err) => res.status(400).json({ error: err.message }));
      }
    );

    app.delete('/locker/:userId/:lockerId/games/:gameId',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId, gameId } = req.params;
        lockerService.removeGame(lockerId, userId, gameId)
          .then((updatedLocker) => res.json(updatedLocker))
          .catch((err) => res.status(400).json({ error: err.message }));
      }
    );

    app.post('/locker/:userId/:lockerId/movies',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId } = req.params;
        const { movieId } = req.body;
        lockerService.addMovie(lockerId, userId, movieId)
          .then((updatedLocker) => res.json(updatedLocker))
          .catch((err) => res.status(400).json({ error: err.message }));
      }
    );

    app.delete('/locker/:userId/:lockerId/movies/:movieId',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId, movieId } = req.params;
        lockerService.removeMovie(lockerId, userId, movieId)
          .then((updatedLocker) => res.json(updatedLocker))
          .catch((err) => res.status(400).json({ error: err.message }));
      }
    );

    app.post('/locker/:userId/:lockerId/books',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId } = req.params;
        const { bookId } = req.body;
        lockerService.addBook(lockerId, userId, bookId)
          .then((updatedLocker) => res.json(updatedLocker))
          .catch((err) => res.status(400).json({ error: err.message }));
      }
    );

    app.delete('/locker/:userId/:lockerId/books/:bookId',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId, bookId } = req.params;
        lockerService.removeBook(lockerId, userId, bookId)
          .then((updatedLocker) => res.json(updatedLocker))
          .catch((err) => res.status(400).json({ error: err.message }));
      }
    );

    app.delete('/locker/:userId/:lockerId',
      passport.authenticate('jwt', { session: false }),
      (req, res) => {
        const { userId, lockerId } = req.params;
        lockerService.deleteLocker(lockerId, userId)
          .then((deletedLocker) => res.json(deletedLocker))
          .catch((err) => res.status(400).json({ error: err.message }));
      }
    );

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
