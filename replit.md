# STS TaxRepair CRM System

## Overview

STS TaxRepair is a next-generation web-based CRM system designed for tax refund companies to manage clients, leads, tasks, and support operations. The application enables clients to sign up, upload tax documents, track refund progress, and communicate with assigned tax preparers. Staff members can manage the complete client lifecycle through a unified dashboard with comprehensive business tools.

The system is built as a full-stack TypeScript application with a React frontend and Express backend, designed for secure handling of sensitive financial and tax data. The platform supports role-based access control (Admin, Staff/Manager, Client) and provides a complete suite of features including client management, lead tracking, task coordination, support ticketing, knowledge base, and analytics reporting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing instead of React Router
- TanStack React Query (v5) for server state management, caching, and data fetching

**UI Component System**
- Shadcn UI component library (New York style variant) providing accessible, customizable components
- Radix UI primitives as the foundation for all interactive components (dialogs, dropdowns, menus, etc.)
- Tailwind CSS for utility-first styling with custom design tokens
- Custom CSS variables for theming with light/dark mode support via class-based theme switching

**Design System**
- Professional enterprise CRM aesthetic optimized for information-dense interfaces
- Custom color palette: Primary blue (217 91% 60%) for trust/stability, semantic colors for status indication
- Typography: Inter font family for readability in data-heavy UIs, JetBrains Mono for monospace content
- Consistent interaction patterns with hover/active states using CSS custom properties (--elevate-1, --elevate-2)
- Responsive grid layouts with mobile-first approach

**State Management Pattern**
- Server state managed through React Query with stale-while-revalidate caching strategy
- Local UI state handled with React hooks (useState, useReducer)
- Form state managed via React Hook Form with Zod schema validation
- No global state management library (Redux/Zustand) - relying on composition and React Query

**Key Frontend Features**
- Persistent collapsible sidebar navigation (16rem width) with 10 main sections
- Dashboard with statistics cards, activity feeds, and chart visualizations (Recharts library)
- Multi-step forms with validation for client onboarding and document uploads
- Real-time status tracking with visual progress indicators
- Kanban-style task board with drag-and-drop capabilities
- Data tables with search, filtering, and inline editing
- Theme toggle for light/dark mode persistence in localStorage

### Backend Architecture

**Server Framework**
- Express.js as the HTTP server with middleware-based request processing
- TypeScript with ES modules for modern JavaScript features and type safety
- Custom request logging middleware tracking API response times and payloads

**API Design**
- RESTful API with all routes prefixed under `/api`
- JSON request/response format with content-type validation
- Session-based authentication planned (credentials: "include" in fetch calls)
- Centralized error handling with consistent error response format

**Data Access Layer**
- Storage abstraction interface (IStorage) enabling flexible backend implementations
- MySQL storage (MySQLStorage class) connected to cPanel/GoDaddy MySQL database
- All entities fully backed by MySQL via Drizzle ORM (users, appointments, payments, e-signatures, etc.)
- Storage methods for CRUD operations with proper async/await patterns
- Ready for deployment to Render with cPanel MySQL backend

**Authentication Strategy**
- Dual authentication system supporting both Replit Auth (for Replit deployment) and email/password (for all deployments)
- Conditional Replit Auth: Only initializes if REPL_ID and REPLIT_DOMAINS environment variables exist
- For Render deployment: Uses email/password authentication only (Replit Auth skipped automatically)
- Role-based access control: Admin, Staff/Manager, Client roles
- Session-based auth with PostgreSQL session storage via connect-pg-simple
- Email verification and password reset flows via SendGrid integration (planned)
- Admin user invitation system for internal staff onboarding

**Render Deployment Notes**
- App automatically detects non-Replit environment and disables Replit Auth
- Staff login redirects to client login page with notice when Replit Auth unavailable
- All authorization middleware checks both `req.user` (Replit Auth) AND `req.userId` (session auth)
- MySQLStore uses shared connection pool (`mysqlPool`) to prevent connection exhaustion
- CORS configured with credentials support for cross-origin requests
- Session cookies use `sameSite: 'none'` in production for cross-origin cookie handling
- Required environment variables for Render: SESSION_SECRET, MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD

### Data Storage Solutions

**Database System**
- MySQL/MariaDB as the production database via cPanel/GoDaddy hosting
- Drizzle ORM for type-safe database queries and schema management
- Connection pooling through mysql2/promise with keepalive support
- Database configuration via MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD environment variables
- Remote MySQL access enabled for external connections (Render deployment ready)

**Schema Design**
- MySQL-compatible schema with UUID primary keys generated via MySQL UUID() function
- Drizzle-Zod integration for automatic Zod schema generation from database schema
- Schema definitions in /shared/mysql-schema.ts for MySQL-specific types
- Tables: users, sessions, tax_deadlines, appointments, payments, document_versions, e_signatures, email_logs, document_request_templates, tax_filings

**Tax Filings Per-Year Tracking**
- tax_filings table with unique constraint on (client_id, tax_year) for per-year filing management
- Status enum: new, documents_pending, review, filed, accepted, approved, paid
- Tracks refund amounts (federal, state), date transitions (filed_date, approved_date, paid_date)
- Preparer assignment (prepared_by, reviewed_by) for accountability
- Status history stored as JSON for audit trail
- API endpoints: GET /api/tax-filings (with year/status filters), POST /api/tax-filings, PATCH /api/tax-filings/:id/status, GET /api/tax-filings/metrics (aggregated counts)
- Frontend: Year selector dropdown on Clients page, filing history timeline on Client Detail page

**Session Management**
- Session storage supported via MySQL sessions table
- Session data persisted to database for scalability across server instances

### External Dependencies

**Third-Party UI Libraries**
- Shadcn UI (component collection, not a package dependency)
- Radix UI primitives (@radix-ui/* packages) for accessible component foundations
- Lucide React for consistent icon system
- Recharts for data visualization (charts and graphs)
- React Day Picker for calendar/date selection components
- Vaul for drawer/bottom sheet components
- CMDK for command palette interfaces

**Database & ORM**
- MySQL2 (mysql2) - MySQL/MariaDB driver with promise support
- Drizzle ORM (drizzle-orm/mysql2) - Type-safe SQL query builder for MySQL
- Drizzle Kit (drizzle-kit) - Schema migration and management tool
- Drizzle-Zod integration for validation schema generation
- cPanel MySQL database on GoDaddy hosting (MariaDB 10.6.23)

**Form & Validation**
- React Hook Form for performant form state management
- Zod for runtime type validation and schema definition
- @hookform/resolvers for Zod integration with React Hook Form

**Styling & Animation**
- Tailwind CSS with PostCSS for CSS processing
- Autoprefixer for browser compatibility
- Class Variance Authority (CVA) for component variant management
- clsx and tailwind-merge for conditional class name composition

**Development Tools**
- TSX for running TypeScript in development
- ESBuild for production server bundling
- Vite plugins: @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner

**Email Services** (Planned)
- SendGrid for transactional emails (verification, password reset, notifications)

**File Storage**
- Document upload system for tax forms (W-2, 1099, ID scans)
- File type validation and size limits (max 5MB for images)
- New uploads: Replit Object Storage (bucket: replit-objstore-793ab189-6e24-48a6-80da-c5b02a536f27)
- Legacy documents: Served from Perfex CRM at https://ststaxrepair.org via redirect

### Perfex CRM Integration

**Data Migration**
- 868 real clients migrated from Perfex CRM `tblclients` table
- 2,930 documents imported from Perfex CRM `tblfiles` table
- Client IDs prefixed with "perfex-" (e.g., perfex-100) for imported records

**Document Access**
- Perfex documents stored at paths like `/perfex-uploads/uploads/customers/{id}/filename`
- Express route redirects `/perfex-uploads/*` to `https://ststaxrepair.org/perfex-uploads/...`
- Document metadata stored in MySQL `document_versions` table

**Database Connections**
- Primary CRM: MySQL database `tax_7648995` on cPanel server
- Perfex read-only: MySQL database `perfexcrm` on same server (for future sync if needed)
- Connection module: `server/perfex-db.ts`