const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/user');

const transporter = nodemailer.createTransport({
  service: 'Outlook', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const register = async (req, res) => {
  try {
    console.log('Received registration request:', req.body);
    const { username, password, email, mobile } = req.body;

    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if the password meets the minimum length requirement
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Create a new user with additional fields
    const newUser = new User({ username, password, email, mobile });

    // Save the user to the database
    await newUser.save();

    // Generate a verification token
    const verificationToken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Construct the activation link
    const activationLink = `${req.protocol}://${req.get('host')}/api/auth/activate-account/${verificationToken}`;

    // Send an email with the activation link
    await transporter.sendMail({
      to: email,
      subject: 'Activate Your Account',
      html: `Click <a href="${activationLink}">here</a> to activate your account.`,
    });

    res.status(201).json({ message: 'User registered successfully. Activation email sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


const verifyEmail = async (req, res) => {
  try {
    // Extract the token from URL parameters
    const token = req.params.token;

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Extract user ID from the token
    const userId = decodedToken.userId;

    // Find the user by ID
    const user = await User.findById(userId);

    // If user is not found or email is already verified, return an error
    if (!user || user.isEmailVerified) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update user's email verification status
    user.isEmailVerified = true;
    await user.save();

    // Respond with a success message
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error(error);
    // If token is invalid or expired, return an error
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

const login = async (req, res) => {
  try {
    console.log('Received login request:', req.body);

    const { email, password } = req.body;
    

    const user = await User.findOne({ email });
    console.log('Found user:', user);

    // Check if the user exists
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if the user's email is verified
    if (!user.isEmailVerified) {
      console.log('Email not verified');
      return res.status(401).json({ message: 'Email not verified' });
    }

    // Compare the provided password with the password in the database
    if (password !== user.password) {
      console.log('Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Password is valid, generate a JWT token for authentication
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    console.log('Login successful');
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Save reset token and expiration time in user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send password reset email
    await transporter.sendMail({
      to: email,
      subject: 'Reset Your Password',
      html: `Click <a href="${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}">here</a> to reset your password.`,
    });

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update user's password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword
};