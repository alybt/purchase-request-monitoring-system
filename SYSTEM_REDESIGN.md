# Purchase Request Management System - Complete Redesign

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Entity Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
3. [Database Migrations](#database-migrations)
4. [Database Seeders](#database-seeders)
5. [Eloquent Models & Relationships](#eloquent-models--relationships)
6. [Dashboard Metrics](#dashboard-metrics)
7. [Recommended Improvements](#recommended-improvements)

---

## System Architecture

### Modules

#### 1. User Management Module
- User authentication and authorization
- Role-based access control (Admin, Department Head)
- User profile management
- Department assignment

#### 2. Department Management Module
- Create, update, delete departments
- Department budget allocation
- Department head assignment

#### 3. Category Management Module
- Create, update, delete categories
- Category budget allocation per department
- Category budget tracking

#### 4. Budget Management Module
- Company-wide budget setting
- Department budget allocation
- Category budget allocation
- Budget reservation tracking
- Budget utilization monitoring
- Budget overrun prevention

#### 5. Purchase Request Module
- PR creation by Department Heads
- PR submission workflow
- PR status tracking
- PR line item management
- PR attachment management
- PR approval/rejection by Admin

#### 6. Procurement Lifecycle Module
- Order status tracking
- Receipt status tracking
- Release status tracking
- Completion status tracking

#### 7. Audit Trail Module
- Status history tracking
- User action logging
- Budget transaction logging

#### 8. Reporting & Analytics Module
- Budget utilization reports
- PR status reports
- Department performance reports
- Procurement cycle time analysis

---

### Responsibilities

#### Admin Role
- Manage users (create, update, delete)
- Manage departments
- Manage categories
- Set overall company budget
- Allocate budget to departments
- Review Purchase Requests
- Approve Purchase Requests
- Reject Purchase Requests
- Mark items as Ordered
- Mark items as Received
- Mark items as Released
- Generate reports
- Monitor budget utilization

#### Department Head Role
- Manage department category budgets
- Create Purchase Requests
- View Purchase Request status
- Monitor department budget utilization
- View department reports

---

### New Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Purchase Request Workflow                    │
└─────────────────────────────────────────────────────────────────┘

1. Setup Phase
   ┌─────────────┐
   │ Admin       │
   │ Creates     │
   │ Categories  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Admin       │
   │ Sets        │
   │ Company     │
   │ Budget      │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Admin       │
   │ Allocates   │
   │ Budget to   │
   │ Departments│
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Dept Head   │
   │ Allocates   │
   │ Budget to   │
   │ Categories │
   └──────┬──────┘
          │
          ▼
2. Request Phase
   ┌─────────────┐
   │ Dept Head   │
   │ Creates PR  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ System      │
   │ Validates   │
   │ Available   │
   │ Budget      │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Dept Head   │
   │ Submits PR  │
   │ (Draft →    │
   │ Submitted)  │
   └──────┬──────┘
          │
          ▼
3. Review Phase
   ┌─────────────┐
   │ Admin       │
   │ Reviews PR  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Admin       │
   │ Approves or │
   │ Rejects     │
   └──────┬──────┘
          │
          ├─────────────┐
          │             │
          ▼             ▼
   ┌─────────────┐  ┌─────────────┐
   │ Approved    │  │ Rejected    │
   │ (Submitted  │  │ (Submitted  │
   │ → Approved)│  │ → Rejected) │
   └──────┬──────┘  └─────────────┘
          │
          ▼
4. Procurement Phase (If Approved)
   ┌─────────────┐
   │ Budget      │
   │ Becomes     │
   │ Reserved    │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Admin       │
   │ Marks as    │
   │ Ordered     │
   │ (Approved   │
   │ → Ordered)  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Admin       │
   │ Marks as    │
   │ Received    │
   │ (Ordered →  │
   │ Received)   │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Admin       │
   │ Marks as    │
   │ Released    │
   │ (Received → │
   │ Released)   │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ System      │
   │ Marks as    │
   │ Completed   │
   │ (Released → │
   │ Completed)  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Budget      │
   │ Becomes     │
   │ Spent       │
   └─────────────┘
```

---

### Use Cases

#### UC-1: Admin Sets Company Budget
**Actor:** Admin
**Precondition:** Admin is logged in
**Main Flow:**
1. Admin navigates to Budget Management
2. Admin enters overall company budget amount
3. System validates amount (must be positive)
4. System saves company budget
5. System displays success message
**Postcondition:** Company budget is set and available for department allocation

#### UC-2: Admin Allocates Budget to Department
**Actor:** Admin
**Precondition:** Company budget is set
**Main Flow:**
1. Admin navigates to Department Budget Allocation
2. Admin selects department
3. Admin enters allocation amount
4. System validates:
   - Amount is positive
   - Total department allocations ≤ company budget
5. System calculates percentage
6. System saves allocation
7. System displays success message
**Postcondition:** Department budget is allocated

#### UC-3: Department Head Allocates Category Budget
**Actor:** Department Head
**Precondition:** Department budget is allocated
**Main Flow:**
1. Department Head navigates to Category Budget Allocation
2. Department Head selects category
3. Department Head enters allocation amount
4. System validates:
   - Amount is positive
   - Total category allocations ≤ department budget
5. System saves allocation
6. System displays success message
**Postcondition:** Category budget is allocated

#### UC-4: Department Head Creates Purchase Request
**Actor:** Department Head
**Precondition:** Department has available budget
**Main Flow:**
1. Department Head navigates to Create PR
2. Department Head enters PR details:
   - Purpose
   - Category
   - Line items (name, description, quantity, unit price, vendor)
   - Attachments (optional)
3. System validates:
   - All required fields are filled
   - Quantity > 0
   - Unit price > 0
4. System calculates total estimated cost
5. System checks available budget
6. System saves PR as Draft
7. System displays success message
**Postcondition:** PR is created in Draft status

#### UC-5: Department Head Submits Purchase Request
**Actor:** Department Head
**Precondition:** PR exists in Draft status
**Main Flow:**
1. Department Head opens Draft PR
2. Department Head clicks Submit
3. System validates:
   - Total cost ≤ available category budget
4. System updates status to Submitted
5. System creates status history entry
6. System displays success message
**Postcondition:** PR is in Submitted status

#### UC-6: Admin Reviews Purchase Request
**Actor:** Admin
**Precondition:** PR exists in Submitted status
**Main Flow:**
1. Admin navigates to Pending PRs
2. Admin selects PR to review
3. System displays PR details with attachments
4. Admin reviews PR
**Postcondition:** PR is reviewed

#### UC-7: Admin Approves Purchase Request
**Actor:** Admin
**Precondition:** PR is reviewed
**Main Flow:**
1. Admin clicks Approve
2. Admin enters remarks (optional)
3. System validates:
   - Budget is still available
4. System updates status to Approved
5. System reserves budget
6. System creates status history entry
7. System sends notification to Department Head
8. System displays success message
**Postcondition:** PR is Approved, budget is reserved

#### UC-8: Admin Rejects Purchase Request
**Actor:** Admin
**Precondition:** PR is reviewed
**Main Flow:**
1. Admin clicks Reject
2. Admin enters rejection reason (required)
3. System updates status to Rejected
4. System creates status history entry
5. System sends notification to Department Head
6. System displays success message
**Postcondition:** PR is Rejected

#### UC-9: Admin Marks PR as Ordered
**Actor:** Admin
**Precondition:** PR is in Approved status
**Main Flow:**
1. Admin navigates to Approved PRs
2. Admin selects PR
3. Admin clicks Mark as Ordered
4. Admin enters order details (optional)
5. System updates status to Ordered
6. System creates status history entry
7. System displays success message
**Postcondition:** PR is in Ordered status

#### UC-10: Admin Marks PR as Received
**Actor:** Admin
**Precondition:** PR is in Ordered status
**Main Flow:**
1. Admin navigates to Ordered PRs
2. Admin selects PR
3. Admin clicks Mark as Received
4. Admin enters receipt details (optional)
5. System updates status to Received
6. System creates status history entry
7. System displays success message
**Postcondition:** PR is in Received status

#### UC-11: Admin Marks PR as Released
**Actor:** Admin
**Precondition:** PR is in Received status
**Main Flow:**
1. Admin navigates to Received PRs
2. Admin selects PR
3. Admin clicks Mark as Released
4. Admin enters release details (optional)
5. System updates status to Released
6. System creates status history entry
7. System displays success message
**Postcondition:** PR is in Released status

#### UC-12: System Auto-Completes PR
**Actor:** System
**Precondition:** PR is in Released status
**Main Flow:**
1. System detects PR status change to Released
2. System updates status to Completed
3. System converts reserved budget to spent
4. System creates status history entry
**Postcondition:** PR is Completed, budget is spent

---

## Entity Relationship Diagram (ERD)

### Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS TABLE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                          BIGINT          PK, AUTO_INCREMENT             │
│ first_name                  VARCHAR(100)   NOT NULL                       │
│ middle_name                 VARCHAR(100)   NULLABLE                       │
│ last_name                   VARCHAR(100)   NOT NULL                       │
│ email                       VARCHAR(255)   UNIQUE, NOT NULL               │
│ password                    VARCHAR(255)   NOT NULL                       │
│ role                        ENUM           NOT NULL                        │
│                             ('admin', 'department_head')                  │
│ status                      ENUM           NOT NULL                        │
│                             ('active', 'dismissed', 'suspended')          │
│ department_id               BIGINT         FK → departments.id            │
│ created_at                  TIMESTAMP      NULLABLE                       │
│ updated_at                  TIMESTAMP      NULLABLE                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPARTMENTS TABLE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                          BIGINT          PK, AUTO_INCREMENT             │
│ name                        VARCHAR(100)   UNIQUE, NOT NULL               │
│ code                        VARCHAR(20)    UNIQUE, NOT NULL               │
│ description                 TEXT           NULLABLE                       │
│ budget_allocation           DECIMAL(15,2)  DEFAULT 0.00                  │
│ allocation_percentage       DECIMAL(5,2)   DEFAULT 0.00                  │
│ created_at                  TIMESTAMP      NULLABLE                       │
│ updated_at                  TIMESTAMP      NULLABLE                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            CATEGORIES TABLE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                          BIGINT          PK, AUTO_INCREMENT             │
│ name                        VARCHAR(100)   UNIQUE, NOT NULL               │
│ code                        VARCHAR(20)    UNIQUE, NOT NULL               │
│ description                 TEXT           NULLABLE                       │
│ created_at                  TIMESTAMP      NULLABLE                       │
│ updated_at                  TIMESTAMP      NULLABLE                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      DEPARTMENT_BUDGETS TABLE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                          BIGINT          PK, AUTO_INCREMENT             │
│ department_id               BIGINT         FK → departments.id            │
│ fiscal_year                 INT            NOT NULL                       │
│ allocated_amount            DECIMAL(15,2)  NOT NULL, DEFAULT 0.00        │
│ reserved_amount             DECIMAL(15,2)  NOT NULL, DEFAULT 0.00        │
│ spent_amount                DECIMAL(15,2)  NOT NULL, DEFAULT 0.00        │
│ available_amount            DECIMAL(15,2)  GENERATED AS                   │
│                             (allocated_amount - reserved_amount -         │
│                              spent_amount) STORED                         │
│ created_at                  TIMESTAMP      NULLABLE                       │
│ updated_at                  TIMESTAMP      NULLABLE                       │
│ UNIQUE(department_id, fiscal_year)                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                 DEPARTMENT_CATEGORY_BUDGETS TABLE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                          BIGINT          PK, AUTO_INCREMENT             │
│ department_budget_id        BIGINT         FK → department_budgets.id      │
│ category_id                 BIGINT         FK → categories.id              │
│ allocated_amount            DECIMAL(15,2)  NOT NULL, DEFAULT 0.00        │
│ reserved_amount             DECIMAL(15,2)  NOT NULL, DEFAULT 0.00        │
│ spent_amount                DECIMAL(15,2)  NOT NULL, DEFAULT 0.00        │
│ available_amount            DECIMAL(15,2)  GENERATED AS                   │
│                             (allocated_amount - reserved_amount -         │
│                              spent_amount) STORED                         │
│ created_at                  TIMESTAMP      NULLABLE                       │
│ updated_at                  TIMESTAMP      NULLABLE                       │
│ UNIQUE(department_budget_id, category_id)                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       PURCHASE_REQUESTS TABLE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                          BIGINT          PK, AUTO_INCREMENT             │
│ pr_number                   VARCHAR(50)    UNIQUE, NOT NULL               │
│ department_id               BIGINT         FK → departments.id            │
│ category_id                 BIGINT         FK → categories.id              │
│ requested_by                BIGINT         FK → users.id                   │
│ approved_by                 BIGINT         FK → users.id (NULLABLE)        │
│ purpose                     TEXT           NOT NULL                       │
│ total_estimated_cost        DECIMAL(12,2)  NOT NULL, DEFAULT 0.00        │
│ status                      ENUM           NOT NULL                        │
│                             ('Draft', 'Submitted', 'Approved',            │
│                              'Rejected', 'Ordered',                       │
│                              'Received', 'Released', 'Completed')         │
│ remarks                     TEXT           NULLABLE                       │
│ rejection_reason            TEXT           NULLABLE                       │
│ submitted_at                TIMESTAMP      NULLABLE                       │
│ approved_at                 TIMESTAMP      NULLABLE                       │
│ ordered_at                  TIMESTAMP      NULLABLE                       │
│ received_at                 TIMESTAMP      NULLABLE                       │
│ released_at                 TIMESTAMP      NULLABLE                       │
│ completed_at               TIMESTAMP      NULLABLE                       │
│ created_at                  TIMESTAMP      NULLABLE                       │
│ updated_at                  TIMESTAMP      NULLABLE                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    PURCHASE_REQUEST_ITEMS TABLE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                          BIGINT          PK, AUTO_INCREMENT             │
│ purchase_request_id         BIGINT         FK → purchase_requests.id       │
│ item_name                   VARCHAR(255)   NOT NULL                       │
│ description                 TEXT           NULLABLE                       │
│ quantity                    INT            NOT NULL, CHECK(quantity > 0)   │
│ unit_price                  DECIMAL(10,2)  NOT NULL                       │
│ total_price                 DECIMAL(12,2)  NOT NULL                       │
│ vendor                      VARCHAR(255)   NULLABLE                       │
│ created_at                  TIMESTAMP      NULLABLE                       │
│ updated_at                  TIMESTAMP      NULLABLE                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                  PURCHASE_REQUEST_ATTACHMENTS TABLE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                          BIGINT          PK, AUTO_INCREMENT             │
│ purchase_request_id         BIGINT         FK → purchase_requests.id       │
│ file_name                   VARCHAR(255)   NOT NULL                       │
│ file_path                   VARCHAR(500)   NOT NULL                       │
│ file_size                   BIGINT         NOT NULL                       │
│ file_type                   VARCHAR(100)   NOT NULL                       │
│ uploaded_by                 BIGINT         FK → users.id                   │
│ created_at                  TIMESTAMP      NULLABLE                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                 PURCHASE_REQUEST_STATUS_HISTORY TABLE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                          BIGINT          PK, AUTO_INCREMENT             │
│ purchase_request_id         BIGINT         FK → purchase_requests.id       │
│ from_status                 VARCHAR(50)    NULLABLE                       │
│ to_status                   VARCHAR(50)    NOT NULL                       │
│ changed_by                  BIGINT         FK → users.id                   │
│ remarks                     TEXT           NULLABLE                       │
│ created_at                  TIMESTAMP      NULLABLE                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPANY_BUDGETS TABLE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                          BIGINT          PK, AUTO_INCREMENT             │
│ fiscal_year                 INT            UNIQUE, NOT NULL               │
│ total_budget                DECIMAL(15,2)  NOT NULL, DEFAULT 0.00        │
│ allocated_amount            DECIMAL(15,2)  NOT NULL, DEFAULT 0.00        │
│ available_amount            DECIMAL(15,2)  GENERATED AS                   │
│                             (total_budget - allocated_amount) STORED       │
│ created_at                  TIMESTAMP      NULLABLE                       │
│ updated_at                  TIMESTAMP      NULLABLE                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Relationships

```
Users
├── belongsTo Department (department_id)
├── hasMany PurchaseRequests (requested_by)
├── hasMany PurchaseRequests (approved_by)
└── hasMany PurchaseRequestStatusHistory (changed_by)
└── hasMany PurchaseRequestAttachments (uploaded_by)

Departments
├── hasMany Users
├── hasMany DepartmentBudgets
├── hasMany PurchaseRequests
└── hasMany DepartmentCategoryBudgets (through DepartmentBudgets)

Categories
├── hasMany DepartmentCategoryBudgets
└── hasMany PurchaseRequests

DepartmentBudgets
├── belongsTo Department
├── hasMany DepartmentCategoryBudgets
├── belongsTo CompanyBudget (through fiscal_year)
└── UNIQUE(department_id, fiscal_year)

DepartmentCategoryBudgets
├── belongsTo DepartmentBudget
├── belongsTo Category
├── UNIQUE(department_budget_id, category_id)

PurchaseRequests
├── belongsTo Department
├── belongsTo Category
├── belongsTo User (requested_by)
├── belongsTo User (approved_by)
├── hasMany PurchaseRequestItems
├── hasMany PurchaseRequestAttachments
└── hasMany PurchaseRequestStatusHistory

PurchaseRequestItems
├── belongsTo PurchaseRequest

PurchaseRequestAttachments
├── belongsTo PurchaseRequest
├── belongsTo User (uploaded_by)

PurchaseRequestStatusHistory
├── belongsTo PurchaseRequest
└── belongsTo User (changed_by)

CompanyBudgets
├── hasMany DepartmentBudgets (through fiscal_year)
└── UNIQUE(fiscal_year)
```

---

## Database Migrations

### New Migrations

#### 1. Create Departments Table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('code', 20)->unique();
            $table->text('description')->nullable();
            $table->decimal('budget_allocation', 15, 2)->default(0.00);
            $table->decimal('allocation_percentage', 5, 2)->default(0.00);
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
```

#### 2. Create Categories Table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('code', 20)->unique();
            $table->text('description')->nullable();
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
```

#### 3. Create Company Budgets Table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_budgets', function (Blueprint $table) {
            $table->id();
            $table->integer('fiscal_year')->unique();
            $table->decimal('total_budget', 15, 2)->default(0.00);
            $table->decimal('allocated_amount', 15, 2)->default(0.00);
            $table->timestampsTz();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('
                ALTER TABLE company_budgets 
                ADD COLUMN available_amount DECIMAL(15,2) 
                GENERATED ALWAYS AS (total_budget - allocated_amount) STORED
            ');
        } else {
            // For MySQL/MariaDB
            Schema::table('company_budgets', function (Blueprint $table) {
                $table->decimal('available_amount', 15, 2)
                    ->storedAs('total_budget - allocated_amount')
                    ->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('company_budgets');
    }
};
```

#### 4. Create Department Budgets Table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('department_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->integer('fiscal_year')->notNull();
            $table->decimal('allocated_amount', 15, 2)->default(0.00);
            $table->decimal('reserved_amount', 15, 2)->default(0.00);
            $table->decimal('spent_amount', 15, 2)->default(0.00);
            $table->timestampsTz();
            
            $table->unique(['department_id', 'fiscal_year']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('
                ALTER TABLE department_budgets 
                ADD COLUMN available_amount DECIMAL(15,2) 
                GENERATED ALWAYS AS (allocated_amount - reserved_amount - spent_amount) STORED
            ');
        } else {
            // For MySQL/MariaDB
            Schema::table('department_budgets', function (Blueprint $table) {
                $table->decimal('available_amount', 15, 2)
                    ->storedAs('allocated_amount - reserved_amount - spent_amount')
                    ->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('department_budgets');
    }
};
```

#### 5. Create Department Category Budgets Table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('department_category_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_budget_id')->constrained('department_budgets')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->decimal('allocated_amount', 15, 2)->default(0.00);
            $table->decimal('reserved_amount', 15, 2)->default(0.00);
            $table->decimal('spent_amount', 15, 2)->default(0.00);
            $table->timestampsTz();
            
            $table->unique(['department_budget_id', 'category_id']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('
                ALTER TABLE department_category_budgets 
                ADD COLUMN available_amount DECIMAL(15,2) 
                GENERATED ALWAYS AS (allocated_amount - reserved_amount - spent_amount) STORED
            ');
        } else {
            // For MySQL/MariaDB
            Schema::table('department_category_budgets', function (Blueprint $table) {
                $table->decimal('available_amount', 15, 2)
                    ->storedAs('allocated_amount - reserved_amount - spent_amount')
                    ->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('department_category_budgets');
    }
};
```

#### 6. Create Purchase Request Attachments Table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_request_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')->constrained('purchase_requests')->onDelete('cascade');
            $table->string('file_name', 255);
            $table->string('file_path', 500);
            $table->bigInteger('file_size');
            $table->string('file_type', 100);
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->timestampTz('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_request_attachments');
    }
};
```

#### 7. Create Purchase Request Status History Table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_request_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')->constrained('purchase_requests')->onDelete('cascade');
            $table->string('from_status', 50)->nullable();
            $table->string('to_status', 50);
            $table->foreignId('changed_by')->constrained('users')->onDelete('cascade');
            $table->text('remarks')->nullable();
            $table->timestampTz('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_request_status_history');
    }
};
```

---

### Migration Refactoring

#### 8. Refactor Users Table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the old department string column
        if (Schema::hasColumn('users', 'department')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('department');
            });
        }

        // Add department_id foreign key
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->after('status')->constrained('departments')->onDelete('set null');
        });

        // Update role enum to remove 'approver' and 'employee', add 'department_head'
        if (DB::getDriverName() === 'pgsql') {
            // PostgreSQL: Drop and recreate the enum type
            DB::statement("ALTER TABLE users ALTER COLUMN role DROP DEFAULT");
            DB::statement("ALTER TABLE users ALTER COLUMN role DROP NOT NULL");
            
            // Update existing values
            DB::statement("UPDATE users SET role = 'department_head' WHERE role = 'employee'");
            DB::statement("UPDATE users SET role = 'admin' WHERE role = 'approver'");
            
            // Drop the old type
            DB::statement("ALTER TYPE user_role RENAME TO user_role_old");
            
            // Create new type
            DB::statement("CREATE TYPE user_role AS ENUM ('admin', 'department_head')");
            
            // Alter column to use new type
            DB::statement("ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role");
            
            // Set back constraints
            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'department_head'");
            DB::statement("ALTER TABLE users ALTER COLUMN role SET NOT NULL");
            
            // Drop old type
            DB::statement("DROP TYPE user_role_old");
        } else {
            // MySQL/MariaDB: Modify the enum directly
            Schema::table('users', function (Blueprint $table) {
                $table->enum('role', ['admin', 'department_head'])->default('department_head')->change();
            });
            
            // Update existing values
            DB::statement("UPDATE users SET role = 'department_head' WHERE role = 'employee'");
            DB::statement("UPDATE users SET role = 'admin' WHERE role = 'approver'");
        }
    }

    public function down(): void
    {
        // Revert role enum
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users ALTER COLUMN role DROP DEFAULT");
            DB::statement("ALTER TABLE users ALTER COLUMN role DROP NOT NULL");
            
            DB::statement("UPDATE users SET role = 'employee' WHERE role = 'department_head'");
            
            DB::statement("ALTER TYPE user_role RENAME TO user_role_new");
            DB::statement("CREATE TYPE user_role AS ENUM ('admin', 'approver', 'employee')");
            DB::statement("ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role");
            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'employee'");
            DB::statement("ALTER TABLE users ALTER COLUMN role SET NOT NULL");
            DB::statement("DROP TYPE user_role_new");
        } else {
            DB::statement("UPDATE users SET role = 'employee' WHERE role = 'department_head'");
            Schema::table('users', function (Blueprint $table) {
                $table->enum('role', ['admin', 'approver', 'employee'])->default('employee')->change();
            });
        }

        // Drop department_id and add back department string
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropColumn('department_id');
            $table->string('department', 100)->nullable()->after('status');
        });
    }
};
```

#### 9. Refactor Purchase Requests Table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add new columns
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->after('user_id')->constrained('departments')->onDelete('set null');
            $table->foreignId('category_id')->nullable()->after('department_id')->constrained('categories')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->after('category_id')->constrained('users')->onDelete('set null');
            $table->text('remarks')->nullable()->after('status');
            $table->text('rejection_reason')->nullable()->after('remarks');
            $table->timestampTz('submitted_at')->nullable()->after('updated_at');
            $table->timestampTz('approved_at')->nullable()->after('submitted_at');
            $table->timestampTz('ordered_at')->nullable()->after('approved_at');
            $table->timestampTz('received_at')->nullable()->after('ordered_at');
            $table->timestampTz('released_at')->nullable()->after('received_at');
            $table->timestampTz('completed_at')->nullable()->after('released_at');
        });

        // Update status enum
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status DROP DEFAULT");
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status DROP NOT NULL");
            
            // Update existing values
            DB::statement("UPDATE purchase_requests SET status = 'Submitted' WHERE status = 'Request'");
            DB::statement("UPDATE purchase_requests SET status = 'Approved' WHERE status = 'Approve'");
            
            DB::statement("ALTER TYPE pr_status RENAME TO pr_status_old");
            DB::statement("CREATE TYPE pr_status AS ENUM ('Draft', 'Submitted', 'Approved', 'Rejected', 'Ordered', 'Received', 'Released', 'Completed')");
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status TYPE pr_status USING status::text::pr_status");
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status SET DEFAULT 'Draft'");
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status SET NOT NULL");
            DB::statement("DROP TYPE pr_status_old");
        } else {
            Schema::table('purchase_requests', function (Blueprint $table) {
                $table->enum('status', ['Draft', 'Submitted', 'Approved', 'Rejected', 'Ordered', 'Received', 'Released', 'Completed'])->default('Draft')->change();
            });
            
            DB::statement("UPDATE purchase_requests SET status = 'Submitted' WHERE status = 'Request'");
            DB::statement("UPDATE purchase_requests SET status = 'Approved' WHERE status = 'Approve'");
        }

        // Rename purpose_of_requests to purpose
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->renameColumn('purpose_of_requests', 'purpose');
        });
    }

    public function down(): void
    {
        // Revert status enum
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status DROP DEFAULT");
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status DROP NOT NULL");
            
            DB::statement("UPDATE purchase_requests SET status = 'Request' WHERE status = 'Submitted'");
            DB::statement("UPDATE purchase_requests SET status = 'Approve' WHERE status = 'Approved'");
            
            DB::statement("ALTER TYPE pr_status RENAME TO pr_status_new");
            DB::statement("CREATE TYPE pr_status AS ENUM ('Request', 'Approve', 'Released', 'Received')");
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status TYPE pr_status USING status::text::pr_status");
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status SET DEFAULT 'Request'");
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status SET NOT NULL");
            DB::statement("DROP TYPE pr_status_new");
        } else {
            DB::statement("UPDATE purchase_requests SET status = 'Request' WHERE status = 'Submitted'");
            DB::statement("UPDATE purchase_requests SET status = 'Approve' WHERE status = 'Approved'");
            Schema::table('purchase_requests', function (Blueprint $table) {
                $table->enum('status', ['Request', 'Approve', 'Released', 'Received'])->default('Request')->change();
            });
        }

        // Drop new columns
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropForeign(['category_id']);
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['department_id', 'category_id', 'approved_by', 'remarks', 'rejection_reason', 'submitted_at', 'approved_at', 'ordered_at', 'received_at', 'released_at', 'completed_at']);
        });

        // Rename purpose back to purpose_of_requests
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->renameColumn('purpose', 'purpose_of_requests');
        });
    }
};
```

#### 10. Drop Approval Form Table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('approval_form');
    }

    public function down(): void
    {
        Schema::create('approval_form', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pr_id')->constrained('purchase_requests')->onDelete('cascade');
            $table->foreignId('approver_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('status', 50);
            $table->text('comments')->nullable();
            $table->timestampTz('action_date')->nullable();
            $table->timestampsTz();
        });
    }
};
```

#### 11. Rename Pr Line Items Table
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('pr_line_items', 'purchase_request_items');
    }

    public function down(): void
    {
        Schema::rename('purchase_request_items', 'pr_line_items');
    }
};
```

---

## Database Seeders

### Department Seeder
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use Illuminate\Support\Facades\DB;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            [
                'name' => 'Information Technology',
                'code' => 'IT',
                'description' => 'Manages IT infrastructure, software development, and technical support.',
                'budget_allocation' => 0.00,
                'allocation_percentage' => 0.00,
            ],
            [
                'name' => 'Human Resources',
                'code' => 'HR',
                'description' => 'Handles recruitment, employee relations, benefits, and training.',
                'budget_allocation' => 0.00,
                'allocation_percentage' => 0.00,
            ],
            [
                'name' => 'Finance',
                'code' => 'FIN',
                'description' => 'Manages financial planning, accounting, and budgeting.',
                'budget_allocation' => 0.00,
                'allocation_percentage' => 0.00,
            ],
            [
                'name' => 'Operations',
                'code' => 'OPS',
                'description' => 'Oversees daily operations, logistics, and supply chain management.',
                'budget_allocation' => 0.00,
                'allocation_percentage' => 0.00,
            ],
            [
                'name' => 'Marketing',
                'code' => 'MKT',
                'description' 'Handles marketing campaigns, advertising, and brand management.',
                'budget_allocation' => 0.00,
                'allocation_percentage' => 0.00,
            ],
        ];

        foreach ($departments as $department) {
            Department::create($department);
        }
    }
}
```

### Category Seeder
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Office Supplies',
                'code' => 'OS',
                'description' => 'General office supplies including paper, pens, folders, and consumables.',
            ],
            [
                'name' => 'IT Equipment',
                'code' => 'ITE',
                'description' => 'Computers, laptops, servers, networking equipment, and peripherals.',
            ],
            [
                'name' => 'Software Licenses',
                'code' => 'SL',
                'description' => 'Software subscriptions, licenses, and maintenance agreements.',
            ],
            [
                'name' => 'Maintenance & Repairs',
                'code' => 'MR',
                'description' => 'Equipment maintenance, repairs, and service contracts.',
            ],
            [
                'name' => 'Training & Development',
                'code' => 'TD',
                'description' => 'Employee training programs, workshops, and professional development.',
            ],
            [
                'name' => 'Marketing & Advertising',
                'code' => 'MA',
                'description' => 'Marketing campaigns, advertising materials, and promotional items.',
            ],
            [
                'name' => 'Furniture & Fixtures',
                'code' => 'FF',
                'description' => 'Office furniture, fixtures, and equipment.',
            ],
            [
                'name' => 'Travel & Transportation',
                'code' => 'TT',
                'description' => 'Business travel, transportation, and accommodation expenses.',
            ],
            [
                'name' => 'Miscellaneous',
                'code' => 'MSC',
                'description' => 'Other miscellaneous expenses not covered by specific categories.',
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
```

### User Seeder
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Department;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin
        $admin = User::create([
            'first_name' => 'System',
            'middle_name' => null,
            'last_name' => 'Administrator',
            'email' => 'admin@company.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'status' => 'active',
            'department_id' => null,
        ]);

        // Get departments
        $itDept = Department::where('code', 'IT')->first();
        $hrDept = Department::where('code', 'HR')->first();
        $finDept = Department::where('code', 'FIN')->first();
        $opsDept = Department::where('code', 'OPS')->first();
        $mktDept = Department::where('code', 'MKT')->first();

        // Create Department Heads
        $departmentHeads = [
            [
                'first_name' => 'Juan',
                'middle_name' => 'Santos',
                'last_name' => 'Reyes',
                'email' => 'juan.reyes@company.com',
                'password' => Hash::make('password123'),
                'role' => 'department_head',
                'status' => 'active',
                'department_id' => $itDept->id,
            ],
            [
                'first_name' => 'Maria',
                'middle_name' => 'Garcia',
                'last_name' => 'Santos',
                'email' => 'maria.santos@company.com',
                'password' => Hash::make('password123'),
                'role' => 'department_head',
                'status' => 'active',
                'department_id' => $hrDept->id,
            ],
            [
                'first_name' => 'Carlos',
                'middle_name' => 'Mendoza',
                'last_name' => 'Rodriguez',
                'email' => 'carlos.rodriguez@company.com',
                'password' => Hash::make('password123'),
                'role' => 'department_head',
                'status' => 'active',
                'department_id' => $finDept->id,
            ],
            [
                'first_name' => 'Ana',
                'middle_name' => 'Flores',
                'last_name' => 'Martinez',
                'email' => 'ana.martinez@company.com',
                'password' => Hash::make('password123'),
                'role' => 'department_head',
                'status' => 'active',
                'department_id' => $opsDept->id,
            ],
            [
                'first_name' => 'Pedro',
                'middle_name' => 'Castillo',
                'last_name' => 'Lopez',
                'email' => 'pedro.lopez@company.com',
                'password' => Hash::make('password123'),
                'role' => 'department_head',
                'status' => 'active',
                'department_id' => $mktDept->id,
            ],
        ];

        foreach ($departmentHeads as $deptHead) {
            User::create($deptHead);
        }
    }
}
```

### Company Budget Seeder
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CompanyBudget;

class CompanyBudgetSeeder extends Seeder
{
    public function run(): void
    {
        // Set company budget for current fiscal year
        CompanyBudget::create([
            'fiscal_year' => 2026,
            'total_budget' => 10000000.00, // ₱10,000,000
            'allocated_amount' => 0.00,
        ]);
    }
}
```

### Department Budget Seeder
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DepartmentBudget;
use App\Models\Department;
use App\Models\CompanyBudget;

class DepartmentBudgetSeeder extends Seeder
{
    public function run(): void
    {
        $companyBudget = CompanyBudget::where('fiscal_year', 2026)->first();
        
        $allocations = [
            'IT' => 2000000.00,   // ₱2,000,000 (20%)
            'HR' => 1000000.00,   // ₱1,000,000 (10%)
            'FIN' => 1500000.00,  // ₱1,500,000 (15%)
            'OPS' => 3000000.00,  // ₱3,000,000 (30%)
            'MKT' => 2500000.00,  // ₱2,500,000 (25%)
        ];

        foreach ($allocations as $code => $amount) {
            $department = Department::where('code', $code)->first();
            
            DepartmentBudget::create([
                'department_id' => $department->id,
                'fiscal_year' => 2026,
                'allocated_amount' => $amount,
                'reserved_amount' => 0.00,
                'spent_amount' => 0.00,
            ]);

            // Update department allocation percentage
            $percentage = ($amount / $companyBudget->total_budget) * 100;
            $department->budget_allocation = $amount;
            $department->allocation_percentage = $percentage;
            $department->save();
        }

        // Update company budget allocated amount
        $companyBudget->allocated_amount = array_sum($allocations);
        $companyBudget->save();
    }
}
```

### Department Category Budget Seeder
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DepartmentCategoryBudget;
use App\Models\DepartmentBudget;
use App\Models\Category;

class DepartmentCategoryBudgetSeeder extends Seeder
{
    public function run(): void
    {
        $departmentBudgets = DepartmentBudget::where('fiscal_year', 2026)->get();
        
        foreach ($departmentBudgets as $deptBudget) {
            $categoryAllocations = $this->getCategoryAllocations($deptBudget->department->code, $deptBudget->allocated_amount);
            
            foreach ($categoryAllocations as $categoryCode => $amount) {
                $category = Category::where('code', $categoryCode)->first();
                
                DepartmentCategoryBudget::create([
                    'department_budget_id' => $deptBudget->id,
                    'category_id' => $category->id,
                    'allocated_amount' => $amount,
                    'reserved_amount' => 0.00,
                    'spent_amount' => 0.00,
                ]);
            }
        }
    }

    private function getCategoryAllocations($deptCode, $totalBudget): array
    {
        $allocations = [
            'IT' => [
                'ITE' => 1200000.00,  // IT Equipment: ₱1,200,000
                'SL' => 500000.00,    // Software Licenses: ₱500,000
                'OS' => 300000.00,    // Office Supplies: ₱300,000
            ],
            'HR' => [
                'TD' => 400000.00,    // Training & Development: ₱400,000
                'OS' => 300000.00,    // Office Supplies: ₱300,000
                'TT' => 300000.00,    // Travel & Transportation: ₱300,000
            ],
            'FIN' => [
                'SL' => 500000.00,    // Software Licenses: ₱500,000
                'OS' => 400000.00,    // Office Supplies: ₱400,000
                'MR' => 600000.00,    // Maintenance & Repairs: ₱600,000
            ],
            'OPS' => [
                'FF' => 1000000.00,   // Furniture & Fixtures: ₱1,000,000
                'MR' => 1000000.00,   // Maintenance & Repairs: ₱1,000,000
                'OS' => 500000.00,    // Office Supplies: ₱500,000
                'TT' => 500000.00,    // Travel & Transportation: ₱500,000
            ],
            'MKT' => [
                'MA' => 1500000.00,   // Marketing & Advertising: ₱1,500,000
                'TT' => 500000.00,    // Travel & Transportation: ₱500,000
                'OS' => 500000.00,    // Office Supplies: ₱500,000
            ],
        ];

        return $allocations[$deptCode] ?? [];
    }
}
```

### Purchase Request Seeder
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\PurchaseRequestStatusHistory;
use App\Models\User;
use App\Models\Department;
use App\Models\Category;
use Carbon\Carbon;

class PurchaseRequestSeeder extends Seeder
{
    public function run(): void
    {
        $itDeptHead = User::where('email', 'juan.reyes@company.com')->first();
        $admin = User::where('email', 'admin@company.com')->first();
        $itDept = Department::where('code', 'IT')->first();
        $itEquipment = Category::where('code', 'ITE')->first();

        // Create sample purchase requests
        $this->createApprovedPR($itDeptHead, $admin, $itDept, $itEquipment);
        $this->createPendingPR($itDeptHead, $itDept, $itEquipment);
        $this->createRejectedPR($itDeptHead, $admin, $itDept, $itEquipment);
        $this->createOrderedPR($itDeptHead, $admin, $itDept, $itEquipment);
    }

    private function createApprovedPR($requestedBy, $approvedBy, $department, $category)
    {
        $pr = PurchaseRequest::create([
            'pr_number' => $this->generatePRNumber(),
            'department_id' => $department->id,
            'category_id' => $category->id,
            'requested_by' => $requestedBy->id,
            'approved_by' => $approvedBy->id,
            'purpose' => 'Upgrade development workstations for the software engineering team to improve productivity and support new development tools.',
            'total_estimated_cost' => 450000.00,
            'status' => 'Approved',
            'remarks' => 'Approved as requested. Please ensure proper asset tagging upon receipt.',
            'submitted_at' => Carbon::now()->subDays(5),
            'approved_at' => Carbon::now()->subDays(3),
        ]);

        // Add line items
        $items = [
            [
                'item_name' => 'Dell Precision 5680 Workstation',
                'description' => 'Intel Core i9, 64GB RAM, 1TB SSD, NVIDIA RTX 4000',
                'quantity' => 5,
                'unit_price' => 75000.00,
                'total_price' => 375000.00,
                'vendor' => 'Dell Technologies',
            ],
            [
                'item_name' => 'Dell UltraSharp U2723QE Monitor',
                'description' => '27-inch 4K USB-C Hub Monitor',
                'quantity' => 5,
                'unit_price' => 15000.00,
                'total_price' => 75000.00,
                'vendor' => 'Dell Technologies',
            ],
        ];

        foreach ($items as $item) {
            PurchaseRequestItem::create(array_merge($item, ['purchase_request_id' => $pr->id]));
        }

        // Add status history
        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => null,
            'to_status' => 'Draft',
            'changed_by' => $requestedBy->id,
            'remarks' => 'PR created',
            'created_at' => Carbon::now()->subDays(5),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Draft',
            'to_status' => 'Submitted',
            'changed_by' => $requestedBy->id,
            'remarks' => 'Submitted for approval',
            'created_at' => Carbon::now()->subDays(5),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Submitted',
            'to_status' => 'Approved',
            'changed_by' => $approvedBy->id,
            'remarks' => 'Approved as requested',
            'created_at' => Carbon::now()->subDays(3),
        ]);
    }

    private function createPendingPR($requestedBy, $department, $category)
    {
        $pr = PurchaseRequest::create([
            'pr_number' => $this->generatePRNumber(),
            'department_id' => $department->id,
            'category_id' => $category->id,
            'requested_by' => $requestedBy->id,
            'purpose' => 'Purchase additional laptops for new hires joining next month.',
            'total_estimated_cost' => 300000.00,
            'status' => 'Submitted',
            'submitted_at' => Carbon::now()->subDays(1),
        ]);

        $items = [
            [
                'item_name' => 'Dell Latitude 5540 Laptop',
                'description' => 'Intel Core i7, 16GB RAM, 512GB SSD',
                'quantity' => 4,
                'unit_price' => 75000.00,
                'total_price' => 300000.00,
                'vendor' => 'Dell Technologies',
            ],
        ];

        foreach ($items as $item) {
            PurchaseRequestItem::create(array_merge($item, ['purchase_request_id' => $pr->id]));
        }

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => null,
            'to_status' => 'Draft',
            'changed_by' => $requestedBy->id,
            'remarks' => 'PR created',
            'created_at' => Carbon::now()->subDays(1),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Draft',
            'to_status' => 'Submitted',
            'changed_by' => $requestedBy->id,
            'remarks' => 'Submitted for approval',
            'created_at' => Carbon::now()->subDays(1),
        ]);
    }

    private function createRejectedPR($requestedBy, $approvedBy, $department, $category)
    {
        $pr = PurchaseRequest::create([
            'pr_number' => $this->generatePRNumber(),
            'department_id' => $department->id,
            'category_id' => $category->id,
            'requested_by' => $requestedBy->id,
            'purpose' => 'Purchase high-end gaming PCs for the office',
            'total_estimated_cost' => 500000.00,
            'status' => 'Rejected',
            'rejection_reason' => 'Request does not align with business requirements. Gaming PCs are not necessary for office operations.',
            'submitted_at' => Carbon::now()->subDays(10),
            'approved_at' => Carbon::now()->subDays(8),
        ]);

        $items = [
            [
                'item_name' => 'Custom Gaming PC',
                'description' => 'High-end gaming configuration',
                'quantity' => 2,
                'unit_price' => 250000.00,
                'total_price' => 500000.00,
                'vendor' => 'Local Builder',
            ],
        ];

        foreach ($items as $item) {
            PurchaseRequestItem::create(array_merge($item, ['purchase_request_id' => $pr->id]));
        }

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => null,
            'to_status' => 'Draft',
            'changed_by' => $requestedBy->id,
            'remarks' => 'PR created',
            'created_at' => Carbon::now()->subDays(10),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Draft',
            'to_status' => 'Submitted',
            'changed_by' => $requestedBy->id,
            'remarks' => 'Submitted for approval',
            'created_at' => Carbon::now()->subDays(10),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Submitted',
            'to_status' => 'Rejected',
            'changed_by' => $approvedBy->id,
            'remarks' => 'Request does not align with business requirements',
            'created_at' => Carbon::now()->subDays(8),
        ]);
    }

    private function createOrderedPR($requestedBy, $approvedBy, $department, $category)
    {
        $pr = PurchaseRequest::create([
            'pr_number' => $this->generatePRNumber(),
            'department_id' => $department->id,
            'category_id' => $category->id,
            'requested_by' => $requestedBy->id,
            'approved_by' => $approvedBy->id,
            'purpose' => 'Network switch upgrade for improved connectivity',
            'total_estimated_cost' => 150000.00,
            'status' => 'Ordered',
            'remarks' => 'Approved. Order placed with vendor.',
            'submitted_at' => Carbon::now()->subDays(15),
            'approved_at' => Carbon::now()->subDays(13),
            'ordered_at' => Carbon::now()->subDays(10),
        ]);

        $items = [
            [
                'item_name' => 'Cisco Catalyst 9200 Switch',
                'description' => '48-port Gigabit switch',
                'quantity' => 2,
                'unit_price' => 75000.00,
                'total_price' => 150000.00,
                'vendor' => 'Cisco Systems',
            ],
        ];

        foreach ($items as $item) {
            PurchaseRequestItem::create(array_merge($item, ['purchase_request_id' => $pr->id]));
        }

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => null,
            'to_status' => 'Draft',
            'changed_by' => $requestedBy->id,
            'remarks' => 'PR created',
            'created_at' => Carbon::now()->subDays(15),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Draft',
            'to_status' => 'Submitted',
            'changed_by' => $requestedBy->id,
            'remarks' => 'Submitted for approval',
            'created_at' => Carbon::now()->subDays(15),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Submitted',
            'to_status' => 'Approved',
            'changed_by' => $approvedBy->id,
            'remarks' => 'Approved',
            'created_at' => Carbon::now()->subDays(13),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Approved',
            'to_status' => 'Ordered',
            'changed_by' => $approvedBy->id,
            'remarks' => 'Order placed with Cisco Systems',
            'created_at' => Carbon::now()->subDays(10),
        ]);
    }

    private function generatePRNumber(): string
    {
        $year = date('Y');
        $lastPr = PurchaseRequest::where('pr_number', 'like', "PR-{$year}-%")
            ->orderBy('pr_number', 'desc')
            ->first();

        if ($lastPr) {
            $lastNumber = intval(substr($lastPr->pr_number, -3));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return sprintf('PR-%s-%03d', $year, $newNumber);
    }
}
```

### Update DatabaseSeeder
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DepartmentSeeder::class,
            CategorySeeder::class,
            UserSeeder::class,
            CompanyBudgetSeeder::class,
            DepartmentBudgetSeeder::class,
            DepartmentCategoryBudgetSeeder::class,
            PurchaseRequestSeeder::class,
        ]);
    }
}
```

---

## Eloquent Models & Relationships

### User Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['first_name', 'middle_name', 'last_name', 'email', 'password', 'role', 'status', 'department_id'])]
#[Hidden(['password'])]
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function purchaseRequests()
    {
        return $this->hasMany(PurchaseRequest::class, 'requested_by');
    }

    public function approvedPurchaseRequests()
    {
        return $this->hasMany(PurchaseRequest::class, 'approved_by');
    }

    public function statusHistory()
    {
        return $this->hasMany(PurchaseRequestStatusHistory::class, 'changed_by');
    }

    public function uploadedAttachments()
    {
        return $this->hasMany(PurchaseRequestAttachment::class, 'uploaded_by');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isDepartmentHead(): bool
    {
        return $this->role === 'department_head';
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }
}
```

### Department Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'code', 'description', 'budget_allocation', 'allocation_percentage'])]
class Department extends Model
{
    use HasFactory;

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function departmentBudgets(): HasMany
    {
        return $this->hasMany(DepartmentBudget::class);
    }

    public function purchaseRequests(): HasMany
    {
        return $this->hasMany(PurchaseRequest::class);
    }

    public function departmentHeads()
    {
        return $this->hasMany(User::class)->where('role', 'department_head');
    }
}
```

### Category Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'code', 'description'])]
class Category extends Model
{
    use HasFactory;

    public function departmentCategoryBudgets(): HasMany
    {
        return $this->hasMany(DepartmentCategoryBudget::class);
    }

    public function purchaseRequests(): HasMany
    {
        return $this->hasMany(PurchaseRequest::class);
    }
}
```

### CompanyBudget Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['fiscal_year', 'total_budget', 'allocated_amount'])]
class CompanyBudget extends Model
{
    use HasFactory;

    protected $casts = [
        'total_budget' => 'decimal:2',
        'allocated_amount' => 'decimal:2',
        'available_amount' => 'decimal:2',
    ];

    public function departmentBudgets()
    {
        return $this->hasMany(DepartmentBudget::class, 'fiscal_year', 'fiscal_year');
    }

    public function getUtilizationPercentageAttribute(): float
    {
        if ($this->total_budget == 0) return 0;
        return ($this->allocated_amount / $this->total_budget) * 100;
    }
}
```

### DepartmentBudget Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['department_id', 'fiscal_year', 'allocated_amount', 'reserved_amount', 'spent_amount'])]
class DepartmentBudget extends Model
{
    use HasFactory;

    protected $casts = [
        'allocated_amount' => 'decimal:2',
        'reserved_amount' => 'decimal:2',
        'spent_amount' => 'decimal:2',
        'available_amount' => 'decimal:2',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function departmentCategoryBudgets()
    {
        return $this->hasMany(DepartmentCategoryBudget::class);
    }

    public function getUtilizationPercentageAttribute(): float
    {
        if ($this->allocated_amount == 0) return 0;
        return (($this->reserved_amount + $this->spent_amount) / $this->allocated_amount) * 100;
    }
}
```

### DepartmentCategoryBudget Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['department_budget_id', 'category_id', 'allocated_amount', 'reserved_amount', 'spent_amount'])]
class DepartmentCategoryBudget extends Model
{
    use HasFactory;

    protected $casts = [
        'allocated_amount' => 'decimal:2',
        'reserved_amount' => 'decimal:2',
        'spent_amount' => 'decimal:2',
        'available_amount' => 'decimal:2',
    ];

    public function departmentBudget()
    {
        return $this->belongsTo(DepartmentBudget::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function getUtilizationPercentageAttribute(): float
    {
        if ($this->allocated_amount == 0) return 0;
        return (($this->reserved_amount + $this->spent_amount) / $this->allocated_amount) * 100;
    }
}
```

### PurchaseRequest Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'pr_number',
    'department_id',
    'category_id',
    'requested_by',
    'approved_by',
    'purpose',
    'total_estimated_cost',
    'status',
    'remarks',
    'rejection_reason',
    'submitted_at',
    'approved_at',
    'ordered_at',
    'received_at',
    'released_at',
    'completed_at'
])]
class PurchaseRequest extends Model
{
    use HasFactory;

    protected $casts = [
        'total_estimated_cost' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'ordered_at' => 'datetime',
        'received_at' => 'datetime',
        'released_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items()
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    public function attachments()
    {
        return $this->hasMany(PurchaseRequestAttachment::class);
    }

    public function statusHistory()
    {
        return $this->hasMany(PurchaseRequestStatusHistory::class)->orderBy('created_at');
    }

    public function canBeSubmitted(): bool
    {
        return $this->status === 'Draft';
    }

    public function canBeApproved(): bool
    {
        return $this->status === 'Submitted';
    }

    public function canBeRejected(): bool
    {
        return $this->status === 'Submitted';
    }

    public function canBeOrdered(): bool
    {
        return $this->status === 'Approved';
    }

    public function canBeReceived(): bool
    {
        return $this->status === 'Ordered';
    }

    public function canBeReleased(): bool
    {
        return $this->status === 'Received';
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'Submitted');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'Approved');
    }
}
```

### PurchaseRequestItem Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['purchase_request_id', 'item_name', 'description', 'quantity', 'unit_price', 'total_price', 'vendor'])]
class PurchaseRequestItem extends Model
{
    use HasFactory;

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class);
    }
}
```

### PurchaseRequestAttachment Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['purchase_request_id', 'file_name', 'file_path', 'file_size', 'file_type', 'uploaded_by'])]
class PurchaseRequestAttachment extends Model
{
    use HasFactory;

    protected $casts = [
        'file_size' => 'integer',
    ];

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
```

### PurchaseRequestStatusHistory Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['purchase_request_id', 'from_status', 'to_status', 'changed_by', 'remarks'])]
class PurchaseRequestStatusHistory extends Model
{
    use HasFactory;

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public const UPDATED_AT = null;

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function changedByUser()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
```

---

## Dashboard Metrics

### Admin Dashboard Metrics

#### Endpoint: `GET /api/admin/dashboard/metrics`

**Response:**
```json
{
  "company_budget": {
    "total_budget": 10000000.00,
    "allocated_amount": 10000000.00,
    "available_amount": 0.00,
    "utilization_percentage": 100.00
  },
  "purchase_requests": {
    "total": 150,
    "draft": 10,
    "submitted": 25,
    "approved": 30,
    "rejected": 15,
    "ordered": 20,
    "received": 25,
    "released": 20,
    "completed": 5
  },
  "budget_by_department": [
    {
      "department": "Information Technology",
      "allocated": 2000000.00,
      "reserved": 500000.00,
      "spent": 800000.00,
      "available": 700000.00,
      "utilization_percentage": 65.00
    },
    {
      "department": "Human Resources",
      "allocated": 1000000.00,
      "reserved": 200000.00,
      "spent": 400000.00,
      "available": 400000.00,
      "utilization_percentage": 60.00
    }
  ],
  "recent_activity": [
    {
      "type": "pr_submitted",
      "message": "PR-2026-025 submitted by Juan Reyes",
      "timestamp": "2026-06-22T10:30:00Z"
    },
    {
      "type": "pr_approved",
      "message": "PR-2026-024 approved by Admin",
      "timestamp": "2026-06-22T09:15:00Z"
    }
  ],
  "pending_approvals": 25,
  "monthly_spending": [
    {
      "month": "January",
      "amount": 500000.00
    },
    {
      "month": "February",
      "amount": 750000.00
    }
  ]
}
```

#### Controller Method:
```php
public function getAdminDashboardMetrics()
{
    $currentYear = now()->year;
    
    $companyBudget = CompanyBudget::where('fiscal_year', $currentYear)->first();
    
    $prStats = PurchaseRequest::selectRaw('
        COUNT(*) as total,
        SUM(CASE WHEN status = "Draft" THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = "Submitted" THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = "Approved" THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = "Rejected" THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = "Ordered" THEN 1 ELSE 0 END) as ordered,
        SUM(CASE WHEN status = "Received" THEN 1 ELSE 0 END) as received,
        SUM(CASE WHEN status = "Released" THEN 1 ELSE 0 END) as released,
        SUM(CASE WHEN status = "Completed" THEN 1 ELSE 0 END) as completed
    ')->first();

    $departmentBudgets = DepartmentBudget::where('fiscal_year', $currentYear)
        ->with('department')
        ->get()
        ->map(function ($budget) {
            return [
                'department' => $budget->department->name,
                'allocated' => $budget->allocated_amount,
                'reserved' => $budget->reserved_amount,
                'spent' => $budget->spent_amount,
                'available' => $budget->available_amount,
                'utilization_percentage' => $budget->utilization_percentage,
            ];
        });

    $pendingApprovals = PurchaseRequest::where('status', 'Submitted')->count();

    return response()->json([
        'company_budget' => $companyBudget,
        'purchase_requests' => $prStats,
        'budget_by_department' => $departmentBudgets,
        'pending_approvals' => $pendingApprovals,
    ]);
}
```

---

### Department Head Dashboard Metrics

#### Endpoint: `GET /api/department-head/dashboard/metrics`

**Response:**
```json
{
  "department_budget": {
    "allocated": 2000000.00,
    "reserved": 500000.00,
    "spent": 800000.00,
    "available": 700000.00,
    "utilization_percentage": 65.00
  },
  "category_budgets": [
    {
      "category": "IT Equipment",
      "allocated": 1200000.00,
      "reserved": 300000.00,
      "spent": 500000.00,
      "available": 400000.00,
      "utilization_percentage": 66.67
    },
    {
      "category": "Software Licenses",
      "allocated": 500000.00,
      "reserved": 150000.00,
      "spent": 200000.00,
      "available": 150000.00,
      "utilization_percentage": 70.00
    },
    {
      "category": "Office Supplies",
      "allocated": 300000.00,
      "reserved": 50000.00,
      "spent": 100000.00,
      "available": 150000.00,
      "utilization_percentage": 50.00
    }
  ],
  "purchase_requests": {
    "total": 45,
    "draft": 5,
    "submitted": 8,
    "approved": 12,
    "rejected": 3,
    "ordered": 7,
    "received": 6,
    "released": 4,
    "completed": 0
  },
  "recent_requests": [
    {
      "pr_number": "PR-2026-025",
      "purpose": "Upgrade development workstations",
      "total_cost": 450000.00,
      "status": "Submitted",
      "submitted_at": "2026-06-22T10:30:00Z"
    }
  ],
  "pending_requests": 8
}
```

#### Controller Method:
```php
public function getDepartmentHeadDashboardMetrics(Request $request)
{
    $user = $request->user();
    $currentYear = now()->year;
    
    $departmentBudget = DepartmentBudget::where('department_id', $user->department_id)
        ->where('fiscal_year', $currentYear)
        ->first();

    $categoryBudgets = DepartmentCategoryBudget::whereHas('departmentBudget', function ($query) use ($user, $currentYear) {
        $query->where('department_id', $user->department_id)
              ->where('fiscal_year', $currentYear);
    })
    ->with('category')
    ->get()
    ->map(function ($budget) {
        return [
            'category' => $budget->category->name,
            'allocated' => $budget->allocated_amount,
            'reserved' => $budget->reserved_amount,
            'spent' => $budget->spent_amount,
            'available' => $budget->available_amount,
            'utilization_percentage' => $budget->utilization_percentage,
        ];
    });

    $prStats = PurchaseRequest::where('department_id', $user->department_id)
        ->selectRaw('
            COUNT(*) as total,
            SUM(CASE WHEN status = "Draft" THEN 1 ELSE 0 END) as draft,
            SUM(CASE WHEN status = "Submitted" THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN status = "Approved" THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = "Rejected" THEN 1 ELSE 0 END) as rejected,
            SUM(CASE WHEN status = "Ordered" THEN 1 ELSE 0 END) as ordered,
            SUM(CASE WHEN status = "Received" THEN 1 ELSE 0 END) as received,
            SUM(CASE WHEN status = "Released" THEN 1 ELSE 0 END) as released,
            SUM(CASE WHEN status = "Completed" THEN 1 ELSE 0 END) as completed
        ')
        ->first();

    $recentRequests = PurchaseRequest::where('department_id', $user->department_id)
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get(['pr_number', 'purpose', 'total_estimated_cost', 'status', 'submitted_at']);

    $pendingRequests = PurchaseRequest::where('department_id', $user->department_id)
        ->where('status', 'Submitted')
        ->count();

    return response()->json([
        'department_budget' => $departmentBudget,
        'category_budgets' => $categoryBudgets,
        'purchase_requests' => $prStats,
        'recent_requests' => $recentRequests,
        'pending_requests' => $pendingRequests,
    ]);
}
```

---

## Recommended Improvements

### 1. Budget Reservation System

**Implementation:**
- When a PR is approved, automatically reserve the budget amount
- Track reserved budget separately from spent budget
- Release reserved budget when PR is rejected or cancelled
- Convert reserved to spent when items are received

**Benefits:**
- Prevents double-spending of budget
- Provides accurate available budget calculations
- Enables better cash flow planning

**Code Example:**
```php
public function approvePurchaseRequest($prId, $adminId, $remarks = null)
{
    DB::transaction(function () use ($prId, $adminId, $remarks) {
        $pr = PurchaseRequest::lockForUpdate()->find($prId);
        
        // Reserve budget
        $categoryBudget = DepartmentCategoryBudget::where('category_id', $pr->category_id)
            ->whereHas('departmentBudget', function ($query) use ($pr) {
                $query->where('department_id', $pr->department_id)
                      ->where('fiscal_year', now()->year);
            })
            ->first();

        if ($categoryBudget->available_amount < $pr->total_estimated_cost) {
            throw new \Exception('Insufficient budget available');
        }

        $categoryBudget->reserved_amount += $pr->total_estimated_cost;
        $categoryBudget->save();

        // Update PR status
        $pr->status = 'Approved';
        $pr->approved_by = $adminId;
        $pr->approved_at = now();
        $pr->remarks = $remarks;
        $pr->save();

        // Log status change
        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Submitted',
            'to_status' => 'Approved',
            'changed_by' => $adminId,
            'remarks' => $remarks,
        ]);
    });
}
```

---

### 2. Comprehensive Audit Trail

**Implementation:**
- Log all user actions with timestamps
- Track field-level changes
- Store IP addresses and user agents
- Implement immutable audit logs

**Benefits:**
- Complete transparency and accountability
- Compliance with auditing requirements
- Ability to investigate issues
- Security monitoring

**Code Example:**
```php
class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

// Middleware to log actions
class LogUserAction
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);
        
        if (auth()->check() && in_array($request->method(), ['POST', 'PUT', 'DELETE'])) {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => $request->method(),
                'entity_type' => $request->route()->getName(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }
        
        return $response;
    }
}
```

---

### 3. Attachment Management with Version Control

**Implementation:**
- Store files with proper naming conventions
- Implement file versioning
- Add file validation (type, size)
- Secure file storage with access control
- Generate thumbnails for images

**Benefits:**
- Organized document management
- Track document revisions
- Security and compliance
- Easy retrieval and sharing

**Code Example:**
```php
class PurchaseRequestAttachment extends Model
{
    public function storeFile($file, $purchaseRequestId, $uploadedBy)
    {
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('purchase-requests/' . $purchaseRequestId, $fileName, 'secure');
        
        return $this->create([
            'purchase_request_id' => $purchaseRequestId,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'file_size' => $file->getSize(),
            'file_type' => $file->getClientMimeType(),
            'uploaded_by' => $uploadedBy,
        ]);
    }

    public function getDownloadUrl()
    {
        return Storage::disk('secure')->url($this->file_path);
    }
}
```

---

### 4. Budget Overrun Prevention

**Implementation:**
- Validate budget availability before PR submission
- Implement soft budget limits with warnings
- Hard budget limits with approval override
- Real-time budget monitoring
- Budget alerts and notifications

**Benefits:**
- Prevents overspending
- Enforces financial discipline
- Early warning system
- Better financial control

**Code Example:**
```php
class BudgetValidator
{
    public function validateBudgetAvailability($categoryId, $departmentId, $amount)
    {
        $categoryBudget = DepartmentCategoryBudget::where('category_id', $categoryId)
            ->whereHas('departmentBudget', function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId)
                      ->where('fiscal_year', now()->year);
            })
            ->first();

        if (!$categoryBudget) {
            throw new \Exception('Category budget not found');
        }

        $available = $categoryBudget->available_amount;
        
        if ($amount > $available) {
            $overrun = $amount - $available;
            $percentage = ($overrun / $categoryBudget->allocated_amount) * 100;
            
            if ($percentage > 10) {
                throw new \Exception(
                    "Budget overrun of {$percentage:.2f}% exceeds allowable limit. " .
                    "Available: ₱" . number_format($available, 2) . ", " .
                    "Requested: ₱" . number_format($amount, 2)
                );
            }
            
            // Warning for minor overruns
            Log::warning("Budget overrun warning: {$percentage:.2f}% for category {$categoryBudget->category->name}");
        }

        return true;
    }
}
```

---

### 5. Procurement Lifecycle Tracking

**Implementation:**
- Track time spent in each status
- Calculate average cycle times
- Identify bottlenecks
- SLA monitoring and alerts
- Performance metrics by department

**Benefits:**
- Process optimization
- Identify delays
- Improve efficiency
- Data-driven decision making

**Code Example:**
```php
class ProcurementAnalytics
{
    public function getAverageCycleTime($startDate, $endDate)
    {
        return PurchaseRequest::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'Completed')
            ->selectRaw('
                AVG(TIMESTAMPDIFF(HOUR, submitted_at, approved_at)) as avg_approval_time,
                AVG(TIMESTAMPDIFF(HOUR, approved_at, ordered_at)) as avg_ordering_time,
                AVG(TIMESTAMPDIFF(HOUR, ordered_at, received_at)) as avg_receiving_time,
                AVG(TIMESTAMPDIFF(HOUR, received_at, released_at)) as avg_release_time,
                AVG(TIMESTAMPDIFF(HOUR, submitted_at, completed_at)) as avg_total_cycle_time
            ')
            ->first();
    }

    public function identifyBottlenecks()
    {
        $threshold = 48; // hours
        
        return PurchaseRequest::where('status', 'Submitted')
            ->where('submitted_at', '<', now()->subHours($threshold))
            ->with(['department', 'requester'])
            ->get()
            ->map(function ($pr) use ($threshold) {
                $hoursPending = now()->diffInHours($pr->submitted_at);
                return [
                    'pr_number' => $pr->pr_number,
                    'department' => $pr->department->name,
                    'requester' => $pr->requester->full_name,
                    'hours_pending' => $hoursPending,
                    'threshold_exceeded_by' => $hoursPending - $threshold,
                ];
            });
    }
}
```

---

### 6. Advanced Reporting and Analytics

**Implementation:**
- Custom report builder
- Scheduled report generation
- Export to multiple formats (PDF, Excel, CSV)
- Interactive dashboards with charts
- Trend analysis and forecasting
- Comparative analysis by period

**Benefits:**
- Better decision making
- Strategic planning
- Performance monitoring
- Stakeholder communication

**Code Example:**
```php
class ReportGenerator
{
    public function generateBudgetUtilizationReport($fiscalYear, $format = 'pdf')
    {
        $data = DepartmentBudget::where('fiscal_year', $fiscalYear)
            ->with(['department', 'departmentCategoryBudgets.category'])
            ->get()
            ->map(function ($deptBudget) {
                return [
                    'department' => $deptBudget->department->name,
                    'allocated' => $deptBudget->allocated_amount,
                    'reserved' => $deptBudget->reserved_amount,
                    'spent' => $deptBudget->spent_amount,
                    'available' => $deptBudget->available_amount,
                    'utilization' => $deptBudget->utilization_percentage,
                    'categories' => $deptBudget->departmentCategoryBudgets->map(function ($catBudget) {
                        return [
                            'category' => $catBudget->category->name,
                            'allocated' => $catBudget->allocated_amount,
                            'utilization' => $catBudget->utilization_percentage,
                        ];
                    }),
                ];
            });

        return $this->exportReport($data, $format, "budget-utilization-{$fiscalYear}");
    }

    public function generateProcurementCycleReport($startDate, $endDate)
    {
        $completedPRs = PurchaseRequest::whereBetween('completed_at', [$startDate, $endDate])
            ->where('status', 'Completed')
            ->get();

        return [
            'total_completed' => $completedPRs->count(),
            'total_value' => $completedPRs->sum('total_estimated_cost'),
            'avg_cycle_time' => $completedPRs->avg(function ($pr) {
                return $pr->submitted_at->diffInHours($pr->completed_at);
            }),
            'by_department' => $completedPRs->groupBy('department_id')->map(function ($prs) {
                return [
                    'count' => $prs->count(),
                    'value' => $prs->sum('total_estimated_cost'),
                    'avg_cycle_time' => $prs->avg(function ($pr) {
                        return $pr->submitted_at->diffInHours($pr->completed_at);
                    }),
                ];
            }),
        ];
    }

    private function exportReport($data, $format, $filename)
    {
        switch ($format) {
            case 'pdf':
                return $this->generatePdf($data, $filename);
            case 'excel':
                return $this->generateExcel($data, $filename);
            case 'csv':
                return $this->generateCsv($data, $filename);
            default:
                return $data;
        }
    }
}
```

---

### 7. Notification System

**Implementation:**
- Email notifications for status changes
- In-app notifications
- SMS alerts for urgent items
- Push notifications for mobile app
- Digest notifications (daily/weekly)

**Benefits:**
- Improved communication
- Faster response times
- Better user experience
- Reduced manual follow-up

**Code Example:**
```php
class NotificationService
{
    public function notifyStatusChange($purchaseRequest, $fromStatus, $toStatus)
    {
        $recipients = $this->getNotificationRecipients($purchaseRequest, $toStatus);
        
        foreach ($recipients as $recipient) {
            // Send email
            Mail::to($recipient->email)->send(new PRStatusChanged(
                $purchaseRequest,
                $fromStatus,
                $toStatus
            ));
            
            // Create in-app notification
            $recipient->notifications()->create([
                'title' => "PR {$purchaseRequest->pr_number} Status Changed",
                'message' => "Status changed from {$fromStatus} to {$toStatus}",
                'type' => 'pr_status_change',
                'data' => [
                    'pr_id' => $purchaseRequest->id,
                    'pr_number' => $purchaseRequest->pr_number,
                ],
            ]);
        }
    }

    public function notifyBudgetAlert($departmentBudget, $threshold)
    {
        $departmentHeads = $departmentBudget->department->departmentHeads;
        
        foreach ($departmentHeads as $head) {
            Mail::to($head->email)->send(new BudgetAlert(
                $departmentBudget,
                $threshold
            ));
        }
    }

    private function getNotificationRecipients($purchaseRequest, $status)
    {
        $recipients = collect();
        
        switch ($status) {
            case 'Submitted':
                $recipients->push($purchaseRequest->requester);
                break;
            case 'Approved':
            case 'Rejected':
                $recipients->push($purchaseRequest->requester);
                break;
            case 'Ordered':
            case 'Received':
            case 'Released':
                $recipients->push($purchaseRequest->requester);
                break;
        }
        
        return $recipients;
    }
}
```

---

### 8. Multi-Level Approval Workflow (Future Enhancement)

**Implementation:**
- Configure approval levels based on amount
- Sequential approval routing
- Delegation of approval authority
- Approval matrix by department/category
- Emergency approval bypass

**Benefits:**
- Proper governance
- Risk management
- Compliance with policies
- Flexibility for urgent cases

**Code Example:**
```php
class ApprovalWorkflow
{
    public function determineApprovalRoute($purchaseRequest)
    {
        $amount = $purchaseRequest->total_estimated_cost;
        $department = $purchaseRequest->department;
        
        $rules = ApprovalRule::where('department_id', $department->id)
            ->orWhere('department_id', null) // Global rules
            ->orderBy('min_amount', 'desc')
            ->get();
        
        foreach ($rules as $rule) {
            if ($amount >= $rule->min_amount && $amount <= $rule->max_amount) {
                return $rule->approvers;
            }
        }
        
        return [User::where('role', 'admin')->first()];
    }

    public function processApproval($purchaseRequest, $approver, $action, $remarks)
    {
        $route = $this->determineApprovalRoute($purchaseRequest);
        $currentIndex = $route->search(function ($user) use ($approver) {
            return $user->id === $approver->id;
        });
        
        if ($action === 'approve') {
            if ($currentIndex === $route->count() - 1) {
                // Final approval
                $purchaseRequest->status = 'Approved';
                $purchaseRequest->approved_by = $approver->id;
                $purchaseRequest->approved_at = now();
            } else {
                // Move to next approver
                $nextApprover = $route[$currentIndex + 1];
                $this->notifyNextApprover($purchaseRequest, $nextApprover);
            }
        } elseif ($action === 'reject') {
            $purchaseRequest->status = 'Rejected';
            $purchaseRequest->rejection_reason = $remarks;
        }
        
        $purchaseRequest->save();
    }
}
```

---

## Summary

This complete redesign of the Purchase Request Management System provides:

1. **Simplified Role Structure** - Reduced from 3 roles to 2 (Admin and Department Head)
2. **Comprehensive Budget Management** - Company, Department, and Category-level budget tracking
3. **Enhanced Workflow** - Clear 8-status procurement lifecycle
4. **Audit Trail** - Complete status history tracking
5. **Attachment Management** - File upload and storage for PRs
6. **Budget Reservation** - Prevents overspending with reserved budget tracking
7. **Real-time Metrics** - Dashboard analytics for both Admin and Department Heads
8. **Scalable Architecture** - Ready for future enhancements like multi-level approvals

The system is designed with production-quality Laravel code, following best practices for database design, security, and maintainability.
