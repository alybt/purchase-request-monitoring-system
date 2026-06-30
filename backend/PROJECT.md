# Purchase Request Monitoring System - Backend Specification

This document provides a complete guide to the backend architecture, features, API endpoints, schema, and directory structure of the **Purchase Request Monitoring System**. It is designed to give AI models and developers a comprehensive understanding of the backend without needing to scan the entire codebase.

---

## 1. Core Technology Stack
* **Framework**: Laravel 11.x (PHP 8.2+)
* **Authentication**: Laravel Sanctum (Token-Based Bearer Auth)
* **Database**: PostgreSQL (Production) / SQLite (Local Test Fallback)
* **Test Suite**: PHPUnit (Feature Testing)

---

## 2. Architecture & Design Decisions
* **RESTful JSON API**: All responses are standard JSON payloads. Unauthenticated requests are rejected with a `401 Unauthorized` response.
* **Separation of Concerns**: Approval tracking and comments are separated from the main purchase request entity via an audit table (`approval_form`).
* **Database Transactions**: Multi-model writes (e.g., creating a purchase request and inserting its line items, or submitting approvals) are wrapped in `DB::transaction()` blocks to prevent orphan records or partial updates.
* **Sequential Numbering**: Purchase requests automatically receive a sequential, unique number in the format `PR-YYYY-XXXX` where `XXXX` is a 4-digit zero-padded integer reset/incremented inside the database logic.

---

## 3. Database Schema & Eloquent Models

### A. Users Table (`users`)
* **Eloquent Model**: `App\Models\User`
* **Fields**:
  * `id` (bigint, PK)
  * `email` (string, unique)
  * `password` (string)
  * `first_name` (string)
  * `last_name` (string)
  * `role` (enum: `'admin'`, `'department_head'` - backward compatible with legacy `'approver'`, `'employee'`)
  * `status` (enum: `'active'`, `'dismissed'`, `'suspended'`)
  * `department_id` (foreign key pointing to `departments.id` - backward compatible with legacy `department` string filter)
  * `timestamps`

### B. Purchase Requests Table (`purchase_requests`)
* **Eloquent Model**: `App\Models\PurchaseRequest`
* **Fields**:
  * `id` (bigint, PK)
  * `pr_number` (string, unique, e.g., `PR-2026-001`)
  * `requested_by` (foreign key pointing to `users.id` - aliased to legacy `user_id`)
  * `purpose` (text - aliased to legacy `purpose_of_requests`)
  * `total_estimated_cost` (decimal, `15, 2`, default `0.00`)
  * `status` (enum: `'Draft'`, `'Submitted'`, `'Approved'`, `'Rejected'`, `'Ordered'`, `'Received'`, `'Released'`, `'Completed'`)
  * `department_id` (foreign key pointing to `departments.id`)
  * `category_id` (foreign key pointing to `categories.id`)
  * `timestamps`

### C. Purchase Request Items Table (`purchase_request_items` / legacy `pr_line_items`)
* **Eloquent Model**: `App\Models\PurchaseRequestItem`
* **Fields**:
  * `id` (bigint, PK)
  * `purchase_request_id` (foreign key pointing to `purchase_requests.id` - legacy `pr_id`)
  * `item_name` (string)
  * `description` (text, nullable)
  * `quantity` (integer)
  * `unit_price` (decimal, `15, 2`)
  * `total_price` (decimal, `15, 2` - calculated automatically as `quantity * unit_price`)
  * `vendor` (string, nullable)
  * `timestamps`

### D. Status History / Audit Logs Table (`purchase_request_status_history` / legacy `approval_form`)
* **Eloquent Model**: `App\Models\PurchaseRequestStatusHistory`
* **Fields**:
  * `id` (bigint, PK)
  * `purchase_request_id` (foreign key pointing to `purchase_requests.id`)
  * `from_status` (string)
  * `to_status` (string)
  * `changed_by` (foreign key pointing to `users.id`)
  * `remarks` (text, nullable)
  * `timestamps`

### E. Department Budgets Table (`department_budgets`)
* **Eloquent Model**: `App\Models\DepartmentBudget`
* **Fields**:
  * `id` (bigint, PK)
  * `department_id` (foreign key pointing to `departments.id`)
  * `fiscal_year` (integer, e.g., `2026`)
  * `month` (integer, `1` to `12`)
  * `allocated_amount` (decimal, `15, 2`)
  * `reserved_amount` (decimal, `15, 2`)
  * `spent_amount` (decimal, `15, 2`)
  * `available_amount` (computed column: `allocated_amount - reserved_amount - spent_amount`)
  * `timestamps`
* **Unique Constraint**: Unique index on `['department_id', 'fiscal_year', 'month']`.

---

## 4. API Endpoints

### Authentication (`AuthController`)
All requests except `/api/login` require the `Authorization: Bearer <token>` header.
* `POST /api/login`: Authenticate email and password. Features a rate limiter (5 attempts per minute). Returns a token and user model.
* `POST /api/logout`: Revoke active Sanctum token.
* `GET /api/me`: Get the currently logged-in user profile.

### User Management (`UserController`)
* `GET /api/users`: List users. Supports query parameters for `search` (name/email), `role`, `status`, and `department`.
* `POST /api/users`: Create a new user. Required fields: `email`, `password`, `first_name`, `last_name`, `role`, `status`, `department`.
* `GET /api/users/{id}`: Fetch single user profile.
* `PUT /api/users/{id}`: Update user profile.
* `DELETE /api/users/{id}`: Delete a user.
* `POST /api/users/bulk-delete`: Delete multiple users. Required JSON body: `{"ids": [1, 2, 3]}`.

### Department & Budget Management (`DepartmentController`)
* `GET /api/departments`: List departments with active budgets aggregated for the current fiscal year.
* `POST /api/departments`: Create a department.
* `PUT /api/departments/{id}`: Update department name/code.
* `PUT /api/departments/{id}/budget`: Create or update a budget allocation for a specific month and fiscal year. Accepts: `allocated_amount` (required), `fiscal_year` (optional, default current year), `month` (optional, default current month).
* `GET /api/departments/budget-summary`: Summarizes allocated, reserved, spent, and available budgets for all departments grouped for the current fiscal year. Supports optional `fiscal_year` and `month` query parameters to filter totals by a specific month. Each department summary also returns a `monthly_breakdown` array containing exact figures for each month (1 to 12).
* `GET /api/departments/{id}/budget-calculations`: Fetch detailed budget calculations for a specific department:
  * **Last 12 Months**: Rolling 12-month summary of budget parameters.
  * **For the Year**: Sum of allocations/spending for the chosen fiscal year.
  * **By Quarter**: Dynamic quarterly calculations for Q1 (months 1-3/1-4), Q2 (months 4-6), Q3 (months 7-9), and Q4 (months 10-12).

### Purchase Request Management (`PurchaseRequestController`)
* `GET /api/purchase-requests`: List purchase requests. Supports query parameters for `search` (PR number), `status`, and `department`.
* `POST /api/purchase-requests`: Create a purchase request. Automatically increments and generates `pr_number`. Required payload:
  ```json
  {
    "purpose_of_requests": "Server Upgrade",
    "line_items": [
      {
        "item_name": "SSD 1TB",
        "description": "Enterprise NVMe",
        "quantity": 5,
        "unit_price": 7500.00,
        "vendor": "Samsung"
      }
    ]
  }
  ```
* `GET /api/purchase-requests/{id}`: Fetch a PR with its `lineItems`, requester `user`, and approval history logs (`approvals.approver`).
* `PUT /api/purchase-requests/{id}`: Update PR details and its line items. (Overwrites existing line items).
* `DELETE /api/purchase-requests/{id}`: Delete a PR.
* `POST /api/purchase-requests/bulk-delete`: Delete multiple PRs. Required JSON body: `{"ids": [1, 2]}`.

### Approvals Workflow (`ApprovalController`)
* `POST /api/purchase-requests/{id}/approve`: Approve a PR. Updates the PR status to `'Approved'` (backward compatible with `'Approve'`) and inserts an audit log into `purchase_request_status_history`. Also atomically increments the department's `reserved_amount`. Optional body: `{"remarks": "Approved budget"}`.
* `POST /api/purchase-requests/{id}/reject`: Reject a PR. Updates status to `'Rejected'` and inserts a log into `purchase_request_status_history`. Decrements `reserved_amount` if previously reserved. Optional body: `{"rejection_reason": "Incorrect pricing", "remarks": "Too expensive"}`.

### Dashboard Analytics (`DashboardController`)
* `GET /api/dashboard/metrics`: Compiles summary statistics:
  * `total_spent`: Cost sum of PRs in `'Approved'`, `'Released'`, `'Received'`, or `'Completed'` status.
  * `total_spent_change_percentage`: Percentage spent change compared to last month.
  * `bottlenecks`: Number of requests with status `'Submitted'` or `'Draft'` pending over 48 hours.
  * `active_users`: Active users count.
  * `monthly_data`: Sum of spending per month for the last 6 months.
  * `department_breakdown`: Item count and total cost per department.
* `GET /api/dashboard/recent-prs`: List of the 5 most recently created PRs.
* `GET /api/dashboard/pending-approvals`: List of all PRs still in `'Submitted'` or `'Draft'` status awaiting approval.

---

## 5. Directory Structure (Core Files)

```text
backend/
├── app/
│   ├── Http/
│   │   ├── Middleware/
│   │   │   └── CheckRole.php               # RBAC role verification middleware
│   │   └── Controllers/
│   │       ├── AuthController.php          # Session log in/out, rate limits
│   │       ├── UserController.php          # Users CRUD, pagination, and search filters
│   │       ├── PurchaseRequestController.php # PR sequential number with lockForUpdate, transactions
│   │       ├── ApprovalController.php      # State transitions, separation of duties & atomic budget sync
│   │       └── DashboardController.php     # Summary analytics & monthly aggregation
│   └── Models/
│       ├── User.php
│       ├── PurchaseRequest.php             # HasMany PurchaseRequestItems, HasMany StatusHistory
│       ├── PurchaseRequestItem.php         # BelongsTo PurchaseRequest (legacy LineItem)
│       └── PurchaseRequestStatusHistory.php # BelongsTo PurchaseRequest/User (legacy ApprovalForm)
├── database/
│   ├── migrations/
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 2026_06_09_000002_create_purchase_requests_table.php
│   │   ├── 2026_06_09_000003_create_line_items_table.php
│   │   ├── 2026_06_09_000004_create_approval_form_table.php
│   │   ├── 2026_06_22_000011_refactor_users_table.php
│   │   ├── 2026_06_22_000011_rename_pr_line_items_table.php
│   │   ├── 2026_06_22_000012_drop_approval_form_table.php
│   │   └── 2026_06_22_000012_refactor_purchase_requests_table.php
│   └── seeders/
│       └── DatabaseSeeder.php              # Seeds default users and mock data
├── routes/
│   └── api.php                             # Contains all API route definitions
└── tests/
    └── Feature/
        ├── AuthTest.php
        ├── UserTest.php
        ├── PurchaseRequestTest.php
        ├── ApprovalTest.php
        └── DashboardTest.php
```

---

## 6. Development & Verification Commands
* Run Backend Migrations & Seed Database:
  ```bash
  php artisan migrate:fresh --seed
  ```
* Run Backend Feature Tests:
  ```bash
  php artisan test
  ```
* Run Local PHP Dev Server:
  ```bash
  php artisan serve
  ```
