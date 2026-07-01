# Purchase Request Monitoring System - Frontend Specification

This document provides a complete guide to the frontend architecture, features, directory layout, route mapping, and core logic of the **Purchase Request Monitoring System**. It is designed to give AI models and developers a comprehensive understanding of the frontend without needing to scan the entire codebase.

---

## 1. Core Technology Stack
* **Framework**: Next.js 16.x (App Router, React 19)
* **Styling**: Tailwind CSS v4.0 (Custom design system variables defined in `index.css`)
* **Language**: TypeScript (Type check passing)
* **API Communication**: Native HTTP `fetch` client

---

## 2. Directory Layout & Key Modules

```text
frontend/
├── app/
│   ├── admin/                              # Dedicated portal for Admin role
│   │   ├── budget/page.tsx                 # Company annual & monthly budget allocations
│   │   ├── categories/page.tsx             # PR Category management (CRUD & bulk delete)
│   │   ├── dashboard/page.tsx              # Admin executive metrics overview
│   │   ├── departments/page.tsx            # Department & monthly budget management
│   │   ├── pr-management/page.tsx          # Admin PR review and pipeline oversight
│   │   ├── procurement/page.tsx            # Procurement oversight & fulfillment
│   │   ├── purchase-requests/page.tsx      # Admin purchase requests view
│   │   ├── reports/page.tsx                # Data visualization & expenditure charts
│   │   ├── users/page.tsx                  # User provisioning & account management
│   │   └── layout.tsx                      # Admin layout guard & role-based sidebar
│   ├── auth/page.tsx                       # Re-exports login page
│   ├── change-password/page.tsx            # Mandatory onboarding / self-service password update
│   ├── dashboard/                          # Standard employee / user portal
│   │   ├── purchase-requests/page.tsx      # PR List & Operations Management
│   │   ├── reports/page.tsx                # Custom CSS/HTML Data Visualization Charts
│   │   ├── users/page.tsx                  # Users List & Provisioning
│   │   ├── layout.tsx                      # Enforces Auth, retrieves /api/me profile sync
│   │   └── page.tsx                        # Dashboard Overview, Bottlenecks, Pipeline Table
│   ├── department-head/                    # Dedicated portal for Department Head role
│   │   ├── budget-monitoring/page.tsx      # Real-time department budget & category utilization
│   │   ├── budget-planning/page.tsx        # Department fiscal year planning
│   │   ├── dashboard/page.tsx              # Department head dashboard metrics
│   │   ├── profile/page.tsx                # User profile management
│   │   ├── purchase-requests/page.tsx      # PR review, approval, rejection, and oversight
│   │   └── layout.tsx                      # Department Head layout guard & sidebar
│   ├── login/page.tsx                      # Login screen
│   ├── layout.tsx                          # Root HTML structure and metadata
│   └── page.tsx                            # Root Landing / LoginPage redirection
├── components/
│   ├── DisableNumberInputScroll.tsx        # Utility preventing mousewheel scroll on number inputs
│   ├── layout/
│   │   ├── AppSidebar.tsx                  # Modern role-aware sidebar navigation
│   │   ├── AppTopbar.tsx                   # Top navigation bar with user profile & logout
│   │   ├── footer.tsx
│   │   ├── header.tsx                      # Legacy header navbar displaying initials avatar
│   │   └── sidebar.tsx                     # Legacy hover-expand menu
│   └── ui/                                 # Reusable UI component library
│       ├── ActivityFeed.tsx                # Recent actions activity stream display
│       ├── ApprovalTimeline.tsx            # Status transitions & approval timeline
│       ├── DashboardCharts.tsx             # Expenditure data visualization charts
│       ├── DeleteConfirmationModal.tsx     # Generic alert modal for single/bulk item deletion
│       ├── EmptyState.tsx                  # Placeholder component for empty lists/tables
│       ├── FiscalYearSelector.tsx          # Dropdown selector for filtering data by fiscal year
│       ├── PageHeader.tsx                  # Consistent title, subtitle, and action header
│       ├── SearchFilters.tsx               # Reusable search input and dropdown filter bar
│       ├── StatCard.tsx                    # KPI card component showing metrics and percentages
│       └── StatusBadge.tsx                 # Color-coded lifecycle stage badge indicator
├── features/
│   ├── auth/components/LoginForm.tsx       # Sign-in form, sets localStorage token/user
│   ├── categories/components/
│   │   └── CategoryModals.tsx              # Create, edit, view, and delete category modals
│   ├── departments/components/
│   │   └── DepartmentModals.tsx            # Create, edit, view, delete departments & budget modals
│   ├── purchase-requests/components/
│   │   ├── DeletePRModal.tsx               # Multi-PR confirm delete alert
│   │   ├── PRFormModal.tsx                 # Create/Edit purchase requests form modal
│   │   ├── PRTable.tsx                     # Standard PR data table
│   │   ├── PRTableWithActions.tsx          # Interactive table with action triggers
│   │   └── ViewPRModal.tsx                 # PR detail view with Line Items, audit timeline, & approvals
│   └── users/components/
│       ├── AddUserModal.tsx                # Create/Edit user credentials modal
│       ├── DeleteUserModal.tsx             # Account deletion confirmation modal
│       ├── UserTable.tsx                   # Interactive table displaying user accounts
│       └── ViewUserModal.tsx               # Detail card for user profiles
├── lib/
│   ├── api.ts                              # Base API fetch client utilities
│   ├── auth-utils.ts                       # Auth storage helpers, role verification, password redirects
│   ├── nav-config.tsx                      # Role-based navigation config & menu definitions
│   └── print.ts                            # Print engine and layouts for budgets and PR vouchers
└── services/
    ├── auth.service.ts                     # Login, logout, session revocation, /api/me profile sync
    ├── budget.service.ts                   # Budget summaries, monthly breakdowns, and allocations
    ├── dashboard.service.ts                # Metrics aggregator and Recent Pipeline queries
    ├── purchase-requests.service.ts        # PR CRUD methods, attachments, approvals, and rejections
    └── users.service.ts                    # User CRUD methods & search/filter query builders
```

---

## 3. Client-Side Routes & Pages

### A. Authentication & Onboarding (`/login`, `/auth`, `/change-password`)
* **Login (`/login` and `/auth`)**: Renders the login portal with email and password inputs. Stashes `token` and `user` state inside `localStorage` upon success.
* **Password Change (`/change-password`)**: Dedicated onboarding and account management screen. Intercepts logins where the user profile has `must_change_password: true`, forcing the user to update their password before accessing any portal routes.

### B. Role-Based Portals (`/admin/*`, `/department-head/*`, `/dashboard/*`)
The application implements three role-segregated portal layouts:

1. **Admin Portal (`/admin/*`)**:
   * **`/admin/dashboard`**: Executive metrics overview showing total expenditure, bottleneck counts, active users, 6-month monthly expenditure trends, and department breakdowns.
   * **`/admin/users`**: Complete user lifecycle management (provisioning, role assignment, status updates, bulk deletions).
   * **`/admin/departments`**: Department management along with granular monthly and annual budget allocation. Features a **12-Month Breakdown** modal viewing exact monthly budget utilization.
   * **`/admin/categories`**: Purchase request category management (creating, editing, and bulk deleting request categories).
   * **`/admin/purchase-requests` & `/admin/pr-management`**: Administrative oversight of all organization-wide purchase requests.
   * **`/admin/procurement`**: Fulfillment and procurement status tracking.
   * **`/admin/budget`**: Annual company fiscal year budget management with carry-forward tracking.
   * **`/admin/reports`**: Data visualization charts and expenditure analytics.

2. **Department Head Portal (`/department-head/*`)**:
   * **`/department-head/dashboard`**: Department-specific metric totals and recent request pipeline.
   * **`/department-head/purchase-requests`**: Reviewing, approving (`/approve`), rejecting (`/reject`), and monitoring departmental requests.
   * **`/department-head/budget-monitoring`**: Real-time tracking of department budget allocations across categories, showing allocated, reserved, spent, and available funds.
   * **`/department-head/budget-planning`**: Planning tool for upcoming department fiscal allocations.
   * **`/department-head/profile`**: Department head user profile management.

3. **Standard Employee / General Dashboard (`/dashboard/*`)**:
   * **`/dashboard`**: Employee dashboard overview displaying relevant stats and recent submissions.
   * **`/dashboard/purchase-requests`**: Request management portal where employees can create new PRs (selecting category and uploading supporting attachments), view status transition timelines, and print vouchers.
   * **`/dashboard/reports`**: Department expenditure charts.

---

## 4. Key Business Logic & Translations

### Session Authorization & Role Routing Guard
In layout guards (`app/dashboard/layout.tsx`, `app/admin/layout.tsx`, `app/department-head/layout.tsx`):
* Unauthenticated visitors are redirected to `/login`.
* Invokes `/api/me` via `getCurrentUser()` to verify active sessions. If token verification fails or user status is inactive, local storage and cookies are cleared and the user is redirected to `/login`.
* Uses role verification helpers (`lib/auth-utils.ts` and `lib/nav-config.tsx`) to render role-specific navigation sidebars (`AppSidebar.tsx`) and topbars (`AppTopbar.tsx`).

### Mandatory Password Reset Interception
* When a user logs in via `LoginForm.tsx` or navigates through layout guards, the client checks `user.must_change_password`.
* If true, route guards block access to standard dashboard endpoints and redirect the browser directly to `/change-password` until the user completes the password update process.

### Line-Item Relational Mapping
Since the backend database represents purchase requests through relational `purchase_request_items` whereas the frontend UI models it as a single request form (description + amount):
* **On Creation/Update**: The frontend service wraps user inputs into a relational payload containing a single default item:
  ```typescript
  {
    purpose_of_requests: description,
    category_id: categoryId,
    line_items: [
      {
        item_name: description.substring(0, 50) || "General Purchase Item",
        description: description,
        quantity: 1,
        unit_price: amount,
        vendor: "General Vendor"
      }
    ]
  }
  ```

### Status Logic & Badge Formatting
Backend lifecycle statuses (`Draft`, `Submitted`, `Approved`, `Rejected`, `Ordered`, `Received`, `Released`, `Completed`) are mapped to visual badge styles via `StatusBadge.tsx`:
* `Rejected` -> Red badge indicating request denial.
* `Submitted` / `Draft` -> Yellow/Orange badge indicating pending review.
* `Approved` / `Ordered` -> Blue badge indicating active procurement.
* `Released` / `Received` / `Completed` -> Green badge indicating successful completion.

### Print Engine & Sign-Off Generation
Located in [lib/print.ts](file:///c:/Users/pagar/ali-company-projects/PLProject/purchase-request-monitoring-system/frontend/lib/print.ts):
* **Format**: Programmatically compiles HTML templates with clean, A4-friendly inline CSS styling.
* **Voucher Signatures**: Appends physical sign-off lines at the bottom for "Requested By" and "Approved By".
* **Execution**: Dynamically spawns a temporary hidden `iframe`, injects the styled markup, focuses the iframe, and triggers the system print prompt (`window.print()`), destroying the iframe upon completion to prevent page pollution.

---

## 5. Build and Type Checking Commands
Ensure your terminal directory is in `frontend/` before executing:
* **Start local hot-reload development server**:
  ```bash
  npm run dev
  ```
* **Verify type safety and compile check**:
  ```bash
  npx tsc --noEmit
  ```
* **Build optimized production static bundle**:
  ```bash
  npm run build
  ```
