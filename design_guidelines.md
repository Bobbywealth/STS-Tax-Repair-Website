# STS TaxRepair CRM - Design Guidelines

## Design Approach

**Selected Approach**: Design System (Shadcn UI + Modern Enterprise CRM Patterns)

**Justification**: This is a utility-focused, information-dense enterprise application where efficiency, data clarity, and professional consistency are paramount. Following established CRM design patterns ensures staff productivity and reduces learning curve.

**Key Principles**:
- Clarity over decoration - every element serves a functional purpose
- Consistent patterns across all 10 modules for muscle memory
- Professional, trustworthy aesthetic appropriate for financial/tax data
- Data-first design with excellent information hierarchy
- Accessible and compliant for secure financial operations

## Core Design Elements

### A. Color Palette

**Light Mode Primary**:
- Primary Brand: 217 91% 60% (professional blue - trust and stability)
- Primary Hover: 217 91% 50%
- Background: 0 0% 100%
- Card/Surface: 0 0% 98%
- Border: 220 13% 91%
- Muted Background: 220 14% 96%
- Muted Foreground: 220 9% 46%

**Dark Mode** (for staff working extended hours):
- Primary: 217 91% 60%
- Background: 222 47% 11%
- Card/Surface: 217 33% 17%
- Border: 217 33% 24%
- Muted Background: 217 33% 17%
- Muted Foreground: 215 20% 65%

**Semantic Colors**:
- Success (Refund Approved): 142 76% 36%
- Warning (Pending/Review): 38 92% 50%
- Destructive (Missing Docs): 0 84% 60%
- Info (New Status): 199 89% 48%

### B. Typography

**Font Families**:
- Primary: Inter (Google Fonts) - excellent readability for data-heavy interfaces
- Monospace: JetBrains Mono - for document IDs, file names, codes

**Type Scale**:
- Headings: font-semibold, tracking-tight
- H1: text-3xl (dashboard page titles)
- H2: text-2xl (module section headers)
- H3: text-xl (card titles, client names)
- Body: text-sm (primary content, forms, tables)
- Small: text-xs (metadata, timestamps, helper text)
- Labels: text-sm font-medium

### C. Layout System

**Spacing Primitives**: Consistent use of 2, 4, 6, 8, 12, 16 units
- Component padding: p-4 or p-6
- Section spacing: space-y-6 or space-y-8
- Card gaps: gap-4
- Form field spacing: space-y-4

**Grid System**:
- Sidebar: fixed w-64 (collapsible to w-16 icon-only)
- Main content: flex-1 with max-w-7xl container
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Client lists/tables: full-width with responsive overflow

### D. Component Library

**Navigation**:
- Persistent left sidebar with 10 menu items
- Each item: icon (Lucide React) + label
- Active state: bg-primary text-primary-foreground
- User profile at bottom: avatar + name + role badge
- Collapsible on mobile (hamburger menu)

**Dashboard Cards**:
- White/surface background with subtle border
- Icon in colored circle (matching card's semantic color)
- Large metric number (text-3xl font-bold)
- Label below (text-sm text-muted-foreground)
- Optional trend indicator (↑ 12% from last month)
- Hover: subtle shadow elevation

**Data Tables**:
- Stripe Design pattern: alternating row backgrounds
- Sortable column headers with arrow indicators
- Action column with icon buttons (view, edit, delete)
- Pagination controls at bottom
- Search/filter bar above table
- Row hover: slight background highlight

**Forms**:
- Labels above inputs (text-sm font-medium)
- Input fields: border rounded-md with focus ring (ring-primary)
- Helper text below: text-xs text-muted-foreground
- Required field indicator: asterisk in destructive color
- Error states: border-destructive with error message below
- Form sections grouped with subtle dividers

**Status Badges**:
- Pill-shaped with semantic colors
- Small padding (px-2.5 py-0.5)
- Refund stages: distinct color per stage (New=blue, Review=yellow, Filed=purple, Approved=green, Paid=green-dark)
- Ticket status: similar semantic mapping

**File Upload Zone**:
- Dashed border rectangle
- Center-aligned upload icon and text
- Drag-over state: border-primary bg-primary/5
- File list below with preview thumbnails
- Progress bars during upload
- File type icons for PDFs, images

**Modal/Dialogs**:
- Overlay: bg-black/50 backdrop-blur-sm
- Card: max-w-2xl centered, rounded-lg shadow-lg
- Header with title and close button
- Content area with appropriate padding
- Footer with action buttons (aligned right)

**Buttons**:
- Primary: bg-primary text-primary-foreground (for main actions)
- Secondary: variant="outline" (for cancel, secondary options)
- Destructive: variant="destructive" (delete, critical actions)
- Icon-only buttons: for table actions, toolbar
- Loading state: disabled with spinner

**Charts & Visualizations**:
- Recharts library with brand colors
- Clean, minimal gridlines
- Tooltips on hover with detailed data
- Legend positioned strategically
- Responsive sizing

### E. Module-Specific Patterns

**Client Profile Tabs**:
- Horizontal tab navigation below header
- Tab content area: bg-card with padding
- Each tab: full functionality (documents grid, chat interface, notes editor)

**Kanban Board (Tasks)**:
- 3 columns: To Do, In Progress, Done
- Cards: draggable with task title, assignee avatar, due date, priority badge
- Column headers show count

**Chat Interface**:
- Messages alternate left (client) / right (staff)
- Timestamp below each message
- Input at bottom: textarea + send button + attachment button
- Unread indicator badge

**Knowledge Base**:
- Search bar prominent at top
- Category cards in grid
- Article list with titles, snippets, last updated
- Markdown renderer for article content
- Breadcrumb navigation

## Images

**Logo Placement**: STS TaxRepair logo in sidebar header (above navigation items), sized proportionally

**Profile Avatars**: User photos throughout - sidebar bottom, task assignments, chat messages, client cards. Fallback to initials in colored circle.

**Empty States**: Friendly illustrations (undraw.co style) when no data - "No clients yet", "No pending tasks", "Knowledge base is empty"

**Document Thumbnails**: PDF icon, image previews in document list

**No Hero Image**: This is an internal CRM tool, not a marketing site. Dashboard immediately shows data and cards upon login.

---

**Visual Tone**: Professional, clean, trustworthy. Prioritize clarity and efficiency. Subtle shadows and borders create depth without distraction. Consistent spacing creates rhythm. This is a tool tax professionals will use daily - every pixel should serve their workflow.