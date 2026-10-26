import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import User from './src/models/User.model.js';
import readline from 'node:readline/promises';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

try {
  const email = (await rl.question('Enter your existing account email: ')).trim().toLowerCase();
  const password = await rl.question('Enter your NEW password (at least 6 characters): ');

  if (!email || password.length < 6) {
    throw new Error('Email is required and password must have at least 6 characters.');
  }

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('No account found for that email.');
  }

  user.password = await bcrypt.hash(password, 10);
  await user.save();

  console.log('Password reset successfully. You can now log in.');
} catch (error) {
  console.error('Password reset failed:', error.message);
} finally {
  await mongoose.disconnect().catch(() => {});
  rl.close();
}
