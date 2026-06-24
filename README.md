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

## Database Migrations

Apply these SQL migrations to `flexxrent_db` before testing Admin/Agent CRM APIs:

1. `db/migrations/20260624_admin_crm_columns.sql`
2. `db/migrations/20260624_agent_crm_schema_sync.sql`
3. `db/migrations/20260624_payments_mvp.sql`
4. `db/migrations/20260624_matcher_questionnaire.sql`
5. `db/migrations/20260625_booking_flow_p0.sql`

Example:

```bash
mysql -u root flexxrent_db -e "source db/migrations/20260624_admin_crm_columns.sql"
mysql -u root flexxrent_db -e "source db/migrations/20260624_agent_crm_schema_sync.sql"
mysql -u root flexxrent_db -e "source db/migrations/20260624_payments_mvp.sql"
mysql -u root flexxrent_db -e "source db/migrations/20260624_matcher_questionnaire.sql"
mysql -u root flexxrent_db -e "source db/migrations/20260625_booking_flow_p0.sql"
```

## Payments MVP (Sandbox)

Set webhook secret in `.env`:

```bash
PAYMENT_WEBHOOK_SECRET=dev_payment_secret_change_me
```

Payment flow endpoints:

- `POST /api/payments/create-intent` - create pending payment transaction for a booking
- `POST /api/payments/mock-confirm` - sandbox provider confirmation used by client UI
- `POST /api/payments/webhook` - signed webhook endpoint (`x-payment-signature`)

Business rule used by webhook processing:

- agent approval moves booking/property to payment hold:
  - booking: `NEW -> PENDING_PAYMENT`
  - property: `AVAILABLE -> PENDING_PAYMENT`
- successful payment (`SUCCESS`) finalizes booking/property:
  - booking: `PENDING_PAYMENT -> RESERVED` (legacy `PENDING` is normalized)
  - property: `PENDING_PAYMENT -> RESERVED`
- expired unpaid hold is auto-cancelled when key booking/payment APIs run:
  - booking: `PENDING_PAYMENT -> CANCELLED`
  - property: `PENDING_PAYMENT -> AVAILABLE`
- failed payment keeps booking status unchanged

Local webhook test example:

```bash
node -e "const crypto=require('crypto');const payload=JSON.stringify({eventId:'evt_local_1',transactionId:'tx_local_1',bookingId:1,amount:1000,status:'SUCCESS',paidAt:new Date().toISOString()});const sig=crypto.createHmac('sha256',process.env.PAYMENT_WEBHOOK_SECRET).update(payload).digest('hex');console.log('signature:',sig);console.log('payload:',payload)"
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
