
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import User from './src/models/User.model.js';

const rl = readline.createInterface({input: stdin, output: stdout});

try {
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL;

  if (!mongoUri) {
    throw new Error(
      'MongoDB URI not found. Check the variable name in server/.env.'
    );
  }

  const email = String(
    process.argv[2] || await rl.question('Account email: ')
  ).trim().toLowerCase();

  const password = await rl.question(
    'Enter your new app login password (minimum 6 characters): '
  );

  if (password.length < 6) {
    throw new Error('Password must contain at least 6 characters.');
  }

  await mongoose.connect(mongoUri);

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error(
      'Account not found in the database selected by this MongoDB URI.'
    );
  }

  user.password = await bcrypt.hash(password, 10);
  await user.save();

  console.log(`Password reset successfully for ${user.email}.`);
  console.log('Return to the app and log in with your new password.');
} catch (error) {
  console.error('Password reset failed:', error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await mongoose.disconnect().catch(() => {});
}
