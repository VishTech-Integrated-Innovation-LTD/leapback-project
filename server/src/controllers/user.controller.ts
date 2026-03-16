// Importing Request, Response from express for typing the controller functions
import { Request, Response } from 'express';
// Importing the User model to interact with the users table in the database
import { User } from '../models';
// import User from '../models/user.model';
// Importing bcrypt for hashing passwords  when a user updates their password
import bcrypt from 'bcrypt';





// ==================================================================================
// @desc   GET ALL USERS
// @route  GET  /users
// @access Public
// Returns all staff members (used to populate the staff table on the Settings page)
// ===================================================================================
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        // Fetch all users, excluding the password field from the response
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Users retrieved successfully',
            count: users.length,
            users
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving users" });
    }
}




// ==================================================================================
// @desc   GET USER BY ID
// @route  GET  /users/:id
// @access Public
// Returns a single staff member's details by their UUID
// ===================================================================================
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing user ID' });
            return;
        }

        // Find the user by primary key (id), excluding the password from the response
        const user = await User.findByPk(id, {
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

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving user by id" });
    }
}




// ==================================================================================
// @desc   UPDATE USER BY ID
// @route  GET  /users/:id
// @access Public
// Permanently removes a staff member from the database
// ===================================================================================
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, password, isActive } = req.body;

        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing user ID' });
            return;
        }

        // Find the user to update
        const user = await User.findByPk(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // If a new email is provided, check it isn't already taken by another user
        if (email && email.toLowerCase().trim() !== user.email) {
            const emailTaken = await User.findOne({
                where: { email: email.toLowerCase().trim() },
            });
            if (emailTaken) {
                res.status(409).json({ message: 'A staff member with that email already exists' });
                return;
            }
        }

        // If a new password is provided, validate length and hash it before saving
        let hashedPassword: string | undefined;
        if (password) {
            if (password.length < 8) {
                res.status(400).json({ message: 'Password must be at least 8 characters' });
                return;
            }
            hashedPassword = await bcrypt.hash(password, 10);
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
        });

        // Return the updated user without the password field
        res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                isActive: user.isActive,
            },
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating user details" });
    }
}



// ==================================================================================
// @desc   DELETE USER BY ID
// @route  GET  /users/:id
// @access Public
// Permanently removes a staff member from the database
// ===================================================================================
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: 'Invalid or missing user ID' });
            return;
        }

        // Find the user to delete
        const user = await User.findByPk(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Store name for the response message before deleting
        const userName = user.name;

        // Permanently delete the user from the database
        await user.destroy();

        res.status(200).json({
            message: `Staff member '${userName}' deleted successfully`,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting user." });
    }
}