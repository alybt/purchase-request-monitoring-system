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
  * `role` (enum: `'admin'`, `'approver'`, `'requester'`)
  * `status` (enum: `'active'`, `'suspended'`)
  * `department` (string)
  * `timestamps`

### B. Purchase Requests Table (`purchase_requests`)
* **Eloquent Model**: `App\Models\PurchaseRequest`
* **Fields**:
  * `id` (bigint, PK)
  * `pr_number` (string, unique, e.g., `PR-2026-0001`)
  * `user_id` (foreign key pointing to `users.id`)
  * `purpose_of_requests` (text)
  * `total_estimated_cost` (decimal, `12, 2`, default `0.00`)
  * `status` (enum: `'Request'`, `'Approve'`, `'Released'`, `'Received'`)
  * `timestamps`

### C. Line Items Table (`line_items`)
* **Eloquent Model**: `App\Models\LineItem`
* **Fields**:
  * `id` (bigint, PK)
  * `pr_id` (foreign key pointing to `purchase_requests.id`)
  * `item_name` (string)
  * `description` (text, nullable)
  * `quantity` (integer)
  * `unit_price` (decimal, `12, 2`)
  * `total_price` (decimal, `12, 2` - calculated automatically as `quantity * unit_price`)
  * `vendor` (string, nullable)
  * `timestamps`

### D. Approval Form / Audit Logs Table (`approval_form`)
* **Eloquent Model**: `App\Models\ApprovalForm`
* **Fields**:
  * `id` (bigint, PK)
  * `pr_id` (foreign key pointing to `purchase_requests.id`)
  * `approver_id` (foreign key pointing to `users.id`)
  * `status` (enum: `'Approve'`, `'Reject'`)
  * `comments` (text, nullable)
  * `action_date` (timestamp)
  * `timestamps`

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
* `POST /api/purchase-requests/{id}/approve`: Approve a PR. Updates the PR status to `'Approve'` and logs an approval record. Optional body: `{"comments": "Approved budget"}`.
* `POST /api/purchase-requests/{id}/reject`: Reject a PR. Leaves the PR status unchanged (remains `'Request'`) but inserts a `Reject` entry into `approval_form` table to create a permanent history of the rejection. Optional body: `{"comments": "Incorrect pricing"}`.

### Dashboard Analytics (`DashboardController`)
* `GET /api/dashboard/metrics`: Compiles summary statistics:
  * `total_spent`: Cost sum of PRs in `'Approve'`, `'Released'`, or `'Received'` status.
  * `total_spent_change_percentage`: Percentage spent change compared to last month.
  * `bottlenecks`: Number of requests with status `'Request'` pending over 48 hours.
  * `active_users`: Active users count.
  * `monthly_data`: Sum of spending per month for the last 6 months.
  * `department_breakdown`: Item count and total cost per department.
* `GET /api/dashboard/recent-prs`: List of the 5 most recently created PRs.
* `GET /api/dashboard/pending-approvals`: List of all PRs still in `'Request'` status awaiting approval.

---

## 5. Directory Structure (Core Files)

```text
backend/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── AuthController.php          # Session log in/out, rate limits
│   │       ├── UserController.php          # Users CRUD and search filters
│   │       ├── PurchaseRequestController.php # PR sequential number, transactions
│   │       ├── ApprovalController.php      # State transitions & audit logging
│   │       └── DashboardController.php     # Summary analytics & monthly aggregation
│   └── Models/
│       ├── User.php
│       ├── PurchaseRequest.php             # HasMany LineItems, HasMany Approvals
│       ├── LineItem.php                    # BelongsTo PurchaseRequest
│       └── ApprovalForm.php                # BelongsTo PurchaseRequest/Approver
├── database/
│   ├── migrations/
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 2026_06_09_000002_create_purchase_requests_table.php
│   │   ├── 2026_06_09_000003_create_line_items_table.php
│   │   └── 2026_06_09_000004_create_approval_form_table.php
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
