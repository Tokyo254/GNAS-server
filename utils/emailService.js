// emailService.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Test email configuration
const verifyEmailConfig = async () => {
  try {
    // Test by sending a simple email to yourself
    const testEmail = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL || 'admin@yourdomain.com',
      subject: 'Email Service Test',
      text: 'Email service is configured correctly!'
    });
    console.log('✅ Email service is ready to send messages');
    return true;
  } catch (error) {
    console.log('❌ Email configuration error:', error);
    return false;
  }
};

// Verify on startup
verifyEmailConfig();

const sendEmail = async (to, subject, html, text = null) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || subject // Fallback to subject if no text provided
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return false;
    }

    console.log('✅ Email sent:', data.id);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.CLIENT_URL || 'https://gnas-h3me.vercel.app'}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Verification</h1>
        </div>
        <div class="content">
          <h2>Hello ${user.firstName},</h2>
          <p>Welcome to Press Release Portal as a <strong>${user.role}</strong>!</p>
          <p>Please click the button below to verify your email address and activate your account:</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you did not create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Press Release Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `Hello ${user.firstName}, Welcome to Press Release Portal as a ${user.role}! Please verify your email by clicking: ${verificationUrl}`;
  
  return await sendEmail(user.email, 'Verify Your Email - Press Release Portal', html, text);
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.CLIENT_URL || 'https://gnas-h3me.vercel.app'}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hello ${user.firstName},</h2>
          <p>You requested to reset your password for your <strong>${user.role}</strong> account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you did not request this password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Press Release Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `Hello ${user.firstName}, You requested to reset your password. Click here to reset: ${resetUrl}`;
  
  return await sendEmail(user.email, 'Password Reset Request - Press Release Portal', html, text);
};

const sendJournalistApprovalEmail = async (user) => {
  const loginUrl = `${process.env.CLIENT_URL || 'https://gnas-h3me.vercel.app'}/login`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #4facfe; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Approved!</h1>
        </div>
        <div class="content">
          <h2>Congratulations ${user.firstName}!</h2>
          <p>Your journalist account has been approved and is now active.</p>
          <p>You can now access all the features of the Press Release Portal.</p>
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to Your Account</a>
          </div>
          <p>We're excited to have you as part of our trusted network of journalists!</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Press Release Portal. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `Congratulations ${user.firstName}! Your journalist account has been approved. Login at: ${loginUrl}`;
  
  return await sendEmail(user.email, 'Journalist Account Approved - Press Release Portal', html, text);
};

const sendApprovalNotificationEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background: #4CAF50; 
                color: white; 
                text-decoration: none; 
                border-radius: 4px; 
                margin: 20px 0;
            }
            .footer { 
                text-align: center; 
                padding: 20px; 
                color: #666; 
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Account Approved!</h1>
            </div>
            <div class="content">
                <p>Dear ${user.firstName} ${user.lastName},</p>
                
                <p>We are pleased to inform you that your account has been approved by our administration team.</p>
                
                <p>You can now login to your account and start using all the features available to you.</p>
                
                <a href="${process.env.CLIENT_URL || 'https://gnas-h3me.vercel.app'}/login" class="button">Login to Your Account</a>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                
                <p>Best regards,<br>The Team</p>
            </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `Dear ${user.firstName}, your account has been approved. Login at: ${process.env.CLIENT_URL || 'https://gnas-h3me.vercel.app'}/login`;

  return await sendEmail(user.email, 'Your Account Has Been Approved!', html, text);
};

const sendEndorsementApprovalRequest = async (user) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourdomain.com';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .user-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
            .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background: #4CAF50; 
                color: white; 
                text-decoration: none; 
                border-radius: 4px; 
                margin: 10px 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Endorsement Approval Required</h1>
            </div>
            <div class="content">
                <p>A new user has registered with endorsement and requires your approval.</p>
                
                <div class="user-info">
                    <strong>User Details:</strong><br>
                    Name: ${user.firstName} ${user.lastName}<br>
                    Email: ${user.email}<br>
                    Publication: ${user.publication || 'N/A'}<br>
                    Country: ${user.country || 'N/A'}<br>
                    Registration Date: ${new Date().toLocaleDateString()}
                </div>
                
                <p>Please review this registration in the admin panel.</p>
                
                <p>This user has already verified their email address and is awaiting admin approval.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `New endorsement approval required for: ${user.firstName} ${user.lastName} (${user.email})`;

  return await sendEmail(adminEmail, 'New Endorsement Registration Requires Approval', html, text);
};

const sendInviteCodeEmail = async (email, inviteCode, inviterName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .invite-code { 
                background: white; 
                padding: 15px; 
                margin: 15px 0; 
                text-align: center; 
                font-size: 24px; 
                font-weight: bold; 
                border: 2px dashed #2196F3;
            }
            .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background: #2196F3; 
                color: white; 
                text-decoration: none; 
                border-radius: 4px; 
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>You're Invited!</h1>
            </div>
            <div class="content">
                <p>Dear User,</p>
                
                <p>You have been invited by ${inviterName} to join ${process.env.APP_NAME || 'our platform'}.</p>
                
                <p>Use the following invite code to complete your registration:</p>
                
                <div class="invite-code">${inviteCode}</div>
                
                <p>This code will expire on ${new Date(inviteCode.expiresAt).toLocaleDateString()}.</p>
                
                <a href="${process.env.CLIENT_URL || 'https://gnas-h3me.vercel.app'}/register?invite=true" class="button">Complete Registration</a>
                
                <p>If you did not expect this invitation, please ignore this email.</p>
                
                <p>Best regards,<br>The Team</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `You've been invited by ${inviterName}. Use invite code: ${inviteCode} at ${process.env.CLIENT_URL || 'https://gnas-h3me.vercel.app'}/register`;

  return await sendEmail(email, `You've Been Invited to Join ${process.env.APP_NAME || 'Our Platform'}`, html, text);
};

const sendCommsApprovalEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8B5CF6;">Welcome to PR Portal!</h2>
      <p>Dear ${user.firstName},</p>
      <p>We're excited to inform you that your Communications Professional account has been approved.</p>
      <p>You can now access all features of the PR Portal platform:</p>
      <ul>
        <li>Create and manage press releases</li>
        <li>Upload audio releases</li>
        <li>Access analytics and insights</li>
        <li>Connect with journalists</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL || 'https://gnas-h3me.vercel.app'}/login" 
           style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Login to Your Account
        </a>
      </div>
      <p>If you have any questions, please contact our support team.</p>
      <br>
      <p>Best regards,<br>The PR Portal Team</p>
    </div>
  `;

  const text = `Dear ${user.firstName}, your Communications Professional account has been approved. Login at: ${process.env.CLIENT_URL || 'https://gnas-h3me.vercel.app'}/login`;

  return await sendEmail(user.email, 'Your Comms Account Has Been Approved - PR Portal', html, text);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendJournalistApprovalEmail,
  sendApprovalNotificationEmail,
  sendEndorsementApprovalRequest,
  sendInviteCodeEmail,
  sendCommsApprovalEmail
};