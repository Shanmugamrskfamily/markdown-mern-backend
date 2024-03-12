const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth'); 

// Register a new user
router.post('/register', authController.register);
router.get('/activate/:token',authController.verifyEmail);

// Login
router.post('/login', authController.login);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;

