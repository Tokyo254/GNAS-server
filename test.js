// Create a simple test script: test-email.js
require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmail() {
  console.log('Testing SendGrid email...');
  
  const result = await emailService.sendEmail(
    'osogohkeith@gmail.com',
    'Test Email from SendGrid',
    'This is a test email from SendGrid.',
    '<h1>Test Email</h1><p>This is a test email from SendGrid.</p>'
  );
  
  console.log('Result:', result);
}

testEmail();