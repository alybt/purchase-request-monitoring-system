# Frontend API Integration & State Management Documentation

This document describes the technical architecture and details of the frontend API integration for the **Purchase Request Monitoring System**.

---

## Table of Contents
1. [Overview](#1-overview)
2. [Service Layer Architecture](#2-service-layer-architecture)
3. [Authentication & Session Flow](#3-authentication--session-flow)
4. [User Management CRUD](#4-user-management-crud)
5. [Purchase Request Mapping & Operations](#5-purchase-request-mapping--operations)
6. [Approval Panel & Audit Trail Logs](#6-approval-panel--audit-trail-logs)
7. [Dashboard Analytics & Reports Visualizations](#7-dashboard-analytics--reports-visualizations)
8. [Build and Type Safety Verification](#8-build-and-type-safety-verification)

---

## 1. Overview
The frontend is constructed using **Next.js** (App Router) and **TypeScript**. It connects to a **Laravel** backend REST API. The system handles authentication, user provisioning, role-based workflows for purchase requests, approval tracking, and administrative overview dashboards.

* **API Base URL**: `http://127.0.0.1:8000/api`
* **Local Storage Keys**: 
  * `token`: Bearer authentication token.
  * `user`: Parsed JSON string containing the active user profile information.

---

## 2. Service Layer Architecture
All API calls are decoupled from React components into dedicated TypeScript service files located under `frontend/services/`.

Each service features error handling and auto-injects the Bearer token authorization header if present:

```typescript
function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
```

### Registered Service Files:
* `auth.service.ts`: Sign in, session revocation (logout), and active profile fetch (`/api/me`).
* `users.service.ts`: Query, filter, create, update, delete, and bulk delete users.
* `purchase-requests.service.ts`: Query, create, update, delete, bulk delete, approve, and reject purchase requests.
* `dashboard.service.ts`: Query dashboard metrics, monthly spends, department counts, and recent pipeline queues.

---

## 3. Authentication & Session Flow

### Login Flow:
1. `LoginForm.tsx` submits credentials to `login(email, password)`.
2. Stores the authentication token and initial user profile into `localStorage`.
3. Navigates the client to the `/dashboard`.

### Session Verification & Sync:
In `frontend/app/dashboard/layout.tsx`, a React hook verifies token existence:
* If no token is detected, it redirects to the login screen (`/`).
* If a token is detected, it invokes `getCurrentUser()` (`/api/me`) to sync database-side user modifications (e.g. role updates or status suspension) and updates the local storage cache. If the token is invalid or expired, it wipes local session keys and redirects to `/`.

---

## 4. User Management CRUD
Controlled via `frontend/app/dashboard/users/page.tsx`, integrating:
* **Search / Filter query**: Sends real-time filter updates to `getUsers(search, role, status, department)`.
* **Add/Edit forms**: Submits inputs to the backend database.
* **Status Mapping**: Map custom ENUM options between frontend and backend schemas (e.g., `employee` to `requester`, `suspended` to `inactive`).
* **Bulk Delete**: Relies on `/api/users/bulk-delete`.

---

## 5. Purchase Request Mapping & Operations
Because the backend table requires relational `line_items` (items table) whereas the frontend forms submit a single purpose and total cost, we implemented a mapping translator.

### Creation Translation (Frontend -> Backend):
When submitting the PR form, the service layer converts the fields into a relational payload containing a single default line item:
```typescript
{
  purpose_of_requests: data.description,
  line_items: [
    {
      item_name: data.description.substring(0, 50) || "General Purchase Item",
      description: data.description,
      quantity: 1,
      unit_price: data.amount,
      vendor: "General Vendor",
    }
  ]
}
```

### Status Translation (Backend -> Frontend):
We translate PostgreSQL/SQLite `status` ENUM states and historical approval records:
* If there is an approval record with status `Reject` in the `approvals` association, the frontend treats the PR status as `rejected`.
* Otherwise:
  * `Request` -> `pending`
  * `Approve` -> `approved`
  * `Released` / `Received` -> `completed`

---

## 6. Approval Panel & Audit Trail Logs
When viewing a purchase request inside `ViewPRModal.tsx`:
1. **Line Items Grid**: Renders all individual line items tied to the request.
2. **Approval History Timeline**: Shows an audit trail listing previous approvals/rejections, the name of the approver, comment notes, and specific execution timestamps.
3. **Approval Action Panel**: Visible only to users with the role of `admin` or `approver` when the request is `pending`. Provides Approve and Reject buttons with an optional comment text field.

---

## 7. Dashboard Analytics & Reports Visualizations
1. **Overview Dashboard**: Hooked up to `/api/dashboard/metrics` and `/api/dashboard/recent-prs` to feed:
   * Real-time numeric counters (Total Spent, Bottlenecks pending over 48 hours, Active Users count).
   * Percent changes compared to last month.
   * Recent approval pipeline table with custom status color badges.
2. **Report Analytics**:
   * Renders a custom responsive CSS/HTML vertical bar chart mapping Monthly Expenditures over the last 6 months.
   * Renders a horizontal percentage breakdown progress card comparing request counts and total costs across departments.

---

## 8. Build and Type Safety Verification
The frontend code was compiled and verified clean of typescript and bundler errors:
```bash
# Typecheck
npx tsc --noEmit
# Production build
npm run build
```
* **Status**: Passed (0 compilation warnings, 0 type errors, successfully built static pages).
