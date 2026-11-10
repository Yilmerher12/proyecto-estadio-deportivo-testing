// src/repositories/users.repository.ts
import crypto from 'crypto';
import { User, IUser } from '../models/user.model';

export async function findById(id: string): Promise<IUser | null> {
  return User.findById(id);
}

export async function findByIdWithPassword(id: string): Promise<IUser | null> {
  return User.findById(id).select('+password');
}

export async function findByEmail(email: string): Promise<IUser | null> {
  return User.findOne({ email });
}

export async function findByEmailWithPassword(email: string): Promise<IUser | null> {
  return User.findOne({ email }).select('+password');
}

export async function create(data: {
  name: string;
  email: string;
  password: string;
}): Promise<IUser> {
  return User.create(data);
}

export async function updateAvatar(
  id: string,
  avatarUrl: string,
  avatarPublicId: string,
): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    id,
    { avatarUrl, avatarPublicId },
    { new: true },
  );
}

export async function saveResetToken(
  id: string,
  rawToken: string,
  expiresAt: Date,
): Promise<void> {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  await User.findByIdAndUpdate(id, {
    resetPasswordToken: hashedToken,
    resetPasswordExpiresAt: expiresAt,
  });
}

export async function findByResetToken(rawToken: string): Promise<IUser | null> {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpiresAt +password');
}

export async function clearResetToken(id: string): Promise<void> {
  await User.findByIdAndUpdate(id, {
    $unset: { resetPasswordToken: '', resetPasswordExpiresAt: '' },
  });
}

export async function updatePassword(id: string, hashedPassword: string): Promise<void> {
  await User.findByIdAndUpdate(id, { password: hashedPassword });
}
