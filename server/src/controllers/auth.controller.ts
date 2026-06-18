// Importing Request, Response, NextFunction from express for typing the controller functions
import { Request, Response, NextFunction } from 'express';
// Importing the User model to interact with the users table in the database
import { User } from '../models';
// import User  from '../models/user.model';

// Importing bcrypt for hashing passwords before saving and comparing on login
import bcrypt from 'bcrypt';
import { config } from 'dotenv';
// Importing jsonwebtoken for generating a JWT token on successful login
import jwt from 'jsonwebtoken';
// Importing config file to access jwt secret key
// import config from '../config/config';
// const config = require('../config/config');


// ============================================================================
// @desc   REGISTER USER
// @route  POST  /auth/register
// @access Public
// Can be triggered by the "+ Add Staff Member" button on the Settings page
// ============================================================================
// export const registerUser = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { name, email, password, role } = req.body;

//     const caller = (req as any).user;

//     // ------------------------------------------------------------------------
//     // AUTHORIZATION CHECK
//     // ------------------------------------------------------------------------
//     if (!caller) {
//       res.status(401).json({
//         message: 'Authentication required',
//       });
//       return;
//     }

//     // ------------------------------------------------------------------------
//     // VALIDATION
//     // ------------------------------------------------------------------------
//     if (!name || !email || !password) {
//       res.status(400).json({
//         message: 'Name, email, and password are required',
//       });
//       return;
//     }

//     if (password.length < 8) {
//       res.status(400).json({
//         message: 'Password must be at least 8 characters',
//       });
//       return;
//     }

//     const normalizedEmail = email.toLowerCase().trim();

//     // ------------------------------------------------------------------------
//     // CHECK FOR EXISTING USER
//     // ------------------------------------------------------------------------
//     const existingUser = await User.findOne({
//       where: { email: normalizedEmail },
//     });

//     if (existingUser) {
//       res.status(409).json({
//         message: 'A staff member with that email already exists',
//       });
//       return;
//     }

//     // ------------------------------------------------------------------------
//     // ROLE VALIDATION
//     // ------------------------------------------------------------------------
//     const allowedRoles = ['chief_admin', 'admin', 'staff'];

//     const assignedRole =
//       role && allowedRoles.includes(role)
//         ? role
//         : 'staff';

//     // ------------------------------------------------------------------------
//     // PERMISSION RULES
//     // ------------------------------------------------------------------------

//     // Staff cannot create users
//     if (caller.role === 'staff') {
//       res.status(403).json({
//         message: 'Staff members are not allowed to create users',
//       });
//       return;
//     }

//     // Only Chief Admin can create Admins
//     if (
//       assignedRole === 'admin' &&
//       caller.role !== 'chief_admin'
//     ) {
//       res.status(403).json({
//         message: 'Only Chief Admin can create Admin accounts',
//       });
//       return;
//     }

//     // Only Chief Admin can create another Chief Admin
//     if (
//       assignedRole === 'chief_admin' &&
//       caller.role !== 'chief_admin'
//     ) {
//       res.status(403).json({
//         message: 'Only Chief Admin can create another Chief Admin',
//       });
//       return;
//     }

//     // ------------------------------------------------------------------------
//     // HASH PASSWORD
//     // ------------------------------------------------------------------------
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // ------------------------------------------------------------------------
//     // CREATE USER
//     // ------------------------------------------------------------------------
//     const newUser = await User.create({
//       name: name.trim(),
//       email: normalizedEmail,
//       password: hashedPassword,
//       role: assignedRole,
//       isActive: true,
//     });

//     // ------------------------------------------------------------------------
//     // RESPONSE
//     // ------------------------------------------------------------------------
//     res.status(201).json({
//       message: 'Staff member created successfully',
//       user: {
//         id: newUser.id,
//         name: newUser.name,
//         email: newUser.email,
//         role: newUser.role,
//         isActive: newUser.isActive,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
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

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            res.status(409).json({ message: 'A staff member with that email already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Validate role — default to 'staff' if not provided or invalid
        const allowedRoles = ['chief_admin', 'admin', 'staff'];
        const assignedRole = allowedRoles.includes(role) ? role : 'staff';

        const newUser = await User.create({
            name,
            email:    email.toLowerCase().trim(),
            password: hashedPassword,
            role:     assignedRole,
            isActive: true,
        });

        res.status(201).json({
            message: 'Staff member created successfully',
            user: {
                id:       newUser.id,
                name:     newUser.name,
                email:    newUser.email,
                role:     newUser.role,
                isActive: newUser.isActive,
            },
        });
    } catch (error) {
        next(error);
    }
};





// ============================================================================
// @desc   LOGIN USER
// @route  POST  /auth/login
// @access Public
// Triggered by the "Sign In" button on the login page
// ============================================================================
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        // Validate that both fields are provided
        if (!email || !password) {
            res.status(400).json({ message: 'Email, and password are required' });
            return;
        }

        // Look up the user by email: include password field since it's needed for comparison
        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

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
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Update the lastLoginAt timestamp to track when this staff member last signed in
        await user.update({ lastLoginAt: new Date() });

        // Generate a JWT token
        // Create token payload
        const payload = { id: user.id, name: user.name, email: user.email, role: user.role }
        // Create JWT Token
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY as string, { expiresIn: '7d' })

        console.log('YOU`RE IN');
        

        // Return the token and user info - the frontend uses name and userType for the sidebar
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
}
































// export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { name, email, password, role } = req.body;
//         const caller = (req as any).user; // From auth middleware

//         // Validate that all required fields are provided
//         if (!name || !email || !password) {
//             res.status(400).json({ message: 'Name, email, and password are required' });
//             return;
//         }

//         // Validate password length
//         if (password.length < 8) {
//             res.status(400).json({ message: 'Password must be at least 8 characters' })
//             return;
//         }

//         // Check if a user with this email already exists in the database
//         const existingUser = await User.findOne({ where: { email } })
//         if (existingUser) {
//             res.status(409).json({ message: 'A staff member with that email already exists' });
//             return;
//         }

//         // Hash the password with bcrypt before saving
//         const hashedPassword = await bcrypt.hash(password, 10)

//         // Validate role - default to 'staff' if not provided or invalid
//         const allowedRoles = ['chief_admin', 'admin', 'staff'];
//         let assignedRole = allowedRoles.includes(role) ? role : 'staff';

//         // Only chief_admin can create another account/user
//          if (role && allowedRoles.includes(role)) {
//             if (role === 'chief_admin') {
//                 if (!caller || caller.role !== 'chief_admin') {
//                     res.status(403).json({ message: 'Only Chief Admin can create another Chief Admin' });
//                     return;
//                 }
//             }
//             assignedRole = role;
//         }

//         // Create the new user in the db 
//         const newUser = await User.create({
//             name,
//             email: email.toLowerCase().trim(),
//             password: hashedPassword,
//             role: assignedRole,
//             isActive: true
//         });

//         // Return the new user without the password field
//         res.status(201).json({
//             message: 'Staff member created successfully',
//             user: {
//                 id: newUser.id,
//                 name: newUser.name,
//                 email: newUser.email,
//                 role: newUser.role,
//                 isActive: newUser.isActive,
//             }
//         });
//     } catch (error) {
//         next(error);
//     }
// }