import { z } from 'zod';
import type { 
  ValidationResult
} from '../types';

// Zod schemas for validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Display name can only contain letters, numbers, spaces, underscores, and hyphens'),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const profileSchema = z.object({
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Display name can only contain letters, numbers, spaces, underscores, and hyphens'),
  bio: z.string()
    .max(200, 'Bio must be less than 200 characters')
    .optional(),
  photoURL: z.string().url('Invalid photo URL').optional().or(z.literal('')),
});

export const messageContentSchema = z.object({
  text: z.string().max(4000, 'Message must be less than 4000 characters').optional(),
  media: z.object({
    type: z.enum(['image', 'video', 'audio']),
    url: z.string().url('Invalid media URL'),
    thumbnail: z.string().url('Invalid thumbnail URL').optional(),
    duration: z.number().positive().optional(),
    dimensions: z.object({
      width: z.number().positive(),
      height: z.number().positive(),
    }).optional(),
    size: z.number().positive('File size must be positive'),
    fileName: z.string().min(1, 'File name is required'),
  }).optional(),
  file: z.object({
    type: z.enum(['document', 'archive', 'other']),
    url: z.string().url('Invalid file URL'),
    fileName: z.string().min(1, 'File name is required'),
    size: z.number().positive('File size must be positive'),
    mimeType: z.string().min(1, 'MIME type is required'),
  }).optional(),
}).refine(data => data.text || data.media || data.file, {
  message: 'Message must contain text, media, or file content',
});

export const groupInfoSchema = z.object({
  name: z.string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Group description must be less than 500 characters')
    .optional(),
  photoURL: z.string().url('Invalid photo URL').optional().or(z.literal('')),
  settings: z.object({
    allowMemberInvites: z.boolean().default(true),
    allowMediaSharing: z.boolean().default(true),
    muteNotifications: z.boolean().default(false),
    disappearingMessages: z.boolean().default(false),
    disappearingMessagesDuration: z.number().positive().optional(),
  }).optional(),
});

// Validation functions
export const validateLogin = (data: unknown): ValidationResult => {
  try {
    loginSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

export const validateRegister = (data: unknown): ValidationResult => {
  try {
    registerSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

export const validateProfile = (data: unknown): ValidationResult => {
  try {
    profileSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

export const validateMessageContent = (data: unknown): ValidationResult => {
  try {
    messageContentSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

export const validateGroupInfo = (data: unknown): ValidationResult => {
  try {
    groupInfoSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include numbers');
  }

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include special characters');
  }

  return { score, feedback };
};

// File validation
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const getFileTypeCategory = (mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
  return 'other';
};

// URL validation
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Sanitization functions
export const sanitizeDisplayName = (name: string): string => {
  return name.trim().replace(/[^\w\s-]/g, '').substring(0, 50);
};

export const sanitizeMessage = (message: string): string => {
  return message.trim().substring(0, 4000);
};

export const sanitizeGroupName = (name: string): string => {
  return name.trim().substring(0, 100);
};

// UUID validation
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};