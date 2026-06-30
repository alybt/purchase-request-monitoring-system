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
│   ├── auth/
│   │   └── page.tsx                        # Re-exports the root LoginPage
│   ├── dashboard/
│   │   ├── layout.tsx                      # Enforces Auth, retrieves /api/me profile sync
│   │   ├── purchase-requests/
│   │   │   └── page.tsx                    # PR List & Operations Management
│   │   ├── reports/
│   │   │   └── page.tsx                    # Custom CSS/HTML Data Visualization Charts
│   │   ├── users/
│   │   │   └── page.tsx                    # Users List & Provisioning Admin
│   │   └── page.tsx                        # Dashboard Overview, Bottlenecks, Pipeline Table
│   ├── layout.tsx                          # Root html structure and metadata
│   └── page.tsx                            # Root Landing / LoginPage layout
├── components/
│   └── layout/
│       ├── footer.tsx
│       ├── header.tsx                      # Header Navbar displaying user initials avatar
│       └── sidebar.tsx                     # Hover-expand menu with Sign Out triggers
├── features/
│   ├── auth/
│   │   └── components/LoginForm.tsx        # Sign-in form, sets localStorage token/user
│   ├── purchase-requests/
│   │   └── components/
│   │       ├── PRFormModal.tsx             # Create/Edit purchase requests form modal
│   │       ├── PRTableWithActions.tsx      # Table wrapping items with action buttons
│   │       ├── ViewPRModal.tsx             # PR detail layout with Line Items, audit timeline, and Approval Action Panel
│   │       └── DeletePRModal.tsx           # Multi-PR confirm delete alert
│   └── users/
│       └── components/
│           ├── UserFormModal.tsx           # Add/Edit User credentials & metadata
│           ├── UserTableWithActions.tsx    # Table displaying active user lists
│           └── ViewUserModal.tsx           # Detail card for user profiles
├── lib/
│   ├── api.ts                              # Auth configurations and base login utils
│   └── print.ts                            # Print engine and layouts for budgets and PR vouchers
└── services/
    ├── auth.service.ts                     # Login, Logout session revocation, /api/me profile sync
    ├── budget.service.ts                   # Budget summaries, monthly breakdowns, and department allocations
    ├── users.service.ts                    # User CRUD methods & search/filter query builders
    ├── purchase-requests.service.ts        # PR CRUD methods, mapping translations, and Approve/Reject requests
    └── dashboard.service.ts                # Metrics aggregator and Recent Pipeline queries
```

---

## 3. Client-Side Routes & Pages

### A. Login & Landing (`/` and `/auth`)
* Renders the login portal with email and password inputs.
* Stashes `token` and `user` state inside `localStorage` upon success and routes the user to `/dashboard`.

### B. Dashboard Overview (`/dashboard`)
* Displays key statistics: Total Spent, Bottlenecks (Requests pending over 48 hours), and Active System Users.
* Renders a table of the 5 most recent purchase requests in the approval pipeline.

### C. Purchase Request Manager (`/dashboard/purchase-requests`)
* Lists all requests with full-text search and filters.
* Support single or bulk deletions.
* Handles request edits and creation.
* Opens details modal showcasing approval workflows.

### D. User Provisioning Panel (`/dashboard/users`)
* Lists system accounts. Offers filters based on role, status, and department.
* Allows creating and updating accounts.

### E. Reports & Analytics (`/dashboard/reports`)
* Visualizes monthly spending trends using a custom responsive CSS/HTML vertical bar chart.
* Maps department activity percentage breakdowns using inline horizontal progress-meters.

### F. Admin Budget Management (`/admin/budget`)
* Summarizes company-wide allocations, reserved amounts, and spending across departments.
* Features a dynamic period filter supporting fiscal year selection and granular monthly filtering (Full Year or specific months 1–12).
* Includes an interactive **12-Month Breakdown** view modal for each department showing monthly utilization progress bars and exact figures.
* Allows administrators to set or update budget allocations targeted to specific months or the current period.

---

## 4. Key Business Logic & Translations

### Session Authorization Guard
In [dashboard/layout.tsx](file:///c:/Users/pagar/ali-company-projects/PLProject/purchase-request-monitoring-system/frontend/app/dashboard/layout.tsx):
* Directs unauthenticated browsers to `/`.
* Invokes `getCurrentUser()` (`/api/me`) to sync roles and status modifications. If the endpoint rejects the session (expired tokens, deactivated users), the cookies/local keys are cleared and the user is redirected to the login screen.

### Line-Item Relational Mapping
Since the backend database represents purchase requests through relational `line_items` (items list) whereas the frontend UI models it as a single request form (description + amount):
* **On Creation/Update**: The frontend service wraps the user inputs into a relational payload containing a single default line item:
  ```typescript
  {
    purpose_of_requests: description,
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

### Status Logic
Backend statuses (`Request`, `Approve`, `Released`, `Received`) are mapped to user-friendly frontend tags:
* If the request contains any approval entry with status `'Reject'`, the UI labels it as `rejected`.
* Otherwise:
  * `Request` -> `pending`
  * `Approve` -> `approved`
  * `Released` / `Received` -> `completed`

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
