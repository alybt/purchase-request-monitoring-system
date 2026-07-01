This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Testing & Verification

We use [Vitest](https://vitest.dev/) along with jsdom for comprehensive unit testing of frontend services and utility helpers.

To run the automated test suite:

```bash
npm test
```

### Covered Architecture Layer (`services/` & `lib/`)
* **Services (`services/`)**:
  * `auth.service.ts`: Login, logout, session user retrieval (`/me`), and password changes.
  * `budget.service.ts`: Category budgets, department budget summaries, monthly allocation breakdowns, and company budget upserts.
  * `dashboard.service.ts`: Dashboard metric KPIs and recent purchase request synchronization.
  * `purchase-requests.service.ts`: PR schema mappers (`purpose`, `items`, `requester`), filtering, CRUD actions, bulk deletions, and attachment management.
  * `users.service.ts`: User list queries, RBAC role mapping, status transformations, and bulk actions.
* **Libraries (`lib/`)**:
  * `auth-utils.ts`: LocalStorage token management, role extraction, display name formatting, and role-based redirect paths.
  * `print.ts`: Voucher and budget allocation printable report generation inside hidden DOM iframes.
  * `api.ts`: Base login request wrapper.

---

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
