'use strict';

const auth = require('basic-auth');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Middleware to authenticate the request using Basic Authentication.
exports.authenticateUser = async (req, res, next) => {
    let message;

    // Parse the user's credentials from the Authorization header.
        //stores an object with user's key & secret
    const credentials = auth(req); 

    // If the user's credentials are available:
    if(credentials){
        const user = await User.findOne({ 
            where: {
                emailAddress: credentials.name
            } 
        });
        // If a user was successfully retrieved from the data store:
        if(user){
            //returns true if passwords match
           const authenticated = bcrypt
                .compareSync(credentials.pass, user.password); 
            // If the passwords match...
            if(authenticated){
                //adding a property named currentUser to request obj
                req.currentUser = user; 
            } else {
                message = `Authentication failure for email: ${user.emailAddress}`;
            }
        } else {
            message = `User not found for email: ${user.emailAddress}`;
        }
    } else {
        message = `Auth header not found`;
    }
    // If user authentication failed...
    if(message){
        // Return a response with a 401 Unauthorized HTTP status code.
        console.warn(message);
        res.status(401).json({ message: 'Access Denied' });
    } else {
        next();
    }
};