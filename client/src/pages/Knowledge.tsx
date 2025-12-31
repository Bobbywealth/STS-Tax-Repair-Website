import { KnowledgeBaseCard } from "@/components/KnowledgeBaseCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useState } from "react";

interface Article {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  lastUpdated: string;
  content?: string;
  audience: "admin" | "client" | "both";
}

export default function Knowledge() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const articles: Article[] = [
    // Admin Articles
    {
      id: "admin-1",
      title: "Dashboard Overview for Admins",
      category: "Getting Started",
      excerpt: "Learn how to navigate the admin dashboard and access key features.",
      lastUpdated: "Dec 7, 2025",
      audience: "admin",
      content: `
# Dashboard Overview for Admins

The STS TaxRepair admin dashboard is your command center for managing all tax preparation operations.

## Main Dashboard Sections

### Statistics Cards
- **Total Clients**: View your complete client base
- **Active Cases**: See how many tax filings are in progress
- **Completed Refunds**: Track successfully processed refunds
- **Revenue**: Monitor service fees and income

### Activity Feed
- Real-time updates on client actions
- Filing status changes
- Document uploads
- Task completions

### Quick Actions
- Create new client records
- Add tasks
- Upload documents
- Generate reports

## Navigation Menu

The left sidebar contains all main features:
- Dashboard: Overview and statistics
- Clients: Manage client database
- Leads: Track prospective clients
- Tax Deadlines: Important dates
- Appointments: Schedule meetings
- Payments: Track financial transactions
- Documents: File management
- E-Signatures: IRS Form 8879 processing
- Tasks: Team task management
- Support Tickets: Client support requests
- Reports: Analytics and metrics
      `
    },
    {
      id: "admin-2",
      title: "Client Management for Admins",
      category: "Client Management",
      excerpt: "Complete guide to adding, editing, and managing client profiles and tax filings.",
      lastUpdated: "Dec 7, 2025",
      audience: "admin",
      content: `
# Client Management for Admins

## Adding New Clients

1. Click **Add Client** button on the Clients page
2. Fill in required information:
   - First and Last Name
   - Email address
   - Phone number
   - Address and location
3. Assign a preparer if needed
4. Click **Create Client**

## Managing Tax Filings Per Year

Each client can have multiple tax year filings. This enables:
- Historical tracking of multiple years
- Year-over-year comparison
- Proper multi-year client management

### Creating a Filing for a Specific Year

1. Open the client's profile
2. Scroll to "Tax Filing History"
3. Click **Add Year** dropdown
4. Select the tax year
5. Click the **+** button to create

### Updating Filing Status

Each filing moves through these statuses:
- **New**: Initial creation
- **Docs Pending**: Waiting for client documents
- **In Review**: Staff reviewing documents
- **Filed**: Submitted to tax authorities
- **Accepted**: Accepted by tax authority
- **Approved**: Refund approved
- **Paid**: Refund issued to client

To update status:
1. Find the filing in the client's history
2. Click the status dropdown
3. Select new status
4. Changes are saved automatically

### Tracking Refund Details

For each filing, record:
- Estimated refund amount (federal & state)
- Actual refund received
- Service fee charged
- Payment status

## Filtering Clients

Use the **Tax Year** selector to view clients for specific years, and use status filters to find clients at each stage of the process.

## Client Profile Information

Edit any of these fields:
- Contact information
- Address
- Assigned preparer
- Notes and internal comments
      `
    },
    {
      id: "admin-3",
      title: "Task Management for Staff",
      category: "Tasks",
      excerpt: "Create, assign, and track tasks for your team to keep workflows organized.",
      lastUpdated: "Dec 7, 2025",
      audience: "admin",
      content: `
# Task Management for Staff

## Creating Tasks

1. Go to the **Tasks** section
2. Click **Add Task**
3. Fill in:
   - **Title**: Clear, specific task name
   - **Description**: Details about what needs to be done
   - **Priority**: High, Medium, or Low
   - **Assigned To**: Select team member
   - **Due Date**: When task should be completed
   - **Related Client**: Link to specific client if applicable
4. Click **Create Task**

## Task Priorities

- **High**: Urgent, needs immediate attention (e.g., IRS deadline)
- **Medium**: Standard workflow task
- **Low**: Non-urgent work items

## Tracking Task Progress

Tasks move through these states:
- **New**: Just created, not started
- **In Progress**: Someone is actively working on it
- **Review**: Waiting for approval
- **Completed**: Task finished

## Best Practices

- Link tasks to specific clients when relevant
- Set realistic due dates
- Use clear, actionable titles
- Add detailed descriptions for complex tasks
- Review overdue tasks regularly
- Mark completed tasks to keep list organized
      `
    },
    {
      id: "admin-4",
      title: "Document Management",
      category: "Documents",
      excerpt: "Upload, organize, and track tax documents for clients.",
      lastUpdated: "Dec 7, 2025",
      audience: "admin",
      content: `
# Document Management

## Uploading Client Documents

1. Open the client's profile
2. Go to the **Documents** tab
3. Click **Upload Documents**
4. Select files (W-2, 1099, ID scans, etc.)
5. Supported formats: PDF, JPG, PNG
6. Maximum file size: 5MB per file
7. Click **Upload**

## Organizing Documents

Documents are automatically organized by:
- Client name
- Document type
- Upload date
- Status (new, reviewed, filed)

## Document Types

Common tax documents:
- **W-2 Forms**: Wage and tax statements
- **1099 Forms**: Self-employment or investment income
- **1098 Forms**: Mortgage interest or education credit
- **ID Scans**: Driver's license or passport
- **Supporting Documents**: Receipts, statements, etc.

## Viewing Document History

Each client's document section shows:
- Complete upload history
- Document status
- Upload dates
- File sizes

## Accessing Imported Documents

Legacy documents from Perfex CRM are automatically available in the system with:
- Original file links
- Upload dates
- Client associations
      `
    },
    {
      id: "admin-5",
      title: "Support Tickets and Client Communication",
      category: "Support",
      excerpt: "Handle client support requests and maintain communication records.",
      lastUpdated: "Dec 7, 2025",
      audience: "admin",
      content: `
# Support Tickets and Client Communication

## Managing Support Tickets

1. Go to **Support Tickets** section
2. View all open and closed tickets
3. Click ticket to view details
4. Add responses and notes

## Ticket Status

- **New**: Just received, not yet reviewed
- **In Progress**: Being handled by staff
- **Awaiting Client**: Waiting for client response
- **Resolved**: Issue handled, ticket closed
- **Closed**: No longer active

## Responding to Tickets

1. Click on the ticket
2. Read the client's message
3. Type your response
4. Attach documents if needed
5. Click **Send Response**
6. Update status as needed

## Client Messages

The Messages tab shows:
- Direct messages with clients
- Communication history
- Timestamps
- Attachment history

## Best Practices

- Respond to tickets within 24 hours
- Be clear and professional
- Provide specific next steps
- Reference ticket numbers in follow-ups
- Close tickets only when resolved
      `
    },
    {
      id: "admin-6",
      title: "User Roles and Permissions",
      category: "Administration",
      excerpt: "Understand admin and staff roles and their permissions.",
      lastUpdated: "Dec 7, 2025",
      audience: "admin",
      content: `
# User Roles and Permissions

## Admin Role

Full system access including:
- Client management (create, edit, delete)
- Staff management
- Financial tracking
- Report generation
- System settings
- User permissions configuration
- All client data access

## Staff/Manager Role

Limited access for operational staff:
- View assigned clients
- Add documents
- Update filing status
- Create and manage tasks
- Respond to support tickets
- View assigned appointments
- Cannot modify system settings
- Cannot access all clients (only assigned)

## Client Role

Self-service access including:
- View their own profile
- Upload documents
- Track refund status
- Message support team
- View appointment times
- Update account information
- Cannot access other clients' data

## Assigning Permissions

Admins can:
1. Go to **User Management**
2. Select user
3. Choose role
4. Specific permissions are assigned by role
5. Click **Save**

## Permission Categories

- **Clients**: View, create, edit, delete
- **Documents**: Upload, download, delete
- **Tasks**: Create, assign, complete
- **Reports**: View, generate, export
- **Financial**: View payments, fees
      `
    },
    {
      id: "admin-7",
      title: "E-Signatures and Form 8879",
      category: "Documents",
      excerpt: "Guide clients through the e-signature process for IRS Form 8879.",
      lastUpdated: "Dec 7, 2025",
      audience: "admin",
      content: `
# E-Signatures and IRS Form 8879

## What is Form 8879?

Form 8879 is the Declaration for Electronic Filing authorization. It's required by the IRS when filing tax returns electronically. It authorizes you to e-file on the client's behalf.

## When You Need E-Signatures

- Before filing any tax return electronically
- For both federal and state returns
- For each client
- Separate signature per tax year if needed

## Sending E-Signature Request

1. Go to **E-Signatures** section
2. Click **Request Signature**
3. Select client
4. Select tax year
5. Choose document type (Form 8879)
6. Add any special instructions
7. Click **Send Request**

Client will receive:
- Email notification
- Link to sign document
- Clear instructions

## Client Signing Process

Clients receive email with:
- Link to secure signing page
- PDF of Form 8879
- Instructions
- 7-day expiration

They can:
1. Review the document
2. Click to sign
3. Enter signature (draws with mouse/touchscreen)
4. Confirm and submit

## After Signature Received

1. Signature automatically appears on form
2. Document is timestamped
3. You can proceed with filing
4. Keep copy for records

## Document Storage

Signed forms are:
- Securely stored in client folder
- Available for download
- Kept for tax record retention (7 years minimum)

## Compliance Notes

- E-signatures have legal validity
- Forms are electronically bound to tax return
- IRS accepts forms filed this way
- Keep audit trail for records
      `
    },
    {
      id: "admin-8",
      title: "Appointments and Scheduling",
      category: "Appointments",
      excerpt: "Schedule and manage client meetings and consultations.",
      lastUpdated: "Dec 7, 2025",
      audience: "admin",
      content: `
# Appointments and Scheduling

## Creating Appointments

1. Go to **Appointments** section
2. Click **Schedule Appointment**
3. Fill in:
   - **Client**: Select from your client list
   - **Staff Member**: Choose who will meet
   - **Date & Time**: Pick date and time
   - **Duration**: How long (30 min, 1 hour, etc.)
   - **Type**: Consultation, Review, Planning, Other
   - **Notes**: Any special details
4. Click **Create Appointment**

## Appointment Types

- **Consultation**: Initial meeting to discuss taxes
- **Document Review**: Going through client documents
- **Planning**: Discussing strategies and options
- **E-Sign**: Getting signatures on forms
- **Follow-up**: Check-in on status
- **Payment**: Discussing fees and payment

## Client Notifications

When you create an appointment:
1. Client gets email notification
2. Includes date, time, staff member
3. Link to confirm/reschedule
4. Calendar invite attached

## Managing Appointments

### View Schedule
1. Go to **Appointments**
2. See all upcoming meetings
3. Filter by staff member or client

### Updating Appointment
1. Click on appointment
2. Modify date/time/notes
3. Changes email to client automatically

### Canceling Appointment
1. Click appointment
2. Click **Cancel**
3. Client gets cancellation notice

## No-Show Tracking

If client misses appointment:
1. Mark as "No Show"
2. Automatically log incident
3. Client gets follow-up message
4. Helps identify patterns

## Calendar Integration

You can:
- Sync with personal calendar
- Export appointment list
- Set reminders
- View availability

## Best Practices

- Schedule 24+ hours in advance
- Send reminder email day before
- Build buffer time between appointments
- Group similar tasks together
- Keep notes on what was discussed
      `
    },
    {
      id: "admin-9",
      title: "Payment Tracking and Financial Management",
      category: "Financial",
      excerpt: "Manage client payments, service fees, and financial records.",
      lastUpdated: "Dec 7, 2025",
      audience: "admin",
      content: `
# Payment Tracking and Financial Management

## Recording Payments

### Adding a Payment
1. Go to **Payments** section
2. Click **Record Payment**
3. Select client
4. Choose payment type:
   - Service fee
   - Retainer
   - Payment plan installment
   - Consultation fee
5. Enter amount
6. Select payment method
7. Add reference number (check, transaction ID, etc.)
8. Click **Save**

## Payment Methods

- **Credit Card**: Online payment
- **Bank Transfer**: ACH/wire transfer
- **Check**: Paper check received
- **Cash**: In-person payment
- **Payment Plan**: Installment payments

## Payment Tracking

### View Client Payments
1. Open client profile
2. Go to **Financial** section
3. See:
   - Total fees
   - Payments made
   - Outstanding balance
   - Payment history

### Generate Payment Reports
1. Go to **Reports**
2. Select **Payment Report**
3. Choose date range
4. Filter by:
   - Client
   - Payment type
   - Status
5. Export as PDF or CSV

## Service Fees

Standard fees for:
- Tax preparation: $[Amount]
- E-filing: $[Amount]
- Consultation: $[Amount]
- Amendment filing: $[Amount]

## Payment Plans

For larger fees, offer:
- Installment options
- Specific payment schedule
- Interest terms if applicable
- Auto-payment setup

## Refund Advances

Some clients can receive advance on refund:
1. Assess client refund likelihood
2. Set advance amount
3. Document agreement
4. Track repayment from refund
5. Keep compliance records

## Financial Reports

View:
- Total revenue by month/year
- Payment collection rate
- Outstanding receivables
- Payment trends
- Client profitability

## Best Practices

- Get signed fee agreement upfront
- Collect payment before filing
- Send payment reminders early
- Document all transactions
- Maintain fee structure consistently
- Reconcile monthly
      `
    },
    {
      id: "admin-10",
      title: "Analytics and Reporting",
      category: "Reports",
      excerpt: "Generate reports and analyze business metrics and performance.",
      lastUpdated: "Dec 7, 2025",
      audience: "admin",
      content: `
# Analytics and Reporting

## Dashboard Analytics

The main dashboard shows:
- Total clients count
- Active cases in progress
- Completed refunds (this year)
- Revenue generated
- Status distribution
- Activity feed

## Available Reports

### Client Reports
- Client list by status
- Clients by preparer
- Client acquisition trends
- Client retention rate

### Financial Reports
- Monthly revenue
- Outstanding payments
- Payment collection rate
- Average fee per client
- Profitability by preparer

### Filing Reports
- Filings by status
- Filings by tax year
- Average processing time
- Filing success rate
- Refund statistics

### Task Reports
- Open tasks
- Overdue tasks
- Tasks by priority
- Completion rate
- Tasks by assignee

### Support Reports
- Total support tickets
- Average resolution time
- Customer satisfaction
- Common issue categories
- Response time metrics

## Generating Custom Reports

1. Go to **Reports** section
2. Click **Generate Report**
3. Select report type
4. Choose parameters:
   - Date range
   - Filter criteria (client, staff, status)
   - Grouping options
5. Select format (PDF, CSV, Excel)
6. Click **Generate**

## Exporting Data

Reports can be:
- Downloaded as PDF (formatted)
- Exported as CSV (for analysis)
- Emailed automatically
- Scheduled for recurring runs

## Performance Metrics

Key metrics to track:
- **Average Processing Time**: Days from new to paid
- **Collection Rate**: % of payments received
- **Client Satisfaction**: Support ticket feedback
- **Filing Success Rate**: % filed successfully
- **Staff Productivity**: Cases per preparer
- **Revenue per Client**: Average income per relationship

## Setting Goals and Targets

Use reports to:
- Set team targets
- Track individual performance
- Identify process improvements
- Plan capacity
- Make business decisions

## Data Insights

Look for:
- Peak times (higher volume periods)
- Bottlenecks (where cases slow down)
- High-risk clients (patterns in issues)
- Top performers (staff, processes)
- Trends (seasonal patterns)

## Best Practices

- Review reports weekly
- Compare to previous periods
- Share metrics with team
- Use data for improvement
- Document changes and results
      `
    },
    {
      id: "admin-11",
      title: "Lead Management and Prospecting",
      category: "Leads",
      excerpt: "Manage leads, track prospects, and convert them to clients.",
      lastUpdated: "Dec 7, 2025",
      audience: "admin",
      content: `
# Lead Management and Prospecting

## What is a Lead?

A lead is a prospective client who has shown interest but isn't yet a paying customer.

## Creating Leads

### Manually Add Lead
1. Go to **Leads** section
2. Click **Add Lead**
3. Fill in:
   - Name
   - Email
   - Phone
   - How they heard about you
   - Service interested in
   - Notes
4. Click **Create Lead**

### Lead Status

Leads move through stages:
- **New**: Just entered system
- **Contacted**: Initial outreach made
- **Interested**: Responded positively
- **Qualified**: Has budget and need
- **Proposal Sent**: Quote provided
- **Negotiating**: Discussing terms
- **Converted**: Now a paying client
- **Lost**: Prospect declined

## Converting Leads to Clients

When lead is ready:
1. Open lead record
2. Click **Convert to Client**
3. System creates client account
4. All lead info transfers over
5. Move to **Clients** section
6. Can now file taxes

## Lead Follow-up

### Tracking Interactions
1. Click lead
2. Add notes on each contact
3. Record email, call, or meeting
4. Log date and outcome

### Setting Reminders
1. Click **Set Follow-up**
2. Choose date
3. Add task
4. System reminds you

### Lead Scoring

Score leads by:
- Budget (can afford service)
- Timeline (need immediate service)
- Fit (right type of client)
- Engagement (responsive, interested)

## Lead Nurturing

Ways to engage leads:
- Send helpful tax articles
- Follow-up emails with info
- Educational webinars
- Service discounts
- Personal contact calls

## Bulk Import Leads

1. Go to **Leads**
2. Click **Import**
3. Upload CSV with:
   - Name
   - Email
   - Phone
   - Source
4. System imports automatically

## Analyzing Lead Data

Track:
- Conversion rate (leads → clients)
- Time to conversion
- Cost per lead
- Source effectiveness
- Lead quality by source

## Best Practices

- Respond to leads within 24 hours
- Personalize outreach
- Follow up consistently
- Track all interactions
- Don't abandon leads
- Set clear follow-up dates
- Use data to refine process
      `
    },

    // Client Articles
    {
      id: "client-1",
      title: "Getting Started as a Client",
      category: "Getting Started",
      excerpt: "Welcome to STS TaxRepair! Learn how to get started with your tax refund.",
      lastUpdated: "Dec 7, 2025",
      audience: "client",
      content: `
# Getting Started with STS TaxRepair

Welcome to your client portal! We're excited to help you get your tax refund.

## Your First Steps

### 1. Complete Your Profile
- Log in to your account
- Go to your profile
- Fill in your contact information
- Add your address
- This helps us serve you better

### 2. Understand the Process
Your tax refund goes through several stages:
- **New**: Your case just started
- **Documents Pending**: We're waiting for your tax documents
- **In Review**: Our staff is reviewing your documents
- **Filed**: We've submitted to the tax authority
- **Accepted**: The tax authority accepted the filing
- **Approved**: Your refund was approved
- **Paid**: Your refund has been sent to you

### 3. Upload Your Documents
Gather these documents:
- W-2 forms from your employer(s)
- 1099 forms for other income
- ID (driver's license or passport)
- Any supporting documents

### 4. Stay in Contact
- Check your messages regularly
- Respond quickly to requests
- Ask questions if unsure
- We're here to help!

## What to Expect

**Timeline**: Most refunds take 4-6 weeks from filing to payment

**Communication**: We'll update you at each stage

**Support**: Message us anytime with questions
      `
    },
    {
      id: "client-2",
      title: "How to Upload Your Documents",
      category: "Documents",
      excerpt: "Step-by-step instructions for securely uploading your tax documents.",
      lastUpdated: "Dec 7, 2025",
      audience: "client",
      content: `
# How to Upload Your Documents

## Preparing Your Documents

Before uploading, make sure you have:
- Clear, legible scans or photos
- PDF or image format (JPG, PNG)
- Files under 5MB each

## Uploading Step-by-Step

1. Log into your client portal
2. Go to **Documents** section
3. Click **Upload Documents** button
4. Select files from your computer
5. You can select multiple files at once
6. Click **Upload**
7. Wait for confirmation message

## Required Documents

### Essential Documents
- **W-2 Forms**: From each employer in the past year
- **Photo ID**: Driver's license or passport (front and back)
- **Tax Transcripts**: Optional but helpful

### Additional Documents (if applicable)
- **1099 Forms**: 1099-NEC, 1099-MISC for self-employment
- **1098 Forms**: Mortgage interest statements
- **Investment Documents**: K-1, 1099-DIV, 1099-INT
- **Education**: 1098-T forms
- **Business**: Profit & loss statement

## Document Tips

- Make sure documents are clear and readable
- Check both sides of ID
- Don't obscure any information
- Use good lighting for photos
- Upload complete pages

## What Happens After Upload

1. Documents appear in your account immediately
2. Our staff reviews them within 1-2 business days
3. We'll message you if we need clarification
4. Once approved, we proceed to filing

## Security

Your documents are:
- Encrypted in transit
- Securely stored
- Only accessible to authorized staff
- Protected by industry standards
      `
    },
    {
      id: "client-3",
      title: "Understanding Your Refund Status",
      category: "Process",
      excerpt: "Learn what each refund status means and what to expect.",
      lastUpdated: "Dec 7, 2025",
      audience: "client",
      content: `
# Understanding Your Refund Status

## Refund Status Stages

### New
**What it means**: Your case has just been created
**What happens next**: We'll contact you to collect documents
**Your action**: Watch for messages and start gathering documents

### Documents Pending
**What it means**: We're waiting for your tax documents
**What happens next**: Once received, our team will review them
**Your action**: Upload all required documents through the portal

### In Review
**What it means**: Our staff is reviewing your documents
**What happens next**: We'll verify everything is complete
**Your action**: Be available to answer questions if needed

### Filed
**What it means**: We've submitted your tax return to the IRS/state
**What happens next**: Tax authorities will process your filing
**Your action**: Relax - the waiting game begins!

### Accepted
**What it means**: Tax authorities have accepted your filing
**What happens next**: They're processing your refund
**Your action**: Continue to wait for approval

### Approved
**What it means**: Your refund has been approved!
**What happens next**: They'll send the money soon
**Your action**: Check your messages for payment information

### Paid
**What it means**: Your refund has been issued!
**What happens next**: Money will appear in your account soon
**Your action**: Contact us if you have any issues

## Timeline Expectations

| Stage | Typical Duration |
|-------|------------------|
| New to Documents | 1-2 days |
| Documents to Review | 2-5 business days |
| Review to Filed | 3-7 business days |
| Filed to Accepted | 5-10 business days |
| Accepted to Approved | 7-14 business days |
| Approved to Paid | 1-5 business days |
| **Total** | **4-6 weeks** |

## Tracking Your Refund

Check your status anytime by:
1. Logging into your portal
2. Going to your profile
3. Looking at "Current Tax Year Status"
4. You'll see exactly where you are in the process

## Questions About Your Status?

Contact our support team:
- Message through the portal
- We respond within 24 hours
- Include your reference number
      `
    },
    {
      id: "client-4",
      title: "Account Management",
      category: "Account",
      excerpt: "Update your profile information and manage your account settings.",
      lastUpdated: "Dec 7, 2025",
      audience: "client",
      content: `
# Managing Your Account

## Updating Your Information

### Contact Information
1. Go to your profile
2. Click **Edit Profile**
3. Update:
   - Phone number
   - Email address
   - Address
4. Click **Save**

**Why it matters**: We use this to contact you about your refund

### Account Preferences
- Notification settings (email alerts)
- Communication preferences
- Language preference

## Password and Security

### Changing Your Password
1. Go to **Account Settings**
2. Click **Change Password**
3. Enter current password
4. Enter new password (twice)
5. New password must be at least 8 characters
6. Click **Update**

### Keeping Your Account Secure
- Use a strong password (mix of letters, numbers, symbols)
- Don't share your login credentials
- Log out when done on shared computers
- Never give your password to staff (we never ask)

## Your Personal Information

### What We Store
- Name and contact information
- Address and location
- Tax documents you upload
- Communication history
- Refund tracking information

### Privacy and Security
- Your information is encrypted
- Only authorized staff can see it
- We follow industry security standards
- We never sell your information

## Two-Factor Authentication

For extra security:
1. Go to Account Settings
2. Enable two-factor authentication
3. Use your phone to verify logins
4. Adds extra layer of protection

## Deactivating Your Account

If you no longer need your account:
1. Contact our support team
2. Request account deactivation
3. We'll securely delete your information
4. Final refund will still be processed
      `
    },
    {
      id: "client-5",
      title: "Common Questions and Troubleshooting",
      category: "FAQ",
      excerpt: "Answers to frequently asked questions and solutions to common issues.",
      lastUpdated: "Dec 7, 2025",
      audience: "client",
      content: `
# Common Questions & Troubleshooting

## Frequently Asked Questions

### How long until I get my refund?
Typically 4-6 weeks from filing. Varies by tax authority processing time.

### Can I upload documents multiple times?
Yes! If you missed something, just upload more documents. We'll review everything together.

### What if my refund amount changes?
We'll notify you immediately if amounts change and explain why.

### How do I check on my refund?
Log into your portal and check your refund status on your profile.

### Can I change my preparer?
Contact our support team and we can reassign your case if needed.

### What formats do documents need to be?
PDF, JPG, or PNG. Maximum 5MB per file.

### Is my information secure?
Yes! We use industry-standard encryption and security measures.

### Can I get a refund advance?
Contact us about refund advance options - terms may apply.

## Troubleshooting

### Can't Log In
1. Check your email is correct
2. Reset password if needed
3. Clear browser cache
4. Try different browser
5. Contact support if still stuck

### Document Won't Upload
- Check file size (max 5MB)
- Verify file format (PDF, JPG, PNG)
- Try different file
- Contact support if issue persists

### Don't See My Uploaded Documents
- Wait a few moments for page refresh
- Log out and log back in
- Clear browser cache
- Contact support

### Not Receiving Messages
- Check spam/junk folder
- Verify email in your settings
- Enable email notifications
- Contact support to resend

### Status Hasn't Updated
- Updates happen 1-2x daily
- Refresh your browser
- Check back tomorrow
- Message support for status check

## Getting Help

**Can't find the answer?**
1. Message our support team through the portal
2. Include details about your issue
3. We respond within 24 hours
4. Don't email personal information

**Need urgent help?**
Contact us during business hours:
- Monday - Friday: 9am - 5pm EST
- Saturday: 10am - 2pm EST
      `
    },
    {
      id: "client-6",
      title: "What Happens If I Owe Taxes?",
      category: "Process",
      excerpt: "Information about what to do if you owe taxes instead of receiving a refund.",
      lastUpdated: "Dec 7, 2025",
      audience: "client",
      content: `
# What If I Owe Taxes?

## Understanding Tax Liability

Not everyone receives a refund. Some people owe taxes.

### Why You Might Owe
- Not enough tax withholding from paychecks
- Self-employment income without quarterly payments
- Investment income with capital gains
- Other sources of income

### We Can Help
If you owe taxes, we can:
- Prepare your return correctly
- Explain your tax liability
- Discuss payment plan options
- Help minimize tax liability where possible

## Payment Options

### Option 1: Lump Sum Payment
- Pay in full by the tax deadline
- No additional fees
- Easiest method if you have funds

### Option 2: Payment Plan
- Spread payments over time
- Interest and penalties apply
- Installment agreement with IRS
- We can help arrange this

### Option 3: Offer in Compromise
- Settle for less than you owe
- If severe financial hardship
- Special circumstances required
- Requires approval from IRS

## Important Dates

**Tax Return Deadline**: April 15 of following year
**Estimated Tax Due**: Quarterly throughout the year

## Next Steps

1. Contact our team immediately if you'll owe
2. Discuss payment options
3. Arrange payment plan if needed
4. File by deadline to avoid penalties

**Don't ignore tax liability** - penalties increase over time

## Questions?

Message our support team:
- We help clients understand what they owe
- Discuss all available options
- Find best solution for your situation
      `
    },
    {
      id: "client-7",
      title: "Data Privacy and Security",
      category: "Security",
      excerpt: "Learn how we protect your personal and financial information.",
      lastUpdated: "Dec 7, 2025",
      audience: "client",
      content: `
# Data Privacy and Security

## Our Commitment to Your Privacy

Your personal and tax information is sensitive. We take security seriously.

## How We Protect Your Information

### Encryption
- All data in transit is encrypted (HTTPS/TLS)
- Documents stored with industry-standard encryption
- Passwords are encrypted and never stored in plain text

### Access Control
- Only authorized staff can see your information
- Staff access is logged and audited
- Role-based permissions limit who sees what
- Admin review of all access requests

### Data Storage
- Secure servers with firewalls
- Regular security audits
- Backup systems for disaster recovery
- Data centers comply with SOC 2 standards

## What Information We Collect

We collect only what's necessary:
- Name and contact information
- Address and location
- Tax documents you upload
- Communication history
- Payment information
- Refund details

## What We DON'T Do

- We never sell your information
- We don't share with third parties (except filing authorities)
- We don't use your data for marketing
- We don't combine data with other businesses
- We don't store passwords insecurely

## Your Rights

You can:
- Request a copy of your data (free)
- Request data corrections
- Ask what data we have
- Request data deletion (after tax period)
- Opt out of non-essential communications

## Filing Authority Information

To file your taxes, we:
- Share return info with IRS/state (required by law)
- Use secure e-filing systems
- Don't control how they store data
- Must comply with their requirements

## Contact Information Changes

If information is incorrect:
1. Log into your portal
2. Go to **Account Settings**
3. Click **Edit Profile**
4. Update information
5. We'll notify authorities of corrections

## Breach Notification

If a breach occurs:
- We notify affected users immediately
- Provide information about the breach
- Explain what we're doing
- Give steps to protect yourself
- Offer credit monitoring if applicable

## Third-Party Services

We use:
- Email service (SendGrid) for notifications
- Document storage for file management
- All comply with privacy laws

## Your Responsibilities

Help us protect your data:
- Use strong passwords
- Don't share login credentials
- Log out on shared computers
- Report suspicious activity immediately
- Keep contact info updated

## Questions About Privacy?

Contact us:
- Message through the portal
- Ask about our privacy policy
- Request security documentation
- We respond within 24 hours
      `
    },
    {
      id: "client-8",
      title: "Signing Documents (E-Signatures)",
      category: "Documents",
      excerpt: "How to securely sign tax documents electronically.",
      lastUpdated: "Dec 7, 2025",
      audience: "client",
      content: `
# Signing Documents Electronically

## What is Form 8879?

Form 8879 is a required IRS form that authorizes us to e-file your tax return on your behalf. Without your signature, we cannot file electronically.

## When You'll Be Asked to Sign

When you're ready to file, we'll send:
- Email notification
- Link to sign Form 8879
- Clear instructions
- 7 days to complete

## How to Sign Electronically

### Step 1: Receive Email
You'll get an email with:
- Subject: "Please sign your tax return"
- Direct link to signing page
- Instructions and deadline

### Step 2: Open Signing Page
1. Click the link in email
2. Log in if needed
3. Review Form 8879
4. Check all information is correct

### Step 3: Review Form
Before signing, verify:
- Your name is correct
- Tax year is correct
- Filing status is correct
- Any other relevant details

### Step 4: Sign
1. Click **Sign** button
2. Review signature pad
3. Sign with mouse or touchscreen
4. Clear signature looks good
5. Click **Confirm**
6. Done!

## Important Notes

- Signature legally authorizes us to file
- You can't file without signing
- Signature is secure and timestamped
- You receive copy for records

## What if Something is Wrong?

**Before signing:**
- Contact us immediately
- Don't sign if information is incorrect
- We'll correct the form and resend

**After signing:**
- We'll file your return
- Contact us if you spot errors
- We can amend return if needed (additional fee may apply)

## Signature Timeline

1. We send signature request
2. You have 7 days to sign
3. After signing, we prepare to file
4. Filing happens 1-2 business days later
5. You get confirmation email when filed

## Mobile Devices

You can sign on:
- Desktop computer (recommended)
- Laptop
- Tablet
- Phone

Best experience on larger screens, but any device works.

## Technical Issues

Can't sign?
- Clear browser cache
- Try different browser
- Try different device
- Contact support

## Security

Your signature:
- Uses secure connection
- Cannot be forged
- Legally valid
- Stored safely
- Only you can sign your return

## Questions About Signing?

Contact support:
- We walk you through process
- Answer any questions
- Resend link if needed
- Help with technical issues
      `
    },
    {
      id: "client-9",
      title: "Contacting Support and Getting Help",
      category: "Support",
      excerpt: "How to reach our support team and get answers to your questions.",
      lastUpdated: "Dec 7, 2025",
      audience: "client",
      content: `
# Getting Help from Support

## Support Options

### Option 1: Message Through Portal (Recommended)
- Fastest response time
- 24-hour turnaround
- Keep history of conversations
- Can attach documents

Steps:
1. Log into portal
2. Click **Messages** or **Support**
3. Type your question
4. Attach documents if needed
5. Click **Send**

### Option 2: Email
- Send to: support@ststaxrepair.com
- Monitored business hours
- Include your reference number
- Keep copy of email

### Option 3: Phone
- Call during business hours
- Monday-Friday: 9am-5pm EST
- Saturday: 10am-2pm EST
- Have reference number ready

### Option 4: Check Knowledge Base
- Search this knowledge base
- Answers to common questions
- Step-by-step guides
- Available 24/7

## What to Include When Contacting Us

Help us help you faster:
- Your full name
- Your client reference number
- Brief description of issue
- What you've already tried
- Any error messages

**Don't include:**
- Social Security Number (unless necessary)
- Bank account details
- Credit card information
- Passwords

## Response Times

| Channel | Response Time | Hours |
|---------|---|---|
| Portal Message | 24 hours | Business hours |
| Email | 24-48 hours | Monday-Friday |
| Phone | Real-time | Business hours |
| Weekend | 24-48 hours | Saturday only |

## Common Issues We Can Help With

- Login problems
- Document upload issues
- Status questions
- Refund updates
- Appointment scheduling
- Payment questions
- Technical problems
- Account information

## Escalation

If not satisfied:
1. Ask to escalate to manager
2. Provide details of issue
3. Manager reviews within 24 hours
4. Get resolution or explanation

## Feedback

We want your feedback:
1. Complete our survey
2. Rate your experience
3. Tell us what to improve
4. Help us serve better

## Hours of Operation

**Monday-Friday:** 9:00 AM - 5:00 PM EST
**Saturday:** 10:00 AM - 2:00 PM EST
**Sunday:** Closed (messages answered Monday)

## Emergency Support

Urgent issues:
1. Call during hours
2. Press option for emergency
3. Speak to senior staff
4. Get immediate attention

## Tips for Better Support

- Be specific about issue
- Include error messages
- Describe what you tried
- Include recent screenshots
- Be patient and polite
- Follow up if no response
- Check spam folder for emails

## Need Help Right Now?

1. Check this knowledge base first
2. Try the FAQ section
3. Search your messages
4. Message support immediately
5. Call if truly urgent

We're here to help!
      `
    },
    {
      id: "client-10",
      title: "Tax Planning Tips and Deductions",
      category: "Process",
      excerpt: "Tips for planning your taxes and understanding common deductions.",
      lastUpdated: "Dec 7, 2025",
      audience: "client",
      content: `
# Tax Planning Tips and Deductions

## Tax Planning Throughout the Year

### Quarterly Check-In
Review your situation quarterly:
- Q1 (March): Tax withholding review
- Q2 (June): Mid-year check
- Q3 (September): Adjustment time
- Q4 (December): Year-end planning

### Withholding Adjustment
If you'll owe or over-withhold:
- Update W-4 form with employer
- Adjust tax withholding amount
- Can change anytime during year
- Avoids surprises at tax time

## Common Deductions

### Standard Deduction vs Itemizing
**Standard Deduction:**
- Fixed amount by filing status
- Easier - no paperwork
- 2024: $14,600 (single), $29,200 (married)

**Itemized Deductions:**
- Track specific expenses
- More work but potentially larger
- Only if more than standard
- Requires receipts and documentation

### Common Itemized Deductions

**Mortgage Interest**
- Interest on home loans (not principal)
- Keep loan statements
- Limited to $750,000 loan balance

**State Taxes**
- State income tax or sales tax
- Property taxes (limited to $10,000)
- Keep receipts and statements

**Charitable Donations**
- Cash donations to qualified charities
- Non-cash donations (clothes, etc.)
- Must have receipts
- Organizations must be IRS-approved

**Medical Expenses**
- Only if exceed 7.5% of income
- Prescriptions, doctor visits, insurance
- Keep all receipts
- Dental and vision included

### Business Deductions

If self-employed:
- Home office
- Equipment and supplies
- Vehicle mileage
- Travel and meals (50% meals)
- Professional development

Keep detailed records:
- Receipts for all expenses
- Mileage log for vehicle
- Business use percentage
- Documentation for home office

### Education Credits

If paying for education:
- American Opportunity Credit
- Lifetime Learning Credit
- Student loan interest deduction
- Tuition and fees deduction

## Records to Keep

### During the Year
- Receipts for deductions
- Bank/credit statements
- Donation receipts
- Medical bills
- Business invoices
- Mileage log

### At Tax Time
- W-2 forms from employers
- 1099 forms for other income
- Business profit/loss summary
- Deduction itemization
- Tax payment records

### Keep for 7 Years
- All tax returns
- Supporting documents
- Receipts and statements
- Correspondence with IRS

## Tax-Advantaged Accounts

### Retirement Accounts
- Traditional IRA: Tax-deductible contributions
- Roth IRA: Tax-free growth
- 401(k): Employer-sponsored plans
- SEP-IRA: Self-employed retirement

### Health Savings
- Health Savings Account (HSA)
- Triple tax advantage
- Medical expense deductions
- Flexible Spending Account (FSA)

## Estimated Taxes

If you're self-employed or have investment income:
- Pay quarterly estimated taxes
- Due: April 15, June 15, Sept 15, Jan 15
- Avoid penalties and interest
- Calculate based on projected income

## Life Changes

Notify us if:
- Got married or divorced
- Had a child
- Bought a home
- Started a business
- Changed jobs
- Large investment gains/losses
- Inheritance

These can significantly affect your taxes.

## Questions About Deductions?

Contact our team:
- Ask about your specific situation
- We help identify deductions
- Maximize your refund legally
- Explain tax concepts
      `
    },
  ];

  const adminArticles = articles.filter(a => a.audience === "admin" || a.audience === "both");
  const clientArticles = articles.filter(a => a.audience === "client" || a.audience === "both");

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
  };

  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => setSelectedArticle(null)}
          data-testid="button-back-to-articles"
        >
          ← Back to Articles
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedArticle.category} • Updated {selectedArticle.lastUpdated}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {selectedArticle.content}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">Comprehensive guides and documentation for staff and clients</p>
        </div>
      </div>

      <Tabs defaultValue="admin" className="w-full">
        <TabsList>
          <TabsTrigger value="admin" data-testid="tab-admin-articles">For Admins</TabsTrigger>
          <TabsTrigger value="client" data-testid="tab-client-articles">For Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-4 mt-4">
          <div className="grid gap-4">
            {adminArticles.map((article) => (
              <Card 
                key={article.id}
                className="cursor-pointer hover-elevate"
                onClick={() => handleSelectArticle(article)}
                data-testid={`article-${article.id}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{article.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{article.excerpt}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="inline-block px-2 py-1 bg-muted rounded">
                          {article.category}
                        </span>
                        <span>Updated {article.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="client" className="space-y-4 mt-4">
          <div className="grid gap-4">
            {clientArticles.map((article) => (
              <Card 
                key={article.id}
                className="cursor-pointer hover-elevate"
                onClick={() => handleSelectArticle(article)}
                data-testid={`article-${article.id}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{article.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{article.excerpt}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="inline-block px-2 py-1 bg-muted rounded">
                          {article.category}
                        </span>
                        <span>Updated {article.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
