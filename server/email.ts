import sgMail from '@sendgrid/mail';
import { EmailType } from '@shared/mysql-schema';
import crypto from 'crypto';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL =
  process.env.FROM_EMAIL ||
  'support@ststaxrepair.org'; // domain-based sender improves deliverability (esp. Yahoo)
const FROM_NAME = process.env.FROM_NAME || 'STS Tax Repair';

export interface OfficeBranding {
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  replyToEmail?: string;
  replyToName?: string;
}

const DEFAULT_BRANDING: OfficeBranding = {
  companyName: 'STS Tax Repair',
  logoUrl: 'https://ststaxrepair.org/assets/sts-logo.png',
  primaryColor: '#1a4d2e',
  secondaryColor: '#4CAF50',
};

// Determine the app URL based on environment
// Priority: APP_URL env var > Render URL > production domain > Replit dev domain > localhost
const APP_URL = process.env.APP_URL 
  || process.env.RENDER_EXTERNAL_URL
  || (process.env.NODE_ENV === 'production' ? 'https://ststaxrepair.org' : null)
  || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null)
  || 'http://localhost:5000';

// Startup diagnostics for email configuration
console.log(`[EMAIL] ============================================`);
console.log(`[EMAIL] EMAIL SYSTEM STARTUP DIAGNOSTICS`);
console.log(`[EMAIL] ============================================`);
console.log(`[EMAIL] APP_URL: ${APP_URL}`);
console.log(`[EMAIL] FROM_EMAIL: ${FROM_EMAIL}`);
console.log(`[EMAIL] SENDGRID_API_KEY configured: ${SENDGRID_API_KEY ? 'YES (key starts with: ' + SENDGRID_API_KEY.substring(0, 10) + '...)' : 'NO - EMAILS WILL NOT BE SENT!'}`);
console.log(`[EMAIL] NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`[EMAIL] RENDER_EXTERNAL_URL: ${process.env.RENDER_EXTERNAL_URL || 'not set'}`);
console.log(`[EMAIL] ============================================`);

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log(`[EMAIL] SendGrid API key has been set successfully`);
} else {
  console.error(`[EMAIL] WARNING: No SendGrid API key found! Password reset and notification emails will NOT work.`);
  console.error(`[EMAIL] Please set the SENDGRID_API_KEY environment variable.`);
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  branding?: OfficeBranding;
  category?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const fromName = params.branding?.replyToName || FROM_NAME;
  
  console.log(`[EMAIL] Attempting to send email to: ${params.to}, subject: ${params.subject}`);
  console.log(`[EMAIL] SendGrid API key configured: ${SENDGRID_API_KEY ? 'YES (length: ' + SENDGRID_API_KEY.length + ')' : 'NO'}`);
  console.log(`[EMAIL] From email: ${FROM_EMAIL}, From name: ${fromName}`);
  
  if (!SENDGRID_API_KEY) {
    console.warn('[EMAIL] SendGrid API key not configured. Email not sent:', params.subject);
    return { success: false, error: 'SendGrid not configured' };
  }

  try {
    const msg: any = {
      to: params.to,
      from: {
        email: FROM_EMAIL,
        name: fromName,
      },
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, ''),
    };

    // Helps SendGrid reporting/deliverability tuning (esp. Yahoo/Gmail)
    if (params.category) {
      msg.categories = [params.category];
    }
    
    if (params.branding?.replyToEmail) {
      msg.replyTo = {
        email: params.branding.replyToEmail,
        name: params.branding.replyToName || params.branding.companyName,
      };
    }

    console.log(`[EMAIL] Sending via SendGrid...`);
    const [response] = await sgMail.send(msg);
    console.log(`[EMAIL] SUCCESS - Email sent to ${params.to}: ${params.subject}`);
    console.log(`[EMAIL] Response status: ${response.statusCode}`);
    
    return { 
      success: true, 
      messageId: response.headers['x-message-id'] as string 
    };
  } catch (error: any) {
    console.error('[EMAIL] SendGrid ERROR:', JSON.stringify(error.response?.body || error.message, null, 2));
    console.error('[EMAIL] Full error:', error);
    return { 
      success: false, 
      error: error.response?.body?.errors?.[0]?.message || error.message 
    };
  }
}

function getEmailTemplate(type: EmailType, data: Record<string, any>, branding?: OfficeBranding): { subject: string; html: string } {
  const brand = branding || DEFAULT_BRANDING;
  const logoUrl = brand.logoUrl || DEFAULT_BRANDING.logoUrl;
  const primaryColor = brand.primaryColor || DEFAULT_BRANDING.primaryColor;
  const secondaryColor = brand.secondaryColor || DEFAULT_BRANDING.secondaryColor;
  const companyName = brand.companyName || DEFAULT_BRANDING.companyName;
  
  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .header img { max-width: 150px; }
      .header h1 { color: #FDB913; margin: 10px 0 0 0; font-size: 24px; }
      .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
      .button { display: inline-block; background: ${secondaryColor}; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      .button:hover { background: ${primaryColor}; }
      .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none; }
      .highlight { background: #FDB913; color: ${primaryColor}; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
      .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 15px 0; }
      .info { background: #e8f5e9; border: 1px solid ${secondaryColor}; padding: 15px; border-radius: 6px; margin: 15px 0; }
    </style>
  `;

  const header = `
    <div class="header">
      <img src="${logoUrl}" alt="${companyName} Logo" style="max-width: 120px; margin-bottom: 10px;" />
      <h1>${companyName}</h1>
      <p style="color: #ffffff; margin: 5px 0 0 0;">Professional Tax Services</p>
    </div>
  `;

  const footer = `
    <div class="footer">
      <p>${companyName} | Professional Tax Services</p>
      <p>Phone: (555) 123-4567 | Email: ${brand.replyToEmail || 'support@ststaxrepair.org'}</p>
      <p style="margin-top: 15px;">This is an automated message. Please do not reply directly to this email.</p>
      <div style="margin-top: 15px; padding: 12px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; text-align: left;">
        <p style="margin: 0; font-size: 12px; color: #856404;">
          <strong>Can't find this email?</strong> Please check your Spam/Junk folder. To ensure you receive future emails from ${companyName}, add <strong>ststaxrepair@gmail.com</strong> to your contacts.
        </p>
      </div>
    </div>
  `;

  switch (type) {
    case 'password_reset':
      return {
        subject: `Reset Your Password - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>Password Reset Request</h2>
                <p>Hello ${data.firstName || 'there'},</p>
                <p>We received a request to reset your password for your ${companyName} account.</p>
                <p style="text-align: center;">
                  <a href="${data.resetLink}" class="button">Reset My Password</a>
                </p>
                <div class="warning">
                  <strong>Important:</strong> This link will expire in 1 hour for your security.
                </div>
                <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                <p>For security reasons, never share this link with anyone.</p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'email_verification':
      return {
        subject: `Verify Your Email - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>Verify Your Email Address</h2>
                <p>Hello ${data.firstName || 'there'},</p>
                <p>Thank you for creating an account with ${companyName}! To ensure the security of your account and to receive important tax updates, please verify your email address.</p>
                <p style="text-align: center;">
                  <a href="${data.verifyLink}" class="button">Verify My Email</a>
                </p>
                <div class="info">
                  <strong>Why verify?</strong><br>
                  Verifying your email ensures you receive important notifications about:
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Tax filing status updates</li>
                    <li>Document requests from your preparer</li>
                    <li>Appointment reminders</li>
                    <li>Refund notifications</li>
                    <li>E-signature requests (Form 8879)</li>
                  </ul>
                </div>
                <div class="warning">
                  <strong>Important:</strong> This verification link will expire in 24 hours.
                </div>
                <p>If you didn't create an account with us, you can safely ignore this email.</p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'welcome':
      return {
        subject: `Welcome to ${companyName}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>Welcome to ${companyName}!</h2>
                <p>Hello ${data.firstName || 'there'},</p>
                <p>Thank you for joining ${companyName}! We're excited to help you with your tax needs.</p>
                <div class="info">
                  <strong>Your Account Details:</strong><br>
                  Email: ${data.email}<br>
                  Account Type: ${data.role === 'client' ? 'Client' : 'Staff Member'}
                </div>
                <p>Here's what you can do with your account:</p>
                <ul>
                  <li>Upload and manage your tax documents securely</li>
                  <li>Track the status of your tax filing</li>
                  <li>Schedule appointments with our tax professionals</li>
                  <li>Communicate directly with your assigned preparer</li>
                  <li>Sign documents electronically (Form 8879)</li>
                </ul>
                <p style="text-align: center;">
                  <a href="${APP_URL}/client-login" class="button">Access Your Account</a>
                </p>
                <p>If you have any questions, our support team is here to help!</p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'document_request':
      return {
        subject: `Document Request - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>Document Request</h2>
                <p>Hello ${data.firstName || 'there'},</p>
                <p>We need the following documents to proceed with your tax filing:</p>
                <div class="info">
                  ${data.documents?.map((doc: string) => `<li>${doc}</li>`).join('') || '<li>Tax documents</li>'}
                </div>
                ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
                <p style="text-align: center;">
                  <a href="${APP_URL}/portal/documents" class="button">Upload Documents</a>
                </p>
                <p>Please upload these documents at your earliest convenience to avoid delays.</p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'appointment_confirmation':
      return {
        subject: `Appointment Confirmed - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>Appointment Confirmed</h2>
                <p>Hello ${data.firstName || 'there'},</p>
                <p>Your appointment has been confirmed!</p>
                <div class="info">
                  <strong>Appointment Details:</strong><br>
                  Date: ${data.date}<br>
                  Time: ${data.time}<br>
                  ${data.location ? `Location: ${data.location}<br>` : ''}
                  ${data.staffName ? `With: ${data.staffName}<br>` : ''}
                </div>
                ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
                <p>Please arrive 10 minutes early and bring any required documents.</p>
                <p style="text-align: center;">
                  <a href="${APP_URL}/portal/appointments" class="button">View Appointments</a>
                </p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'appointment_reminder':
      return {
        subject: `Appointment Reminder - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>Appointment Reminder</h2>
                <p>Hello ${data.firstName || 'there'},</p>
                <p>This is a friendly reminder about your upcoming appointment.</p>
                <div class="warning">
                  <strong>Your appointment is ${data.timeUntil || 'coming up soon'}!</strong>
                </div>
                <div class="info">
                  Date: ${data.date}<br>
                  Time: ${data.time}<br>
                  ${data.location ? `Location: ${data.location}<br>` : ''}
                </div>
                <p>Please remember to bring all required documents.</p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'payment_reminder':
      return {
        subject: `Payment Reminder - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>Payment Reminder</h2>
                <p>Hello ${data.firstName || 'there'},</p>
                <p>This is a reminder about your outstanding payment.</p>
                <div class="info">
                  <strong>Payment Details:</strong><br>
                  Amount Due: <span class="highlight">$${data.amount}</span><br>
                  Due Date: ${data.dueDate}<br>
                  Service: ${data.service || 'Tax Preparation Services'}
                </div>
                <p style="text-align: center;">
                  <a href="${APP_URL}/portal/payments" class="button">Make Payment</a>
                </p>
                <p>If you have already made this payment, please disregard this notice.</p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'payment_received':
      return {
        subject: `Payment Received - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>Payment Received</h2>
                <p>Hello ${data.firstName || 'there'},</p>
                <p>Thank you! We have received your payment.</p>
                <div class="info">
                  <strong>Payment Details:</strong><br>
                  Amount: <span class="highlight">$${data.amount}</span><br>
                  Date: ${data.date}<br>
                  Method: ${data.method || 'N/A'}<br>
                  Reference: ${data.reference || 'N/A'}
                </div>
                <p>This payment has been applied to your account.</p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'tax_filing_status':
      return {
        subject: `Tax Filing Update: ${data.status} - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>Tax Filing Status Update</h2>
                <p>Hello ${data.firstName || 'there'},</p>
                <p>There's an update on your ${data.taxYear} tax filing.</p>
                <div class="info">
                  <strong>Current Status:</strong> <span class="highlight">${data.status}</span><br>
                  Tax Year: ${data.taxYear}<br>
                  ${data.refundAmount ? `Estimated Refund: $${data.refundAmount}<br>` : ''}
                </div>
                ${data.message ? `<p>${data.message}</p>` : ''}
                <p style="text-align: center;">
                  <a href="${APP_URL}/portal" class="button">View Details</a>
                </p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'signature_request':
      return {
        subject: `Signature Required - Form 8879 - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>E-Signature Required</h2>
                <p>Hello ${data.firstName || 'there'},</p>
                <p>Your tax return is ready for filing! Please sign Form 8879 (IRS e-file Signature Authorization) to authorize electronic filing.</p>
                <div class="warning">
                  <strong>Action Required:</strong> Your signature is needed to file your return.
                </div>
                <div class="info">
                  Document: Form 8879 - IRS e-file Signature Authorization<br>
                  Tax Year: ${data.taxYear || 'Current Year'}
                </div>
                <p style="text-align: center;">
                  <a href="${APP_URL}/portal/signatures" class="button">Sign Now</a>
                </p>
                <p>Electronic signatures are legally binding and accepted by the IRS.</p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'signature_completed':
      return {
        subject: `Form 8879 Signed Successfully - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>Signature Confirmed</h2>
                <p>Hello ${data.firstName || 'there'},</p>
                <p>Thank you! Your Form 8879 has been signed successfully.</p>
                <div class="info">
                  <strong>Details:</strong><br>
                  Document: Form 8879<br>
                  Signed on: ${data.signedDate}<br>
                  Tax Year: ${data.taxYear || 'Current Year'}
                </div>
                <p>We will now proceed with filing your tax return electronically with the IRS.</p>
                <p>You will receive another notification once your return has been accepted.</p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'staff_invite':
      return {
        subject: `You're Invited to Join ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>Team Invitation</h2>
                <p>Hello,</p>
                <p>You have been invited to join the ${companyName} team as a <strong>${data.role}</strong>.</p>
                <p>${data.invitedBy ? `Invited by: ${data.invitedBy}` : ''}</p>
                <div class="warning">
                  <strong>Note:</strong> This invitation expires in 7 days.
                </div>
                <p style="text-align: center;">
                  <a href="${data.inviteLink}" class="button">Accept Invitation</a>
                </p>
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'support_ticket_created':
      return {
        subject: `Support Ticket #${data.ticketId} Created - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>Support Ticket Created</h2>
                <p>Hello ${data.firstName || 'there'},</p>
                <p>Your support ticket has been created successfully.</p>
                <div class="info">
                  <strong>Ticket Details:</strong><br>
                  Ticket #: ${data.ticketId}<br>
                  Subject: ${data.subject}<br>
                  Priority: ${data.priority || 'Normal'}
                </div>
                <p>Our support team will review your request and respond as soon as possible.</p>
                <p style="text-align: center;">
                  <a href="${APP_URL}/portal/support" class="button">View Ticket</a>
                </p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    case 'support_ticket_response':
      return {
        subject: `Response to Support Ticket #${data.ticketId} - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>New Response on Your Ticket</h2>
                <p>Hello ${data.firstName || 'there'},</p>
                <p>There's a new response on your support ticket.</p>
                <div class="info">
                  <strong>Ticket #${data.ticketId}:</strong> ${data.subject}<br>
                  Response from: ${data.respondedBy || 'Support Team'}
                </div>
                <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0;">
                  ${data.message}
                </div>
                <p style="text-align: center;">
                  <a href="${APP_URL}/portal/support" class="button">View Full Conversation</a>
                </p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };

    default:
      return {
        subject: `Notification from ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              ${header}
              <div class="content">
                <h2>Notification</h2>
                <p>Hello,</p>
                <p>${data.message || `You have a new notification from ${companyName}.`}</p>
                <p style="text-align: center;">
                  <a href="${APP_URL}/portal" class="button">Visit Portal</a>
                </p>
              </div>
              ${footer}
            </div>
          </body>
          </html>
        `
      };
  }
}

export async function sendPasswordResetEmail(
  email: string, 
  resetToken: string,
  firstName?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const resetLink = `${APP_URL}/reset-password?token=${resetToken}`;
  const template = getEmailTemplate('password_reset', { firstName, resetLink }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
    category: 'password_reset',
  });
}

export async function sendEmailVerificationEmail(
  email: string,
  verificationToken: string,
  firstName?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const verifyLink = `${APP_URL}/verify-email?token=${verificationToken}`;
  const template = getEmailTemplate('email_verification', { firstName, verifyLink }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
  });
}

export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  role: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const template = getEmailTemplate('welcome', { firstName, email, role }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
  });
}

export async function sendDocumentRequestEmail(
  email: string,
  firstName: string,
  documents: string[],
  notes?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const template = getEmailTemplate('document_request', { firstName, documents, notes }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
  });
}

export async function sendAppointmentConfirmationEmail(
  email: string,
  firstName: string,
  date: string,
  time: string,
  location?: string,
  staffName?: string,
  notes?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const template = getEmailTemplate('appointment_confirmation', { 
    firstName, date, time, location, staffName, notes 
  }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
  });
}

export async function sendPaymentReminderEmail(
  email: string,
  firstName: string,
  amount: string,
  dueDate: string,
  service?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const template = getEmailTemplate('payment_reminder', { firstName, amount, dueDate, service }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
  });
}

export async function sendPaymentReceivedEmail(
  email: string,
  firstName: string,
  amount: string,
  date: string,
  method?: string,
  reference?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const template = getEmailTemplate('payment_received', { 
    firstName, amount, date, method, reference 
  }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
  });
}

export async function sendTaxFilingStatusEmail(
  email: string,
  firstName: string,
  taxYear: string,
  status: string,
  message?: string,
  refundAmount?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const template = getEmailTemplate('tax_filing_status', { 
    firstName, taxYear, status, message, refundAmount 
  }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
  });
}

export async function sendSignatureRequestEmail(
  email: string,
  firstName: string,
  taxYear?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const template = getEmailTemplate('signature_request', { firstName, taxYear }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
  });
}

export async function sendSignatureCompletedEmail(
  email: string,
  firstName: string,
  signedDate: string,
  taxYear?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const template = getEmailTemplate('signature_completed', { firstName, signedDate, taxYear }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
  });
}

export async function sendStaffInviteEmail(
  email: string,
  role: string,
  inviteCode: string,
  invitedBy?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const inviteLink = `${APP_URL}/accept-invite?code=${inviteCode}`;
  const template = getEmailTemplate('staff_invite', { role, inviteLink, invitedBy }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
  });
}

export async function sendSupportTicketCreatedEmail(
  email: string,
  firstName: string,
  ticketId: string,
  subject: string,
  priority?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const template = getEmailTemplate('support_ticket_created', { 
    firstName, ticketId, subject, priority 
  }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
  });
}

export async function sendSupportTicketResponseEmail(
  email: string,
  firstName: string,
  ticketId: string,
  subject: string,
  message: string,
  respondedBy?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const template = getEmailTemplate('support_ticket_response', { 
    firstName, ticketId, subject, message, respondedBy 
  }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
  });
}

export async function sendTaskAssignmentEmail(
  email: string,
  firstName: string,
  taskTitle: string,
  taskDescription: string,
  dueDate?: string,
  priority?: string,
  clientName?: string,
  assignedBy?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const brand = branding || DEFAULT_BRANDING;
  const companyName = brand.companyName || DEFAULT_BRANDING.companyName;
  const logoUrl = brand.logoUrl || DEFAULT_BRANDING.logoUrl;
  const primaryColor = brand.primaryColor || DEFAULT_BRANDING.primaryColor;
  const secondaryColor = brand.secondaryColor || DEFAULT_BRANDING.secondaryColor;
  
  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .header h1 { color: #FDB913; margin: 10px 0 0 0; font-size: 24px; }
      .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
      .button { display: inline-block; background: ${secondaryColor}; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none; }
      .highlight { background: #FDB913; color: ${primaryColor}; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
      .info { background: #e8f5e9; border: 1px solid ${secondaryColor}; padding: 15px; border-radius: 6px; margin: 15px 0; }
      .priority-high { color: #d32f2f; font-weight: bold; }
      .priority-medium { color: #f57c00; font-weight: bold; }
      .priority-low { color: #388e3c; font-weight: bold; }
    </style>
  `;

  const APP_URL = process.env.APP_URL 
    || process.env.RENDER_EXTERNAL_URL
    || (process.env.NODE_ENV === 'production' ? 'https://ststaxrepair.org' : null)
    || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null)
    || 'http://localhost:5000';

  const priorityClass = priority === 'high' ? 'priority-high' : priority === 'low' ? 'priority-low' : 'priority-medium';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="${companyName} Logo" style="max-width: 120px; margin-bottom: 10px;" />
          <h1>${companyName}</h1>
          <p style="color: #ffffff; margin: 5px 0 0 0;">Professional Tax Services</p>
        </div>
        <div class="content">
          <h2>New Task Assigned</h2>
          <p>Hello ${firstName || 'there'},</p>
          <p>A new task has been assigned to you${assignedBy ? ` by ${assignedBy}` : ''}.</p>
          <div class="info">
            <strong>Task Details:</strong><br>
            Title: <strong>${taskTitle}</strong><br>
            ${taskDescription ? `Description: ${taskDescription}<br>` : ''}
            ${clientName ? `Client: ${clientName}<br>` : ''}
            Priority: <span class="${priorityClass}">${priority || 'Medium'}</span><br>
            ${dueDate ? `Due Date: ${dueDate}<br>` : ''}
          </div>
          <p style="text-align: center;">
            <a href="${APP_URL}/tasks" class="button">View Task</a>
          </p>
        </div>
        <div class="footer">
          <p>${companyName} | Professional Tax Services</p>
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `New Task Assigned: ${taskTitle} - ${companyName}`,
    html,
    branding: brand,
  });
}

export async function sendDocumentUploadConfirmationEmail(
  email: string,
  firstName: string,
  documentName: string,
  documentType?: string,
  uploadedBy?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const brand = branding || DEFAULT_BRANDING;
  const companyName = brand.companyName || DEFAULT_BRANDING.companyName;
  const logoUrl = brand.logoUrl || DEFAULT_BRANDING.logoUrl;
  const primaryColor = brand.primaryColor || DEFAULT_BRANDING.primaryColor;
  const secondaryColor = brand.secondaryColor || DEFAULT_BRANDING.secondaryColor;
  
  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .header h1 { color: #FDB913; margin: 10px 0 0 0; font-size: 24px; }
      .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
      .button { display: inline-block; background: ${secondaryColor}; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none; }
      .info { background: #e8f5e9; border: 1px solid ${secondaryColor}; padding: 15px; border-radius: 6px; margin: 15px 0; }
    </style>
  `;

  const APP_URL = process.env.APP_URL 
    || process.env.RENDER_EXTERNAL_URL
    || (process.env.NODE_ENV === 'production' ? 'https://ststaxrepair.org' : null)
    || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null)
    || 'http://localhost:5000';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="${companyName} Logo" style="max-width: 120px; margin-bottom: 10px;" />
          <h1>${companyName}</h1>
          <p style="color: #ffffff; margin: 5px 0 0 0;">Professional Tax Services</p>
        </div>
        <div class="content">
          <h2>Document Uploaded Successfully</h2>
          <p>Hello ${firstName || 'there'},</p>
          <p>A document has been uploaded to your account${uploadedBy ? ` by ${uploadedBy}` : ''}.</p>
          <div class="info">
            <strong>Document Details:</strong><br>
            Name: <strong>${documentName}</strong><br>
            ${documentType ? `Type: ${documentType}<br>` : ''}
            Upload Date: ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          <p>Your tax preparer will review this document and contact you if additional information is needed.</p>
          <p style="text-align: center;">
            <a href="${APP_URL}/portal/documents" class="button">View Documents</a>
          </p>
        </div>
        <div class="footer">
          <p>${companyName} | Professional Tax Services</p>
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Document Uploaded: ${documentName} - ${companyName}`,
    html,
    branding: brand,
  });
}

export async function sendAppointmentReminderEmail(
  email: string,
  firstName: string,
  date: string,
  time: string,
  location?: string,
  timeUntil?: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const template = getEmailTemplate('appointment_reminder', { 
    firstName, date, time, location, timeUntil 
  }, branding);
  
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    branding,
  });
}

export async function sendStaffRequestNotificationEmail(
  adminEmail: string,
  adminName: string,
  firstName: string,
  lastName: string,
  requestEmail: string,
  roleRequested: string,
  reason: string,
  branding?: OfficeBranding
): Promise<EmailResult> {
  const brand = branding || DEFAULT_BRANDING;
  const logoUrl = brand.logoUrl || DEFAULT_BRANDING.logoUrl;
  const primaryColor = brand.primaryColor || DEFAULT_BRANDING.primaryColor;
  const secondaryColor = brand.secondaryColor || DEFAULT_BRANDING.secondaryColor;
  const companyName = brand.companyName || DEFAULT_BRANDING.companyName;

  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .header img { max-width: 150px; }
      .header h1 { color: #FDB913; margin: 10px 0 0 0; font-size: 24px; }
      .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
      .button { display: inline-block; background: ${secondaryColor}; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      .button:hover { background: ${primaryColor}; }
      .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none; }
      .info-box { background: #e8f5e9; border: 1px solid ${secondaryColor}; padding: 15px; border-radius: 6px; margin: 15px 0; }
      .request-details { background: #f5f5f5; border-left: 4px solid ${secondaryColor}; padding: 15px; margin: 15px 0; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      td { padding: 8px; border-bottom: 1px solid #e0e0e0; }
      td:first-child { font-weight: bold; width: 30%; color: ${primaryColor}; }
    </style>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="${companyName} Logo" style="max-width: 120px; margin-bottom: 10px;" />
          <h1>New Staff Request</h1>
        </div>
        <div class="content">
          <p>Hello ${adminName},</p>
          <p>A new staff member has requested access to the ${companyName} portal. Please review the details below and approve or reject the request in the User Management section.</p>
          
          <div class="request-details">
            <table>
              <tr>
                <td>Name:</td>
                <td>${firstName} ${lastName}</td>
              </tr>
              <tr>
                <td>Email:</td>
                <td>${requestEmail}</td>
              </tr>
              <tr>
                <td>Role Requested:</td>
                <td>${roleRequested.charAt(0).toUpperCase() + roleRequested.slice(1).replace('_', ' ')}</td>
              </tr>
              <tr>
                <td>Reason:</td>
                <td>${reason}</td>
              </tr>
            </table>
          </div>

          <div class="info-box">
            <strong>Action Required:</strong> Log in to the admin dashboard to review and approve or reject this staff request.
          </div>

          <p style="text-align: center;">
            <a href="${APP_URL}/dashboard" class="button">Review Staff Requests</a>
          </p>

          <p>This is an automated notification. Staff requests are reviewed in the User Management section under the "Staff Requests" tab.</p>
        </div>
        <div class="footer">
          <p>${companyName} | Professional Tax Services</p>
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New Staff Request - ${firstName} ${lastName}`,
    html,
    branding: brand,
  });
}

export { getEmailTemplate };
