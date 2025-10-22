/**
 * User Schema for MongoDB
 * Defines the structure for user accounts with role-based access control
 */

export enum UserRole {
  OWNER = 'OWNER',
  ARCHITECT = 'ARCHITECT',
  GC = 'GC',
  SUB = 'SUB',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  PENDING_INVITATION = 'PENDING_INVITATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE'
}

export interface User {
  _id: string; // MongoDB ObjectId
  email: string;
  passwordHash: string;

  // Basic Information
  firstName: string;
  lastName: string;
  phone?: string;

  // Role & Permissions
  role: UserRole;
  secondaryRoles?: UserRole[]; // Optional: Users can have multiple roles
  status: UserStatus;

  // Company Information
  company?: {
    name: string;
    address?: string;
    phone?: string;
    license?: string; // For contractors
    insuranceInfo?: {
      provider: string;
      policyNumber: string;
      expirationDate: Date;
    };
  };

  // Trade/Specialty (for Subcontractors)
  trade?: string; // e.g., "Electrical", "Plumbing", "HVAC"

  // Authentication & Security
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;

  // OAuth
  oauthProvider?: 'google' | 'microsoft';
  oauthId?: string;

  // Preferences
  preferences?: {
    timezone?: string;
    notifications?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };

  // Project Associations
  projects?: string[]; // Array of project IDs user has access to
  invitedBy?: string; // User ID of person who invited this user

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB Schema definition for use with mongoose or native driver
 */
export const UserSchema = {
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },

  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },

  role: { type: String, enum: Object.values(UserRole), required: true },
  secondaryRoles: [{ type: String, enum: Object.values(UserRole) }],
  status: { type: String, enum: Object.values(UserStatus), default: UserStatus.PENDING_VERIFICATION },

  company: {
    name: String,
    address: String,
    phone: String,
    license: String,
    insuranceInfo: {
      provider: String,
      policyNumber: String,
      expirationDate: Date
    }
  },

  trade: String,

  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,

  oauthProvider: { type: String, enum: ['google', 'microsoft'] },
  oauthId: String,

  preferences: {
    timezone: { type: String, default: 'America/New_York' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },

  projects: [{ type: String }], // Array of project ObjectIds
  invitedBy: String, // User ObjectId

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Indexes for performance
export const UserIndexes = [
  { email: 1 }, // Unique index for login
  { role: 1, status: 1 }, // For role-based queries
  { 'company.name': 1 }, // For company search
  { projects: 1 }, // For project-based user lookup
];
