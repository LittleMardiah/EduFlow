import dotenv from "dotenv";
dotenv.config();
// @ts-nocheck
const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRATION: parseInt(process.env.JWT_EXPIRATION_SECONDS || '86400'),
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
