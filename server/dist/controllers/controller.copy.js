"use strict";
// ============================================================
// REPLACE: src/controllers/auth.controller.ts
// Changes vs original:
//  - `role` added to JWT payload in loginUser
//  - `role` added to registerUser body (defaults to 'staff' if omitted)
//  - `role` returned in user objects so frontend can read it
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const models_1 = require("../models");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// ============================================================================
// @desc   REGISTER USER
// @route  POST /auth/register
// @access Public (lock this down to chief_admin in production via role middleware)
// ============================================================================
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ message: 'Name, email, and password are required' });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({ message: 'Password must be at least 8 characters' });
            return;
        }
        const existingUser = await models_1.User.findOne({ where: { email } });
        if (existingUser) {
            res.status(409).json({ message: 'A staff member with that email already exists' });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Validate role — default to 'staff' if not provided or invalid
        const allowedRoles = ['chief_admin', 'admin', 'staff'];
        const assignedRole = allowedRoles.includes(role) ? role : 'staff';
        const newUser = await models_1.User.create({
            name,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: assignedRole,
            isActive: true,
        });
        res.status(201).json({
            message: 'Staff member created successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isActive: newUser.isActive,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.registerUser = registerUser;
// ============================================================================
// @desc   LOGIN USER
// @route  POST /auth/login
// @access Public
// ============================================================================
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        const user = await models_1.User.findOne({ where: { email: email.toLowerCase().trim() } });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({ message: 'Your account is inactive. Contact the administrator.' });
            return;
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        await user.update({ lastLoginAt: new Date() });
        // ── role is now in the JWT payload ────────────────────────────────
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            userType: user.userType,
            role: user.role, // ← NEW
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                role: user.role, // ← NEW: frontend reads this for permissions
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.loginUser = loginUser;
//# sourceMappingURL=controller.copy.js.map