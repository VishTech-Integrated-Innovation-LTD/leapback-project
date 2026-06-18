import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import User from '../models/user.model';

const seedChiefAdmin = async () => {
  try {
    const {
      CHIEF_ADMIN_EMAIL,
      CHIEF_ADMIN_PASSWORD,
      CHIEF_ADMIN_NAME,
    } = process.env;

    if (!CHIEF_ADMIN_EMAIL || !CHIEF_ADMIN_PASSWORD || !CHIEF_ADMIN_NAME) {
      throw new Error('Missing CHIEF_ADMIN env variables');
    }

    const existingAdmin = await User.findOne({
      where: { role: 'chief_admin' },
    });

    if (existingAdmin) {
      console.log('Chief Admin already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(
      CHIEF_ADMIN_PASSWORD,
      10
    );

    await User.create({
      name: CHIEF_ADMIN_NAME,
      email: CHIEF_ADMIN_EMAIL,
      password: hashedPassword,
      role: 'chief_admin',
      isActive: true,
    });

    console.log('Chief Admin created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedChiefAdmin();