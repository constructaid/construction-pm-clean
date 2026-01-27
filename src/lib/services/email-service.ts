/**
 * Email Service
 *
 * Handles sending transactional emails (password reset, verification, etc.)
 * Supports multiple providers: SMTP, SendGrid, AWS SES
 */

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'ses' | 'console';
  from: string;

  // SMTP config
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };

  // SendGrid config
  sendgrid?: {
    apiKey: string;
  };

  // AWS SES config
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  /**
   * Send an email
   */
  async sendEmail(message: EmailMessage): Promise<void> {
    console.log(`[EMAIL] Sending email to ${message.to}`);
    console.log(`[EMAIL] Subject: ${message.subject}`);

    switch (this.config.provider) {
      case 'smtp':
        await this.sendViaSmtp(message);
        break;

      case 'sendgrid':
        await this.sendViaSendGrid(message);
        break;

      case 'ses':
        await this.sendViaSES(message);
        break;

      case 'console':
      default:
        await this.sendViaConsole(message);
        break;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, appUrl: string): Promise<void> {
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    const message: EmailMessage = {
      to: email,
      subject: 'Reset Your ConstructAid Password',
      text: this.getPasswordResetTextEmail(resetUrl),
      html: this.getPasswordResetHtmlEmail(resetUrl),
    };

    await this.sendEmail(message);
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, verificationToken: string, appUrl: string): Promise<void> {
    const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;

    const message: EmailMessage = {
      to: email,
      subject: 'Verify Your ConstructAid Email',
      text: this.getVerificationTextEmail(verifyUrl),
      html: this.getVerificationHtmlEmail(verifyUrl),
    };

    await this.sendEmail(message);
  }

  /**
   * Send via SMTP
   */
  private async sendViaSmtp(message: EmailMessage): Promise<void> {
    if (!this.config.smtp) {
      throw new Error('SMTP configuration not provided');
    }

    // This would use nodemailer in production
    console.log('[EMAIL] SMTP email sent (simulated)');
    console.log(`[EMAIL] To: ${message.to}`);
    console.log(`[EMAIL] From: ${this.config.from}`);
    console.log(`[EMAIL] Subject: ${message.subject}`);
    console.log(`[EMAIL] Body:\n${message.text}`);
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(message: EmailMessage): Promise<void> {
    if (!this.config.sendgrid) {
      throw new Error('SendGrid configuration not provided');
    }

    // This would use @sendgrid/mail in production
    console.log('[EMAIL] SendGrid email sent (simulated)');
  }

  /**
   * Send via AWS SES
   */
  private async sendViaSES(message: EmailMessage): Promise<void> {
    if (!this.config.ses) {
      throw new Error('SES configuration not provided');
    }

    // This would use AWS SDK in production
    console.log('[EMAIL] AWS SES email sent (simulated)');
  }

  /**
   * Send via console (development only)
   */
  private async sendViaConsole(message: EmailMessage): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('EMAIL (Development Mode)');
    console.log('='.repeat(60));
    console.log(`To: ${message.to}`);
    console.log(`From: ${this.config.from}`);
    console.log(`Subject: ${message.subject}`);
    console.log('='.repeat(60));
    console.log(message.text);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Get password reset email (text version)
   */
  private getPasswordResetTextEmail(resetUrl: string): string {
    return `
Hello,

You requested to reset your password for your ConstructAid account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The ConstructAid Team
    `.trim();
  }

  /**
   * Get password reset email (HTML version)
   */
  private getPasswordResetHtmlEmail(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin-bottom: 20px;">Reset Your Password</h1>
    <p style="margin-bottom: 20px;">Hello,</p>
    <p style="margin-bottom: 20px;">You requested to reset your password for your ConstructAid account.</p>
    <p style="margin-bottom: 30px;">Click the button below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
    </div>
    <p style="margin-bottom: 20px; font-size: 14px; color: #666;">
      Or copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #3498db; word-break: break-all;">${resetUrl}</a>
    </p>
    <p style="margin-bottom: 20px; font-size: 14px; color: #666;">
      <strong>This link will expire in 1 hour.</strong>
    </p>
    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
    <p style="font-size: 14px; color: #666;">
      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
    </p>
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      Best regards,<br>
      The ConstructAid Team
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get verification email (text version)
   */
  private getVerificationTextEmail(verifyUrl: string): string {
    return `
Hello,

Thank you for signing up for ConstructAid!

Please verify your email address by clicking the link below:
${verifyUrl}

This link will expire in 24 hours.

If you didn't create an account with ConstructAid, please ignore this email.

Best regards,
The ConstructAid Team
    `.trim();
  }

  /**
   * Get verification email (HTML version)
   */
  private getVerificationHtmlEmail(verifyUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin-bottom: 20px;">Welcome to ConstructAid!</h1>
    <p style="margin-bottom: 20px;">Hello,</p>
    <p style="margin-bottom: 20px;">Thank you for signing up for ConstructAid!</p>
    <p style="margin-bottom: 30px;">Please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email</a>
    </div>
    <p style="margin-bottom: 20px; font-size: 14px; color: #666;">
      Or copy and paste this link into your browser:<br>
      <a href="${verifyUrl}" style="color: #27ae60; word-break: break-all;">${verifyUrl}</a>
    </p>
    <p style="margin-bottom: 20px; font-size: 14px; color: #666;">
      <strong>This link will expire in 24 hours.</strong>
    </p>
    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
    <p style="font-size: 14px; color: #666;">
      If you didn't create an account with ConstructAid, please ignore this email.
    </p>
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      Best regards,<br>
      The ConstructAid Team
    </p>
  </div>
</body>
</html>
    `.trim();
  }
}

/**
 * Get email service instance from environment config
 */
export function getEmailService(): EmailService {
  const provider = (process.env.EMAIL_PROVIDER || 'console') as EmailConfig['provider'];

  const config: EmailConfig = {
    provider,
    from: process.env.EMAIL_FROM || 'noreply@constructaid.com',
  };

  // Configure based on provider
  if (provider === 'smtp') {
    config.smtp = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    };
  } else if (provider === 'sendgrid') {
    config.sendgrid = {
      apiKey: process.env.SENDGRID_API_KEY || '',
    };
  } else if (provider === 'ses') {
    config.ses = {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    };
  }

  return new EmailService(config);
}
