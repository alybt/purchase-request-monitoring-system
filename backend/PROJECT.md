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
* **Sequential Numbering**: Purchase requests automatically receive a sequential, unique number in the format `PR-YYYY-XXX` where `XXX` is a 3-digit zero-padded integer (e.g., `PR-2026-001`) reset/incremented inside the controller logic with table-level row locking (`lockForUpdate()`).

---

## 3. Database Schema & Eloquent Models

### A. Users Table (`users`)
* **Eloquent Model**: `App\Models\User`
* **Fields**:
  * `id` (bigint, PK)
  * `email` (string, unique)
  * `password` (string, hidden in JSON responses)
  * `must_change_password` (boolean, default `false` - indicates forced password reset upon first login)
  * `password_changed_at` (timestamp, nullable)
  * `first_name` (string)
  * `middle_name` (string, nullable)
  * `last_name` (string)
  * `role` (enum: `'admin'`, `'department_head'` - backward compatible with legacy `'approver'`, `'employee'`)
  * `status` (enum: `'active'`, `'dismissed'`, `'suspended'`)
  * `department_id` (foreign key pointing to `departments.id` - backward compatible with legacy `department` string filter)
  * `timestamps`
* **Computed Accessors**:
  * `full_name`: Returns trimmed concatenation of `first_name`, `middle_name`, and `last_name`.

### B. Departments Table (`departments`)
* **Eloquent Model**: `App\Models\Department`
* **Fields**:
  * `id` (bigint, PK)
  * `name` (string, unique)
  * `code` (string, unique)
  * `description` (text, nullable)
  * `budget_allocation` (decimal, `15, 2`, default `0.00`)
  * `allocation_percentage` (decimal, `5, 2`, default `0.00`)
  * `timestamps`
* **Relationships**: HasMany `users`, HasMany `departmentBudgets`, HasMany `purchaseRequests`, HasMany `departmentHeads` (users scoped by role `'department_head'`).

### C. Categories Table (`categories`)
* **Eloquent Model**: `App\Models\Category`
* **Fields**:
  * `id` (bigint, PK)
  * `code` (string, unique)
  * `name` (string, unique)
  * `description` (text, nullable)
  * `timestamps`
* **Relationships**: HasMany `departmentCategoryBudgets`, HasMany `purchaseRequests`.

### D. Company Budgets Table (`company_budgets`)
* **Eloquent Model**: `App\Models\CompanyBudget`
* **Fields**:
  * `id` (bigint, PK)
  * `fiscal_year` (integer, unique)
  * `total_budget` (decimal, `15, 2`, default `0.00` - renamed from legacy `approved_budget`)
  * `carry_forward` (decimal, `15, 2`, default `0.00`)
  * `allocated_amount` (decimal, `15, 2`, default `0.00`)
  * `available_amount` (computed column: `total_budget - allocated_amount`)
  * `timestamps`
* **Computed Accessors**:
  * `utilization_percentage`: Computed percentage of `allocated_amount` relative to `total_budget`.

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
  * `available_amount` (computed column / virtual accessor: `allocated_amount - reserved_amount - spent_amount`)
  * `timestamps`
* **Unique Constraint**: Unique index on `['department_id', 'fiscal_year', 'month']`.
* **Computed Accessors**:
  * `utilization_percentage`: Computed percentage of `(reserved_amount + spent_amount)` relative to `allocated_amount`.

### F. Department Category Budgets Table (`department_category_budgets`)
* **Eloquent Model**: `App\Models\DepartmentCategoryBudget`
* **Fields**:
  * `id` (bigint, PK)
  * `department_budget_id` (foreign key pointing to `department_budgets.id`)
  * `category_id` (foreign key pointing to `categories.id`)
  * `allocated_amount` (decimal, `15, 2`, default `0.00`)
  * `reserved_amount` (decimal, `15, 2`, default `0.00`)
  * `spent_amount` (decimal, `15, 2`, default `0.00`)
  * `available_amount` (computed column: `allocated_amount - reserved_amount - spent_amount`)
  * `timestamps`
* **Unique Constraint**: Unique index on `['department_budget_id', 'category_id']`.
* **Computed Accessors**:
  * `utilization_percentage`: Computed percentage of `(reserved_amount + spent_amount)` relative to `allocated_amount`.

### G. Purchase Requests Table (`purchase_requests`)
* **Eloquent Model**: `App\Models\PurchaseRequest`
* **Fields**:
  * `id` (bigint, PK)
  * `pr_number` (string, unique, e.g., `PR-2026-001`)
  * `requested_by` (foreign key pointing to `users.id` - aliased to virtual attribute `user_id`)
  * `approved_by` (foreign key pointing to `users.id`, nullable)
  * `department_id` (foreign key pointing to `departments.id`)
  * `category_id` (foreign key pointing to `categories.id`, nullable)
  * `purpose` (text - aliased to virtual attribute `purpose_of_requests`)
  * `total_estimated_cost` (decimal, `15, 2`, default `0.00`)
  * `status` (enum: `'Draft'`, `'Submitted'`, `'Approved'`, `'Rejected'`, `'Ordered'`, `'Received'`, `'Released'`, `'Completed'`)
  * `remarks` (text, nullable)
  * `rejection_reason` (text, nullable)
  * `submitted_at`, `approved_at`, `ordered_at`, `received_at`, `released_at`, `completed_at` (nullable datetime tracking fields)
  * `timestamps`

### H. Purchase Request Items Table (`purchase_request_items` / legacy `pr_line_items`)
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

### I. Purchase Request Attachments Table (`purchase_request_attachments`)
* **Eloquent Model**: `App\Models\PurchaseRequestAttachment`
* **Fields**:
  * `id` (bigint, PK)
  * `purchase_request_id` (foreign key pointing to `purchase_requests.id`)
  * `file_name` (string, 255)
  * `file_path` (string, 500)
  * `file_size` (bigint)
  * `file_type` (string, 100)
  * `uploaded_by` (foreign key pointing to `users.id`)
  * `created_at` (`UPDATED_AT` is `null`)
* **Computed Accessors**:
  * `download_url`: Generates absolute download URL `/api/purchase-requests/{pr_id}/attachments/{id}/download`.

### J. Status History / Audit Logs Table (`purchase_request_status_history` / legacy `approval_form`)
* **Eloquent Model**: `App\Models\PurchaseRequestStatusHistory`
* **Fields**:
  * `id` (bigint, PK)
  * `purchase_request_id` (foreign key pointing to `purchase_requests.id`)
  * `from_status` (string, nullable)
  * `to_status` (string)
  * `changed_by` (foreign key pointing to `users.id`)
  * `remarks` (text, nullable)
  * `created_at` (`UPDATED_AT` is `null`)

---

## 4. API Endpoints

### Authentication (`AuthController`)
All requests except `/api/login` require the `Authorization: Bearer <token>` header.
* `POST /api/login`: Authenticate email and password. Features a rate limiter (5 attempts per minute). Returns a token and user profile payload (including `must_change_password` flag).
* `POST /api/logout`: Revoke active Sanctum token.
* `GET /api/me`: Get the currently logged-in user profile payload.
* `POST /api/change-password`: Update user password. Required when `must_change_password` is true or for self-service updates. Validates `current_password` and confirmed `new_password` (minimum 8 chars, alphanumeric).

### User Management (`UserController`)
* `GET /api/users`: List users. Supports query parameters for `search` (name/email), `role`, `status`, and `department`.
* `POST /api/users` *(Admin only)*: Create a new user. Required fields: `email`, `password`, `first_name`, `last_name`, `role`, `status`, `department`.
* `GET /api/users/{id}`: Fetch single user profile.
* `PUT /api/users/{id}` *(Admin only)*: Update user profile.
* `DELETE /api/users/{id}` *(Admin only)*: Delete a user.
* `POST /api/users/bulk-delete` *(Admin only)*: Delete multiple users. Required JSON body: `{"ids": [1, 2, 3]}`.

### Category Management (`CategoryController`)
* `GET /api/categories`: List all categories ordered by name (`id`, `name`, `code`, `description`).
* `POST /api/categories` *(Admin only)*: Create a category. Required payload: `{"name": "Hardware", "code": "HW", "description": "IT hardware"}`.
* `PUT /api/categories/{id}` *(Admin only)*: Update category name, code, or description.
* `DELETE /api/categories/{id}` *(Admin only)*: Delete a category (prevented if linked to existing purchase requests).
* `POST /api/categories/bulk-delete` *(Admin only)*: Bulk delete categories not linked to purchase requests.

### Company Budget Management (`CompanyBudgetController`)
* `GET /api/company-budget`: List all annual company budget records ordered by fiscal year descending.
* `GET /api/company-budget/{fiscalYear}`: Fetch company budget details for a specific fiscal year.
* `POST /api/company-budget` *(Admin only)*: Upsert annual company budget. Enforces sequential fiscal year creation rule and validates that `carry_forward` amount does not exceed the previous fiscal year's remaining unspent/unreserved balance.
* `DELETE /api/company-budget/{fiscalYear}` *(Admin only)*: Delete a company budget record for a given fiscal year.

### Department & Budget Management (`DepartmentController`)
* `GET /api/departments`: List departments with active budgets aggregated for the current fiscal year.
* `POST /api/departments` *(Admin only)*: Create a department (`name`, `code`, `description`).
* `PUT /api/departments/{id}` *(Admin only)*: Update department name/code/description.
* `DELETE /api/departments/{id}` *(Admin only)*: Delete a department (prevented if users are currently assigned).
* `POST /api/departments/bulk-delete` *(Admin only)*: Bulk delete departments without assigned users.
* `PUT /api/departments/{id}/budget` *(Admin only)*: Create or update a budget allocation for a specific month and fiscal year. Guards against lowering allocation below existing `reserved + spent` amounts.
* `DELETE /api/departments/{id}/budget` *(Admin only)*: Delete or reset a department budget record. If active reservations/spend exist, sets `allocated_amount = reserved_amount + spent_amount`; otherwise deletes the record.
* `POST /api/departments/budget/bulk-delete` *(Admin only)*: Bulk delete or reset department monthly budgets.
* `GET /api/departments/budget-summary`: Summarizes allocated, reserved, spent, and available budgets for all departments grouped for the current fiscal year. Supports optional `fiscal_year` and `month` query parameters. Returns full 12-month breakdown per department.
* `GET /api/departments/{id}/budget-calculations`: Fetch detailed budget calculations for a specific department (rolling last 12 months, full year summary, and dynamic quarterly breakdowns).

### User & Category Budget Tracking (`BudgetController`)
* `GET /api/budget/my-department`: Returns the authenticated user's active department budget for the current fiscal year, including a detailed breakdown across all category budgets (`allocated`, `reserved`, `spent`, `available`, and `percentage`).
* `GET /api/budget/category/{categoryId}`: Returns budget tracking details for a specific category within the authenticated user's department.

### Purchase Request Management (`PurchaseRequestController`)
* `GET /api/purchase-requests`: List purchase requests. Supports query parameters for `search` (PR number, purpose, requester name/email), `status`, and `department`.
* `POST /api/purchase-requests`: Create a purchase request. Automatically increments and generates `pr_number` with table locking.
* `GET /api/purchase-requests/{id}`: Fetch a PR with its `items`, requester `user`, `attachments`, and status history logs.
* `PUT /api/purchase-requests/{id}`: Update PR details and line items. Automatically records status transition history and atomically adjusts spent/reserved amounts across `DepartmentBudget` and `DepartmentCategoryBudget` when transitioning to completed/released states.
* `DELETE /api/purchase-requests/{id}`: Delete a PR.
* `POST /api/purchase-requests/bulk-delete` *(Admin only)*: Delete multiple PRs.
* `POST /api/purchase-requests/{id}/attachments`: Upload supporting files (`files[]`) to a purchase request (max 10MB per file).
* `GET /api/purchase-requests/{prId}/attachments/{attachmentId}/download`: Download an attachment file.
* `DELETE /api/purchase-requests/{prId}/attachments/{attachmentId}`: Delete an attachment.

### Approvals Workflow (`ApprovalController`)
* `POST /api/purchase-requests/{id}/approve` *(Admin & Department Head only)*: Approve a PR. Updates status to `'Approved'`, inserts status history audit log, and atomically increments `reserved_amount` with `lockForUpdate()` on both `DepartmentBudget` and `DepartmentCategoryBudget`. Prevents self-approval.
* `POST /api/purchase-requests/{id}/reject` *(Admin & Department Head only)*: Reject a PR. Updates status to `'Rejected'`, inserts audit log, and decrements `reserved_amount` on `DepartmentBudget` and `DepartmentCategoryBudget` if previously reserved. Prevents self-rejection.

### Dashboard Analytics (`DashboardController`)
* `GET /api/dashboard/metrics`: Compiles summary statistics (`total_spent`, percentage change vs last month, `bottlenecks` count of requests pending >48 hours, `active_users`, 6-month monthly expenditure history, and department PR/spending breakdown).
* `GET /api/dashboard/recent-prs`: List of the 5 most recently created PRs.
* `GET /api/dashboard/pending-approvals`: List of PRs in `'Submitted'` status awaiting approval.

---

## 5. Directory Structure (Core Files)

```text
backend/
├── app/
│   ├── Http/
│   │   ├── Middleware/
│   │   │   └── CheckRole.php                    # RBAC verification middleware (admin, department_head)
│   │   └── Controllers/
│   │       ├── AuthController.php               # Login, logout, profile token checks, password change
│   │       ├── UserController.php               # User CRUD, filtering, pagination, bulk deletion
│   │       ├── CategoryController.php           # Category CRUD and bulk deletion
│   │       ├── CompanyBudgetController.php      # Annual company budget upsert with carry-forward limits
│   │       ├── DepartmentController.php         # Department & monthly budget allocations, 12-month summary
│   │       ├── BudgetController.php             # User department & category budget breakdown tracking
│   │       ├── PurchaseRequestController.php    # PR sequential numbering, transaction management, attachments
│   │       ├── ApprovalController.php           # State transitions, separation of duties, atomic budget locks
│   │       └── DashboardController.php          # Analytics metrics, expenditure charts, bottleneck tracking
│   └── Models/
│       ├── User.php
│       ├── Department.php
│       ├── Category.php
│       ├── CompanyBudget.php
│       ├── DepartmentBudget.php
│       ├── DepartmentCategoryBudget.php
│       ├── PurchaseRequest.php
│       ├── PurchaseRequestItem.php
│       ├── PurchaseRequestAttachment.php
│       └── PurchaseRequestStatusHistory.php
├── database/
│   ├── migrations/
│   │   ├── 0001_01_01_000001_create_cache_table.php
│   │   ├── 0001_01_01_000002_create_jobs_table.php
│   │   ├── 2026_06_05_043552_create_personal_access_tokens_table.php
│   │   ├── 2026_06_09_031952_create_sessions_table.php
│   │   ├── 2026_06_22_000001_create_departments_table.php
│   │   ├── 2026_06_22_000002_create_categories_table.php
│   │   ├── 2026_06_22_000003_create_company_budgets_table.php
│   │   ├── 2026_06_22_000004_create_users_table.php
│   │   ├── 2026_06_22_000005_create_department_budgets_table.php
│   │   ├── 2026_06_22_000006_create_department_category_budgets_table.php
│   │   ├── 2026_06_22_000007_create_purchase_requests_table.php
│   │   ├── 2026_06_22_000008_create_pr_line_items_table.php
│   │   ├── 2026_06_22_000009_create_purchase_request_attachments_table.php
│   │   ├── 2026_06_22_000010_create_purchase_request_status_history_table.php
│   │   ├── 2026_06_22_000011_refactor_users_table.php
│   │   ├── 2026_06_22_000011_rename_pr_line_items_table.php
│   │   ├── 2026_06_22_000012_drop_approval_form_table.php
│   │   ├── 2026_06_22_000012_refactor_purchase_requests_table.php
│   │   ├── 2026_06_27_031954_add_month_to_budgets_tables.php
│   │   ├── 2026_06_30_000001_add_password_management_to_users_table.php
│   │   ├── 2026_06_30_164628_add_carry_forward_to_company_budgets_table.php
│   │   └── 2026_07_01_000001_fix_company_budgets_column.php
│   └── seeders/
│       └── DatabaseSeeder.php
├── routes/
│   └── api.php                                  # All API endpoints & role-based route middleware
└── tests/
    └── Feature/
        ├── AuthTest.php
        ├── UserTest.php
        ├── DepartmentBudgetTest.php
        ├── PurchaseRequestTest.php
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
