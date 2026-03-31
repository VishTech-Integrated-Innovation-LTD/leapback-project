"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
// Importing the User model to interact with the users table in the database
const user_model_1 = __importDefault(require("../models/user.model"));
// Importing bcrypt for hashing passwords before saving and comparing on login
const bcrypt_1 = __importDefault(require("bcrypt"));
// Importing jsonwebtoken for generating a JWT token on successful login
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Importing config file to access jwt secret key
// import config from '../config/config';
// const config = require('../config/config');
// ============================================================================
// @desc   REGISTER USER
// @route  POST  /auth/register
// @access Public
// Can be triggered by the "+ Add Staff Member" button on the Settings page
// ============================================================================
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Validate that all required fields are provided
        if (!name || !email || !password) {
            res.status(400).json({ message: 'Name, email, and password are required' });
            return;
        }
        // Validate password length
        if (password.length < 8) {
            res.status(400).json({ message: 'Password must be at least 8 characters' });
            return;
        }
        // Check if a user with this email already exists in the database
        const existingUser = await user_model_1.default.findOne({ where: { email } });
        if (existingUser) {
            res.status(409).json({ message: 'A staff member with that email already exists' });
            return;
        }
        // Hash the password with bcrypt before saving
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Create the new user in the db 
        const newUser = await user_model_1.default.create({
            name,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            userType: 'admin',
            isActive: true
        });
        // Return the new user without the password field
        res.status(201).json({
            message: 'Staff member created successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                userType: newUser.userType,
                isActive: newUser.isActive,
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating user" });
    }
};
exports.registerUser = registerUser;
// ============================================================================
// @desc   LOGIN USER
// @route  POST  /auth/login
// @access Public
// Triggered by the "Sign In" button on the login page
// ============================================================================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate that both fields are provided
        if (!email || !password) {
            res.status(400).json({ message: 'Email, and password are required' });
            return;
        }
        // Look up the user by email: include password field since it's needed for comparison
        const user = await user_model_1.default.findOne({ where: { email: email.toLowerCase().trim() } });
        // Return a generic "invalid credentials" message ( to prevent revealing which field is wrong)
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Check if the staff account is active
        if (!user.isActive) {
            res.status(403).json({ message: 'Your account is inactive. Contact the administrator.' });
            return;
        }
        // Compare the submitted password against the stored bcrypt hash
        const passwordMatch = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Update the lastLoginAt timestamp to track when this staff member last signed in
        await user.update({ lastLoginAt: new Date() });
        // Generate a JWT token
        // Create token payload
        const payload = { id: user.id, name: user.name, email: user.email, userType: user.userType };
        // Create JWT Token
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
        // Return the token and user info - the frontend uses name and userType for the sidebar
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                userType: user.userType
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error logging in user" });
    }
};
exports.loginUser = loginUser;
//# sourceMappingURL=auth.controller.js.map