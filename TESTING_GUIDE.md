# User Acceptance Testing (UAT) Manual

This guide is designed for **human testers** to manually verify the features of the Purchase Request Monitoring System. Follow the step-by-step instructions below to validate each system module.

---

## 1. User Authentication & Login

* **Feature Name**: User Authentication & Login
* **Short Description**: Allows users to securely log into the system based on their credentials.
* **Step-by-Step Instructions**:
  1. Navigate to the login page (root URL `/`).
  2. Enter an invalid email (e.g., `wrong@company.com`) and password, then click **Sign In**.
  3. Enter a valid user email and password (e.g., administrator or approver accounts).
  4. Click **Sign In**.
* **Expected Outcome**:
  * Entering invalid credentials displays a red warning banner: `"Something went wrong. Please try again."` or `"Invalid credentials"`.
  * Entering valid credentials redirects you to the dashboard page (`/dashboard`), rendering the main navigation sidebar.

---

## 2. User Profile Session Sync & Auto-Logout

* **Feature Name**: User Profile Session Sync & Auto-Logout
* **Short Description**: Keeps the active user session synchronized and safely redirects users if they log out or if their credentials expire.
* **Step-by-Step Instructions**:
  1. Once logged in, locate the user profile card at the top-right corner of the screen.
  2. Hover over the sidebar on the left and click the **Sign Out** button at the bottom.
* **Expected Outcome**:
  * The header avatar displays the active user's initials, name, and email address.
  * Clicking **Sign Out** immediately invalidates the login session, clears local memory, and redirects you back to the clean login screen.

---

## 3. User & Role Management (Admin-Only)

* **Feature Name**: User & Role Management
* **Short Description**: Allows administrators to view, add, search, edit, and delete employee accounts.
* **Step-by-Step Instructions**:
  1. Log in as an Administrator and click **User & Role Mgmt** in the left sidebar.
  2. Type a name in the search bar and verify list filtering.
  3. Select a role (e.g., `Approver` or `Requester`) from the filter dropdown.
  4. Click **Create User**, fill out the form, and submit.
  5. Select a user row, click **Edit**, modify their department, and submit.
  6. Toggle **Delete Mode** using the button in the toolbar:
     * Click the trash icon on a single user row to delete them.
     * Check checkboxes on multiple user rows and click **Delete [N] Users** to perform a bulk-delete.
* **Expected Outcome**:
  * The user list updates dynamically when searching or filtering.
  * The **Create User** and **Edit User** actions immediately update the data table.
  * Deleted user profiles disappear from the list.

---

## 4. Purchase Request Creation

* **Feature Name**: Purchase Request Creation
* **Short Description**: Allows employees to submit new purchase requests with description details and estimated costs.
* **Step-by-Step Instructions**:
  1. Log in and navigate to the **Global PR Mgmt** page.
  2. Click the **Create PR** button at the top-right.
  3. Fill in the form: select a **Department**, input an **Amount**, enter a **Description**, choose a **Due Date**, and input **Requested By**.
  4. Click **Create PR**.
* **Expected Outcome**:
  * A new purchase request appears at the top of the table.
  * The system automatically generates a unique tracking code (e.g., `PR-2026-007`).
  * The amount is formatted with the Philippine Peso currency sign (e.g., `₱50,000`).

---

## 5. View Purchase Request Details

* **Feature Name**: View Purchase Request Details
* **Short Description**: Expands a detailed modal window showing line items and a historical log of approvals/rejections.
* **Step-by-Step Instructions**:
  1. On the **Global PR Mgmt** page, locate a purchase request row.
  2. Click the eye icon (**View**) in the actions column.
* **Expected Outcome**:
  * An overlay modal appears displaying the PR Number, status, requester info, due date, and description.
  * A **Line Items** grid lists detailed item quantities, unit prices, and computed total costs.
  * An **Approval History** panel lists all actions taken on the request, showing the name of the approver, comment notes, and dates.

---

## 6. Approving a Purchase Request (Approver / Admin)

* **Feature Name**: Approving a Purchase Request
* **Short Description**: Allows authorized managers/approvers to review pending purchase requests and mark them as approved.
* **Step-by-Step Instructions**:
  1. Log in as an **Admin** or **Approver**.
  2. Go to **Global PR Mgmt** and click **View** on a request with a yellow `Pending` badge.
  3. Scroll to the **Approval Action Panel** inside the modal.
  4. Type an approval comment (e.g., `"Budget approved for Q3 upgrade"`).
  5. Click the **Approve PR** button.
* **Expected Outcome**:
  * The modal refreshes, updating the PR status badge to a green `Approved` badge.
  * The approval comment and your name are immediately appended to the **Approval History** list.
  * The Action Panel (buttons/comment text box) disappears since the request is no longer pending.

---

## 7. Rejecting a Purchase Request (Approver / Admin)

* **Feature Name**: Rejecting a Purchase Request
* **Short Description**: Allows managers/approvers to reject a request and provide explanatory feedback.
* **Step-by-Step Instructions**:
  1. Log in as an **Admin** or **Approver**.
  2. Go to **Global PR Mgmt** and view a `Pending` request.
  3. Scroll to the **Approval Action Panel** in the modal.
  4. Type a reason for rejection (e.g., `"Overbudget, please find another vendor"`).
  5. Click the **Reject PR** button.
* **Expected Outcome**:
  * The modal updates, displaying a red `Rejected` status badge.
  * The rejection reason and your name appear in the **Approval History** timeline.
  * The Action Panel disappears, locking the request from further approvals.

---

## 8. Dashboard Overview & Pipeline

* **Feature Name**: Dashboard Overview & Pipeline
* **Short Description**: Displays high-level analytics, key performance alerts, and recent request queues on a single page.
* **Step-by-Step Instructions**:
  1. Click **Dashboard** in the sidebar.
  2. Observe the stats cards at the top.
  3. Observe the **Recent Approval Pipeline** table.
  4. Click the **View All** link next to the pipeline title.
* **Expected Outcome**:
  * Cards display the system's Total Spent, Active Users count, and the count of Bottlenecks (PRs pending for over 48 hours).
  * The pipeline list shows the 5 most recent requests.
  * Clicking **View All** redirects you directly to the full PR Management table.

---

## 9. Report Analytics & Spending Trends

* **Feature Name**: Report Analytics & Spending Trends
* **Short Description**: Provides visual charts summarizing monthly spending and department activity levels.
* **Step-by-Step Instructions**:
  1. Click **Report Analytics** in the sidebar.
  2. Review the **Monthly Expenditure** chart on the left.
  3. Review the **Requests by Department** card list on the right.
* **Expected Outcome**:
  * A vertical bar chart displays expenditures over the last 6 months (hovering over bars shows tooltips with exact spending amounts).
  * Horizontal progress indicators show percentage breakdowns, request counts, and expenditure sums for each department.

---

## 10. Data Export (CSV)

* **Feature Name**: Data Export (CSV)
* **Short Description**: Allows users to download a CSV spreadsheet containing all purchase request details.
* **Step-by-Step Instructions**:
  1. Go to the **Global PR Mgmt** page.
  2. Click the **Export List** button at the top-right.
* **Expected Outcome**:
  * A download immediately starts for a file named `purchase_requests_export.csv`.
  * Opening the file reveals columns for PR Number, Department, Amount, Status, Requester, Date Requested, and Due Date.
