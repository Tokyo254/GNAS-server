const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test email configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Press Release Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log('✅ Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
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
  
  return await sendEmail(user.email, 'Verify Your Email - Press Release Portal', html);
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
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
  
  return await sendEmail(user.email, 'Password Reset Request - Press Release Portal', html);
};

const sendJournalistApprovalEmail = async (user) => {
  const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`;
  
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
  
  return await sendEmail(user.email, 'Journalist Account Approved - Press Release Portal', html);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendJournalistApprovalEmail
};

exports.sendApprovalNotificationEmail = async (user) => {
  try {
    const transporter = nodemailer.createTransport({
      // ... your email config ...
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Your Account Has Been Approved!',
      html: `
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
                    
                    <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Your Account</a>
                    
                    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                    
                    <p>Best regards,<br>The Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Approval notification email sent to: ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending approval notification email:', error);
    return false;
  }
};

// Send admin notification for endorsement approval
exports.sendEndorsementApprovalRequest = async (user) => {
  try {
    const transporter = nodemailer.createTransport({
      // ... your email config ...
    });

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourdomain.com';

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: adminEmail,
      subject: 'New Endorsement Registration Requires Approval',
      html: `
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
                    
                    <p>Please review this registration in the admin panel:</p>
                    
                    <a href="${process.env.ADMIN_URL}/users/pending" class="button">Review Pending Users</a>
                    
                    <p>This user has already verified their email address and is awaiting admin approval.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Endorsement approval request sent to admin for user: ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending endorsement approval request:', error);
    return false;
  }
};

// Send invite code email
exports.sendInviteCodeEmail = async (email, inviteCode, inviterName) => {
  try {
    const transporter = nodemailer.createTransport({
      // ... your email config ...
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `You've Been Invited to Join ${process.env.APP_NAME || 'Our Platform'}`,
      html: `
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
                    
                    <a href="${process.env.FRONTEND_URL}/register?invite=true" class="button">Complete Registration</a>
                    
                    <p>If you did not expect this invitation, please ignore this email.</p>
                    
                    <p>Best regards,<br>The Team</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Invite code email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending invite code email:', error);
    return false;
  }
};