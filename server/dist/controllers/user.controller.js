"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getAllUsers = void 0;
// Importing the User model to interact with the users table in the database
const models_1 = require("../models");
// import User from '../models/user.model';
// Importing bcrypt for hashing passwords  when a user updates their password
const bcrypt_1 = __importDefault(require("bcrypt"));
const ALLOWED_ROLES = ['chief_admin', 'admin', 'staff'];
// ==================================================================================
// @desc   GET ALL USERS
// @route  GET  /users
// @access Private(only logged in users)
// Returns all staff members (used to populate the staff table on the Settings page)
// ===================================================================================
const getAllUsers = async (req, res, next) => {
    try {
        // Fetch all users, excluding the password field from the response
        const users = await models_1.User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({
            message: 'Users retrieved successfully',
            count: users.length,
            users
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllUsers = getAllUsers;
// ==================================================================================
// @desc   GET USER BY ID
// @route  GET  /users/:id
// @access Private(only logged in users)
// Returns a single staff member's details by their UUID
// ===================================================================================
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing user ID' });
            return;
        }
        // Find the user by primary key (id), excluding the password from the response
        const user = await models_1.User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        // Return 404 if no user found with the given id
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({
            message: 'User retrieved successfully',
            user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserById = getUserById;
// ==================================================================================
// @desc   UPDATE USER BY ID
// @route  GET  /users/:id
// @access Private(only logged in users)
// Permanently removes a staff member from the database
// Note: only chief_admin should be able to update another user's `role`.
// ===================================================================================
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, password, isActive, role } = req.body;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing user ID' });
            return;
        }
        // Find the user to update
        const user = await models_1.User.findByPk(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Only chief_admin can change another user's role
        if (role !== undefined) {
            const callerRole = req.user?.role;
            if (callerRole !== 'chief_admin') {
                res.status(403).json({ message: 'Only the chief admin can change user roles' });
                return;
            }
            if (!ALLOWED_ROLES.includes(role)) {
                res.status(400).json({ message: `Role must be one of: ${ALLOWED_ROLES.join(', ')}` });
                return;
            }
        }
        // Email uniqueness check
        if (email && email.toLowerCase().trim() !== user.email) {
            const emailTaken = await models_1.User.findOne({ where: { email: email.toLowerCase().trim() } });
            if (emailTaken) {
                res.status(409).json({ message: 'A staff member with that email already exists' });
                return;
            }
        }
        // Hash new password if provided
        // If a new password is provided, validate length and hash it before saving
        let hashedPassword;
        if (password) {
            if (password.length < 8) {
                res.status(400).json({ message: 'Password must be at least 8 characters' });
                return;
            }
            hashedPassword = await bcrypt_1.default.hash(password, 10);
        }
        // Update only the fields that were provided in the request body
        // The spread operator (...)
        // If the condition is true, include the object
        // If the condition is false, include nothing
        await user.update({
            ...(name && { name }),
            ...(email && { email: email.toLowerCase().trim() }),
            ...(hashedPassword && { password: hashedPassword }),
            ...(isActive !== undefined && { isActive }),
            ...(role && { role }),
        });
        res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;
// ==================================================================================
// @desc   DELETE USER BY ID
// @route  GET  /users/:id
// @access Private(only logged in users)
// Permanently removes a staff member from the database
// Note: only chief_admin should be able to delete another user.
// ===================================================================================
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const caller = req.user; // Authenticated user from middleware
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing user ID' });
            return;
        }
        // Prevent self-deletion
        if (caller.id === id) {
            res.status(400).json({ message: 'You cannot delete your own account' });
            return;
        }
        // Only chief_admin is allowed to delete users
        if (caller.role !== 'chief_admin') {
            res.status(403).json({
                message: 'Only the Chief Admin can delete other staff members'
            });
            return;
        }
        // Find the user to delete
        const userToDelete = await models_1.User.findByPk(id);
        if (!userToDelete) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Optional: Prevent deletion of another chief_admin (extra safety)
        if (userToDelete.role === 'chief_admin') {
            res.status(403).json({
                message: 'Cannot delete another Chief Admin account'
            });
            return;
        }
        const userName = userToDelete.name;
        // Permanently delete
        await userToDelete.destroy();
        res.status(200).json({
            message: `Staff member '${userName}' has been permanently deleted`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=user.controller.js.map