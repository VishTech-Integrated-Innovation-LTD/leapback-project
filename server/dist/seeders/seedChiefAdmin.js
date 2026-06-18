"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = __importDefault(require("../models/user.model"));
const seedChiefAdmin = async () => {
    try {
        const { CHIEF_ADMIN_EMAIL, CHIEF_ADMIN_PASSWORD, CHIEF_ADMIN_NAME, } = process.env;
        if (!CHIEF_ADMIN_EMAIL || !CHIEF_ADMIN_PASSWORD || !CHIEF_ADMIN_NAME) {
            throw new Error('Missing CHIEF_ADMIN env variables');
        }
        const existingAdmin = await user_model_1.default.findOne({
            where: { role: 'chief_admin' },
        });
        if (existingAdmin) {
            console.log('Chief Admin already exists');
            process.exit(0);
        }
        const hashedPassword = await bcrypt_1.default.hash(CHIEF_ADMIN_PASSWORD, 10);
        await user_model_1.default.create({
            name: CHIEF_ADMIN_NAME,
            email: CHIEF_ADMIN_EMAIL,
            password: hashedPassword,
            role: 'chief_admin',
            isActive: true,
        });
        console.log('Chief Admin created successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};
seedChiefAdmin();
//# sourceMappingURL=seedChiefAdmin.js.map