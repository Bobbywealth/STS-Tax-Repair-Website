# STS TaxRepair CRM System

## Overview
STS TaxRepair is a web-based CRM system for tax refund companies, enabling client management, lead tracking, task coordination, and support operations. Clients can sign up, upload documents, track refunds, and communicate with preparers. Staff manage the client lifecycle through a unified dashboard. Built with a React frontend and Express backend, the system securely handles sensitive financial data, featuring role-based access (Admin, Staff/Manager, Client) and comprehensive tools including client management, lead tracking, task coordination, support ticketing, knowledge base, and analytics.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend uses React 18+ with TypeScript, Vite for fast builds, Wouter for routing, and TanStack React Query for server state management. UI is built with Shadcn UI (New York style) and Radix UI primitives, styled using Tailwind CSS with custom design tokens and support for light/dark mode. The design emphasizes a professional CRM aesthetic with a custom color palette, Inter font, and responsive grid layouts. State management relies on React Query for server state and React hooks for local UI state, with React Hook Form and Zod for forms. Key features include a collapsible sidebar, dashboard, multi-step forms, real-time status tracking, Kanban task board, and data tables with advanced functionalities.

### Backend Architecture
The backend is an Express.js server using TypeScript with ES modules. It provides a RESTful API with JSON format, centralized error handling, and session-based authentication. Data access is abstracted, primarily using MySQL via Drizzle ORM for all entities. Authentication supports both Replit Auth (for development) and email/password (for all deployments), with role-based access control and email verification. The system supports multi-tenant branding, allowing tax offices to customize their branding (logo, colors) via subdomain detection and dynamic CSS. Transactional emails are handled via SendGrid, supporting multi-tenant branding and various notification types for CRUD operations.

### Data Storage Solutions
The primary database is MySQL/MariaDB hosted on cPanel/GoDaddy, accessed using Drizzle ORM for type-safe queries. The schema uses UUID primary keys and includes tables for users, sessions, tax_deadlines, appointments, payments, document_versions, e_signatures, and comprehensive `tax_filings` table for per-year tracking with status history. Session management is handled by persisting session data to a MySQL sessions table.

### External Dependencies

**Third-Party UI Libraries**
- Shadcn UI, Radix UI primitives, Lucide React (icons), Recharts (charts), React Day Picker (calendar), Vaul (drawers), CMDK (command palette).

**Database & ORM**
- MySQL2, Drizzle ORM (drizzle-orm/mysql2), Drizzle Kit, Drizzle-Zod.
- cPanel MySQL database (MariaDB 10.6.23).

**Form & Validation**
- React Hook Form, Zod, @hookform/resolvers.

**Styling & Animation**
- Tailwind CSS, PostCSS, Autoprefixer, Class Variance Authority (CVA), clsx, tailwind-merge.

**Email Services**
- SendGrid (for transactional emails).

**File Storage (Dual Environment Support)**
- Document uploads (tax forms, IDs) are stored using Replit Object Storage in development and FTP to GoDaddy in production. File URLs are prefixed (`/objects/`, `/ftp/`, `/perfex-uploads/`) and handled by a unified download route.
- Agent photos for the homepage (`/homepage-agents`) are also stored and served similarly.

**Perfex CRM Integration**
- Data migration included 868 clients and 2,930 documents from Perfex CRM.
- Legacy Perfex documents are accessed via an Express route redirecting to `https://ststaxrepair.org/perfex-uploads/...`.
- Read-only connection to the `perfexcrm` database is maintained for potential future sync.

**Progressive Web App (PWA)**
- Features a service worker (`client/public/sw.js`) for caching strategies (Network First, Cache First, Stale While Revalidate), offline fallback, and push notifications.
- Includes a splash screen, PWA install prompt, offline indicator, update notification, mobile navigation with haptic feedback, and pull-to-refresh.
- Optimized for iOS with Apple touch icons and specific meta tags.
- Manifest configuration (`client/public/manifest.json`) defines PWA identity, launch handler, icons, and display mode.