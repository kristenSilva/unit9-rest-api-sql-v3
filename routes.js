'use strict';

const express = require('express');

// Construct a router instance.
const router = express.Router();
const { authenticateUser } = require('./middleware/auth-user');
const User = require('./models').User;

// Handler function to wrap each route.
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      // Forward error to the global error handler
      next(error);
    }
  }
}

/**
 * USER ROUTES
 */

// Route that returns a correctly authenticated user
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
    const user = req.currentUser;
    res.json({
      emailAddress: user.emailAddress
    });
}));

// Route that creates a new user.
router.post('/users', asyncHandler(async (req, res) => {
    try {
      await User.create(req.body);
      console.log(req.body);
      res.status(201).location('/');
        //.json({ "message": "Account successfully created!" });
    } catch (error) {
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const errors = error.errors.map(err => err.message);
        res.status(400).json({ errors });   
      } else {
        throw error;
      }
    }
  }));

/**
 * COURSE ROUTES
 */

// Route that returns a list of all courses including User that owns each course
// router.get('/courses', asyncHandler(async (req, res) => {

// }));

// // Route that returns corresponding course and User (owner)
// router.get('/courses/:id', asyncHandler(async (req, res) => {

// }));

// // Route that creates new course, sets Location to URI for new course & returns 201 status code
// router.post('/courses', asyncHandler(async (req, res) => {

// }));

// // Route that updates corresponding course and returns 204 status
// router.put('/courses/:id', asyncHandler(async (req, res) => {

// }));

// // Route that deletes corresponding course and returns 204 status
// router.delete('/courses/:id', asyncHandler(async (req, res) => {

// }));

module.exports = router;