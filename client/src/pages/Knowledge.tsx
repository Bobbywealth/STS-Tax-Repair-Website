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
      lastUpdated: "Dec 1, 2024",
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
      lastUpdated: "Dec 1, 2024",
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
      lastUpdated: "Dec 1, 2024",
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
      lastUpdated: "Dec 1, 2024",
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
      lastUpdated: "Dec 1, 2024",
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
      lastUpdated: "Dec 1, 2024",
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

    // Client Articles
    {
      id: "client-1",
      title: "Getting Started as a Client",
      category: "Getting Started",
      excerpt: "Welcome to STS TaxRepair! Learn how to get started with your tax refund.",
      lastUpdated: "Dec 1, 2024",
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
      lastUpdated: "Dec 1, 2024",
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
      lastUpdated: "Dec 1, 2024",
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
      lastUpdated: "Dec 1, 2024",
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
      lastUpdated: "Dec 1, 2024",
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
      lastUpdated: "Dec 1, 2024",
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
