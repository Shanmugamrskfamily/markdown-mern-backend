const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const bcrypt = require('bcrypt');

const transporter = nodemailer.createTransport({
  service: 'gmail', 
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

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with hashed password and additional fields
    const newUser = new User({ username, password: hashedPassword, email, mobile });

    // Save the user to the database
    await newUser.save();

    // Generate a verification token
    const verificationToken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Construct the activation link with the token as a query parameter
    const activationLink = `https://markdown-previewer-rsk.netlify.app/activate?token=${verificationToken}`;

    // Send an email with the activation link
    await transporter.sendMail({
      to: email,
      subject: 'Markdown Web Application-Activate Your Account',
      html: `Click <b><button style="background-color: blue; color: white; padding: 10px; border: none; border-radius: 5px;"><a style="color: white;" href="${activationLink}">here</a></button></b> to activate your account.`,
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

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
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

    // Hash the reset token before saving it
    const hashedResetToken = await bcrypt.hash(resetToken, 10);

    // Save reset token and expiration time in user document
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send password reset email
    await transporter.sendMail({
      to: email,
      subject: 'Markdown Web Application-Reset Your Password',
      html: `Click <b><button style="background-color: blue; color: white; padding: 10px; border: none; border-radius: 5px;"><a style="color: white;" href="https://markdown-previewer-rsk.netlify.app/reset-password?token=${resetToken}">here</a></button></b> to reset your password.`,
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

    // Hash the new password before updating
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and reset token fields
    user.password = hashedPassword;
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