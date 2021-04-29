'use strict';

const express = require('express');

// Construct a router instance.
const router = express.Router();
const { authenticateUser } = require('./middleware/auth-user');
const User = require('./models').User;
const Course = require('./models').Course;

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
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddress
    });
    // res.json(user);
}));

// Route that creates a new user.
router.post('/users', asyncHandler(async (req, res) => {
  try {
    await User.create(req.body);
    res.status(201).location('/').end();
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
router.get('/courses', asyncHandler(async (req, res) => {
  const courses = await Course.findAll({
    attributes: ['title', 'description', 'estimatedTime', 'materialsNeeded'],
    include: [
      {
        model: User,
        attributes: ['firstName', 'lastName', 'emailAddress']
      }
    ]
  }); 
  //console.log(JSON.stringify(courses, null, 2));
  res.json(courses);
}));

// Route that returns corresponding course and User (owner)
router.get('/courses/:id', asyncHandler(async (req, res) => {
  const course = await Course.findAll({
    attributes: ['title', 'description', 'estimatedTime', 'materialsNeeded'],
    where: {
      id: req.params.id
    },
    include: [
      {
        model: User,
        attributes: ['firstName', 'lastName', 'emailAddress']
      }
    ]
  });
  if(course){
    res.json(course);
  } else {
    res.status(404).json({ message: 'Course Not Found' });
  }
}));

// Route that creates new course, sets Location to URI for new course & returns 201 status code
router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).location(`/api/courses/${course.id}`).end();
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });   
    } else {
      throw error;
    }
  }
}));

// Route that updates corresponding course and returns 204 status
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
  try{
    //grab course to update
    const course = await Course.findByPk(req.params.id);
    //check if course exists
    if(course) {
      //check if course owner (user) matches authenticated user
      const user = req.currentUser;
      if(user.id === course.userId){
        await course.update(req.body);
        res.status(204).end();
      } else {
        res.status(403).json({ message: 'Incorrect User' });
      }
    } else {
      res.status(404).json({ message: 'Course Not Found' });
    }
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });   
    } else {
      throw error;
    }   
  }
}));

// Route that deletes corresponding course and returns 204 status
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
  //grab course to update
  const course = await Course.findByPk(req.params.id);
  //check if course exists
  if(course) {
    //check course owner
    const user = req.currentUser;
    if(user.id === course.userId){
      await course.destroy();
      res.status(204).end();
    } else {
      res.status(403).json({ message: 'Incorrect User' });      
    }
  } else {
    res.status(404).json({message: 'Course Not Found'});
  }
}));

module.exports = router;