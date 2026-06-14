# Purchase Request Monitoring System - Backend API Documentation

Welcome to the Purchase Request Monitoring System backend application built using **Laravel 13** and **Laravel Sanctum**. This project provides secure, authenticated RESTful endpoints designed to integrate seamlessly with the Next.js frontend to monitor, review, and approve purchase requests (PRs) across departments.

---

## Table of Contents
1. [Architecture & Authentication](#1-architecture--authentication)
2. [User Management (UserController)](#2-user-management-usercontroller)
3. [Purchase Requests (PurchaseRequestController)](#3-purchase-requests-purchaserequestcontroller)
4. [Approval & Rejection (ApprovalController)](#4-approval--rejection-approvalcontroller)
5. [Dashboard & Analytics (DashboardController)](#5-dashboard--analytics-dashboardcontroller)
6. [Database Schema & Migrations](#6-database-schema--migrations)
7. [Testing & Quality Assurance](#7-testing--quality-assurance)

---

## 1. Architecture & Authentication

Authentication is handled securely via **Laravel Sanctum** token-based authentication. 

### Authentication Endpoints
* **`POST /api/login`**
  * **Description**: Authenicates a user credentials and generates a Sanctum API token.
  * **Throttling**: Rate-limited to prevent brute-force attacks.
* **`POST /api/logout`**
  * **Description**: Revokes the currently authenticated Sanctum API token, safely ending the session.
  * **Security**: Protected under the `auth:sanctum` middleware.
* **`GET /api/me`**
  * **Description**: Retrieves the profile data of the currently logged-in user (first name, middle name, last name, email, role, status, department).

---

## 2. User Management (UserController)

Provides full administrative CRUD capabilities to manage system users.

### Endpoints
* **`GET /api/users`**
  * **Description**: Lists all users in the system.
  * **Filters**:
    * `role`: Filter by user role (`admin`, `approver`, `employee`).
    * `status`: Filter by user status (`active`, `suspended`).
    * `department`: Filter by department (e.g., `IT`, `HR`, `Finance`, `Operations`, `Sales`).
    * `search`: Searches by first name, middle name, last name, or email.
* **`POST /api/users`**
  * **Description**: Creates a new user in the system with validated role/status attributes and a hashed password.
* **`GET /api/users/{id}`**
  * **Description**: Retrieves details of a single user.
* **`PUT /api/users/{id}`**
  * **Description**: Updates user details (hashes new password if provided).
* **`DELETE /api/users/{id}`**
  * **Description**: Deletes a single user.
  * **Security**: Prevent self-deletion. Returns `403 Forbidden` if a logged-in user attempts to delete themselves.
* **`POST /api/users/bulk-delete`**
  * **Description**: Deletes multiple users by ID.
  * **Security**: Validates IDs and blocks requests that include the authenticated user's ID.

---

## 3. Purchase Requests (PurchaseRequestController)

Manages the lifecycle of purchase requests and their corresponding line items.

### PR Number Auto-Generation
Upon creation, the system automatically generates a unique sequential PR number in the format `PR-YYYY-XXX` (e.g., `PR-2026-001`, `PR-2026-002`) by querying the database for the last entry within the current calendar year.

### Endpoints
* **`GET /api/purchase-requests`**
  * **Description**: Lists all purchase requests.
  * **Filters**:
    * `status`: Filter by PR status (`Request`, `Approve`, `Released`, `Received`).
    * `department`: Filter by the requester's department.
    * `search`: Query searches by PR number, purpose, or requester name/email.
* **`POST /api/purchase-requests`**
  * **Description**: Creates a purchase request and its corresponding line items in a secure database transaction.
  * **Calculation**: Automatically calculates the `total_price` of each line item (`quantity * unit_price`) and sums them to set the PR's `total_estimated_cost`.
* **`GET /api/purchase-requests/{id}`**
  * **Description**: Retrieves PR details along with nested line items, requester profile, and approval trail logs.
* **`PUT /api/purchase-requests/{id}`**
  * **Description**: Updates the PR purpose, status, and replaces/syncs line items while recalculating total estimated costs.
* **`DELETE /api/purchase-requests/{id}`**
  * **Description**: Deletes a single PR and cascades the deletion to its line items.
* **`POST /api/purchase-requests/bulk-delete`**
  * **Description**: Deletes multiple PRs in bulk.

---

## 4. Approval & Rejection (ApprovalController)

Handles workflow state changes for purchase requests.

### Endpoints
* **`POST /api/purchase-requests/{id}/approve`**
  * **Description**: Approves a PR.
  * **Actions**: Updates the purchase request status to `'Approve'` and logs an approval record in the `approval_form` table with the approver's ID, current timestamp, and comments.
* **`POST /api/purchase-requests/{id}/reject`**
  * **Description**: Rejects a PR.
  * **Actions**: Registers a rejection record (status `'Reject'`) and comments in the `approval_form` trail log. The status of the PR itself remains unchanged (keeping it as `'Request'`) to comply with the database schema definitions.

---

## 5. Dashboard & Analytics (DashboardController)

Serves statistics and aggregate calculations to power the frontend admin dashboard charts and tables.

### Endpoints
* **`GET /api/dashboard/metrics`**
  * **Description**: Retrieves system-wide key metrics:
    * `total_spent`: Sum of costs of all approved, released, and received PRs.
    * `total_spent_change_percentage`: Month-over-month spend trend percentage.
    * `bottlenecks`: Count of PRs in `'Request'` status pending for more than 48 hours.
    * `active_users`: Count of active accounts.
    * `monthly_data`: Chronological spent sum for the last 6 months (ideal for bar/line charts).
    * `department_breakdown`: Total spent and PR count grouped by department (ideal for pie charts).
* **`GET /api/dashboard/recent-prs`**
  * **Description**: Retrieves the 5 most recently created PRs with requester details loaded.
* **`GET /api/dashboard/pending-approvals`**
  * **Description**: Lists all PRs awaiting approval (status `'Request'`) ordered by creation date.

---

## 6. Database Schema & Migrations

The database supports both production-level **PostgreSQL** and local/testing **SQLite** databases:
* Uses custom database constraints and PostgreSQL custom ENUM types (`user_role`, `user_status`, `pr_status`) safely.
* Incorporates fallback definitions for SQLite compatibility to allow high-speed testing.
* Schema tables: `users`, `purchase_requests`, `pr_line_items`, and `approval_form`.

---

## 7. Testing & Quality Assurance

Comprehensive feature tests are implemented under `tests/Feature`:
1. **`AuthTest.php`**: Login throttling, session profile details, token revocation (logout).
2. **`UserTest.php`**: CRUD operations, search queries, role/status filters, single/bulk self-deletion protection.
3. **`PurchaseRequestTest.php`**: CRUD operations, line item cost calculation, sequential PR number generation, status/department filters, single/bulk deletion.
4. **`DashboardTest.php`**: Metrics aggregation, bottleneck checks, active user counts, monthly trends, recent PR feeds, and pending approvals.

### Running Tests
To execute all backend feature and unit tests, run:
```bash
php vendor/phpunit/phpunit/phpunit
```
