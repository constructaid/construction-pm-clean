/**
 * Registration API Endpoint
 * Handles user registration with role-based account creation
 * POST /api/register
 */
import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../lib/db/mongodb';
import { UserRole, UserStatus } from '../../lib/db/schemas/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Request body interface
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  companyName?: string;
  trade?: string; // For subcontractors
}

// Validation helper
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return password && password.length >= 8;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body: RegisterRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.role) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    if (!validateEmail(body.email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid email format'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (!validatePassword(body.password)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Password must be at least 8 characters'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(body.role)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid role'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      email: body.email.toLowerCase()
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'An account with this email already exists'
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 12);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user document
    const newUser = {
      email: body.email.toLowerCase().trim(),
      passwordHash,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      phone: body.phone?.trim() || null,
      role: body.role,
      status: UserStatus.PENDING_VERIFICATION,
      company: body.companyName ? {
        name: body.companyName.trim()
      } : null,
      trade: body.role === UserRole.SUB && body.trade ? body.trade : null,
      emailVerified: false,
      emailVerificationToken,
      preferences: {
        timezone: 'America/New_York',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      },
      projects: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert user into database
    const result = await usersCollection.insertOne(newUser);

    // TODO: Send verification email
    // This would typically use a service like SendGrid, AWS SES, or Nodemailer
    // For now, we'll just log the verification token
    console.log(`Verification token for ${body.email}: ${emailVerificationToken}`);

    // Return success response (without sensitive data)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: {
          userId: result.insertedId.toString(),
          email: body.email,
          firstName: body.firstName,
          role: body.role
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Registration error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error. Please try again later.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
