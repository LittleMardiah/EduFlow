import { Request, Response } from 'express';
import { registerSchema, loginSchema } from '../schemas/auth.schemas';
import { register, login } from '../services/auth.service';
import logger from '../utils/logger';

export async function registerHandler(req: Request, res: Response) {
  try {
    const { email, password, first_name, last_name, role } = registerSchema.parse(req.body);
    
    // register() returns { success, data: { user } }
    const result = await register(email, password, first_name, last_name, role);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error?.message || 'Registration failed' },
      });
    }
    
    // Extract user from result.data
    const { user } = result.data;
    const { password_hash, ...userWithoutPassword } = user;
    
    // Send response WITHOUT double wrap
    res.status(201).json({
      success: true,
      data: { user: userWithoutPassword },
    });
  } catch (error: any) {
    logger.error(`Register error: ${error.message}`);
    res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // login() returns { success, data: { user, token } }
    const result = await login(email, password);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: { message: result.error?.message || 'Login failed' },
      });
    }
    
    const { user, token } = result.data;
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: { user: userWithoutPassword, token },
    });
  } catch (error: any) {
    logger.error(`Login error: ${error.message}`);
    res.status(401).json({
      success: false,
      error: { message: error.message },
    });
  }
}

export async function verifyHandler(req: Request, res: Response) {
  res.json({
    success: true,
    data: { user: req.user },
  });
}

export async function logoutHandler(req: Request, res: Response) {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}
