
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import { generateToken } from '../utils/jwt.utils.js';

const normalizeEmail = email =>
  String(email ?? '').trim().toLowerCase();

const createAuthError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const register = async (name, email, password) => {
  const normalizedName = String(name ?? '').trim();
  const normalizedEmail = normalizeEmail(email);
  const plainPassword = String(password ?? '');

  if (!normalizedName || !normalizedEmail || !plainPassword) {
    throw createAuthError(
      'Name, email, and password are required.',
      400,
    );
  }

  if (plainPassword.length < 6) {
    throw createAuthError(
      'Password must be at least 6 characters.',
      400,
    );
  }

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw createAuthError(
      'Email already registered. Please log in.',
      409,
    );
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password: hashedPassword,
  });

  return {
    token: generateToken(user),
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  };
};

export const emailLogin = async (email, password) => {
  const normalizedEmail = normalizeEmail(email);
  const plainPassword = String(password ?? '');

  if (!normalizedEmail || !plainPassword) {
    throw createAuthError(
      'Email and password are required.',
      400,
    );
  }

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user || user.password == null) {
    throw createAuthError(
      'Invalid email or password.',
      401,
    );
  }

  const storedPassword = String(user.password);
  let passwordMatches = false;
  let needsPasswordUpgrade = false;

  try {
    if (/^\$2[aby]\$\d{2}\$/.test(storedPassword)) {
      passwordMatches = await bcrypt.compare(
        plainPassword,
        storedPassword,
      );
    } else {
      // Compatibility for accounts with legacy plain-text passwords.
      passwordMatches = plainPassword === storedPassword;
      needsPasswordUpgrade = passwordMatches;
    }
  } catch {
    passwordMatches = false;
  }

  if (!passwordMatches) {
    throw createAuthError(
      'Invalid email or password.',
      401,
    );
  }

  // Securely upgrade a legacy password after successful verification.
  if (needsPasswordUpgrade) {
    user.password = await bcrypt.hash(plainPassword, 10);
  }

  user.lastLogin = new Date();
  await user.save();

  return {
    token: generateToken(user),
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  };
};

export const getUserProfile = async userId => {
  const user = await User.findById(userId).select(
    '-__v -password',
  );

  if (!user) {
    throw createAuthError('User not found.', 404);
  }

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
};
