# TransitView

TransitView is a full-stack web application for collecting, browsing, and moderating public transport vehicle data and photos.

The repository is split into:

- `backend` - Express, Prisma, PostgreSQL, JWT auth, Cloudinary uploads, Resend contact email.
- `frontend` - React, Vite, Tailwind CSS, React Router.

## Project Structure

```text
TransitView/
|-- backend/
|   |-- prisma/
|   |   |-- data/              # Seed data used by backend/prisma/seed.ts
|   |   |-- migrations/        # Prisma migration files
|   |   |-- schema.prisma      # Database schema
|   |   `-- seed.ts            # Creates demo data and database views
|   |-- src/
|   |   |-- app.ts             # Express app entry point
|   |   |-- config/            # Prisma, Multer, Cloudinary setup
|   |   |-- controllers/       # HTTP request handlers
|   |   |-- middleware/        # Auth and role checks
|   |   |-- routes/            # API route definitions
|   |   |-- services/          # Database and business logic
|   |   |-- types/             # Backend TypeScript types
|   |   |-- utils/             # Shared backend helpers
|   |   |-- validators/        # Zod request validation
|   |   `-- generated/         # Generated Prisma client, do not edit manually
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- assets/            # Global CSS and static frontend assets
|   |   |-- components/        # Reusable UI, cards, filters, and modals
|   |   |-- config/            # Frontend API clients
|   |   |-- context/           # Auth and toast providers
|   |   |-- data/              # Static page data
|   |   |-- hooks/             # Reusable React hooks
|   |   |-- layouts/           # Public and dashboard layouts
|   |   |-- pages/             # Route pages
|   |   |-- routes/            # React Router setup and guards
|   |   |-- types/             # Frontend TypeScript types
|   |   `-- utils/             # Shared frontend helpers
|   `-- package.json
|-- .env.example.backend       # Backend env template
|-- .env.example.frontend      # Frontend env template
|-- vercel.json                # Frontend deployment config
`-- README.md
```

The main rule of thumb is: `controllers` handle HTTP details, `services` handle database/business logic, and frontend `pages` combine API calls with reusable `components`.

## Features

- Public vehicle and photo browsing with filters and pagination.
- Authenticated dashboard for personal vehicles and photos.
- Moderation dashboard for editors and administrators.
- Vehicle creation with first photo upload.
- Photo uploads for existing vehicles.
- Review statuses: `Ootel`, `Kinnitatud`, `Tagasi_lukatud`.
- Vehicle conditions: `Töökorras`, `Ei_tööta`, `Maha_kantud`, `Müüdud`, `Teadmata`.
- Cloudinary image storage.
- Contact form email delivery through Resend.
- Role-based access control.

## Roles

- `Kasutaja` - manages their own pending/rejected vehicles and photos.
- `Andmebaasi_toimetaja` - moderates and manages all content.
- `Administraator` - manages users and has all editor permissions.

Administrator restrictions:

- Admin users cannot create another admin through the normal user creation flow.
- Admin users cannot be deleted.
- Users with related vehicles or photos cannot be deleted until their content is removed.

## Requirements

- Node.js
- npm
- PostgreSQL
- Cloudinary account
- Resend account for contact form email

## Backend Setup

From the `backend` folder:

```bash
npm install
```

Create `backend/.env` from `.env.example.backend` and fill in the values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=SCHEMA_NAME"
PORT=5000
JWT_SECRET="change-this-secret"

CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

RESEND_API_KEY=""
CONTACT_FROM_EMAIL="TransitView <onboarding@resend.dev>"
CONTACT_TO_EMAIL="youremail@example.com"

SEED_USER_PASSWORD="change-this-user-password"
SEED_EDITOR_PASSWORD="change-this-editor-password"
SEED_ADMIN_PASSWORD="change-this-admin-password"
```

Notes:

- Do not commit real `.env` files. They are ignored by Git.
- `CONTACT_TO_EMAIL` can contain multiple recipients separated by commas.
- `CONTACT_FROM_EMAIL` must be a sender Resend allows. `onboarding@resend.dev` is useful for testing. For production, verify your own domain in Resend and use an address like `TransitView <noreply@yourdomain.ee>`.
- Seed user passwords are intentionally stored in env variables instead of `backend/prisma/data/users.ts`.

Generate Prisma client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate
```

Seed/reset the database:

```bash
npm run db:setup
```

Run backend in development:

```bash
npm run dev
```

Build backend:

```bash
npm run build
```

Start built backend:

```bash
npm run start
```

Default local API:

```text
http://localhost:5000/api
```

## Frontend Setup

From the `frontend` folder:

```bash
npm install
```

Create `frontend/.env` from `.env.example.frontend`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Run frontend in development:

```bash
npm run dev
```

Build frontend:

```bash
npm run build
```

Lint frontend:

```bash
npm run lint
```

Preview production build:

```bash
npm run preview
```

## Deployment

### Frontend on Vercel

The repo includes root-level `vercel.json` for easier frontend deployment.

It uses:

- install command: `cd frontend && npm ci`
- build command: `cd frontend && npm run build`
- output directory: `frontend/dist`
- SPA rewrite to `index.html` so direct route refreshes work.

Set this Vercel environment variable:

```env
VITE_API_BASE_URL=https://your-backend-url/api
```

### Backend Hosting

The backend is a long-running Express server and should be deployed to a Node-capable host such as Render, Railway, Fly.io, VPS, or another service that supports PostgreSQL networking and persistent environment variables.

Set the same backend env variables listed in the backend setup section.

## Contact Form Email

The frontend posts contact messages to:

```text
POST /api/contact
```

The backend validates the payload with Zod and sends the email through Resend.

Required backend env variables:

```env
RESEND_API_KEY=""
CONTACT_FROM_EMAIL="TransitView <onboarding@resend.dev>"
CONTACT_TO_EMAIL="youremail@example.com"
```

The submitted user email is sent as `reply_to`, so admins can reply directly to the person who submitted the form.

## Authentication

Login returns a JWT token. Protected requests use:

```text
Authorization: Bearer TOKEN
```

## Main API Endpoints

### Auth

```text
POST /api/auth/login
GET  /api/auth/me
```

### Public Vehicles

```text
GET    /api/vehicles
GET    /api/vehicles/:id
POST   /api/vehicles
PATCH  /api/vehicles/:id
DELETE /api/vehicles/:id
GET    /api/vehicles/pending
```

Vehicle create/update/delete requires auth. Pending vehicles require editor/admin role.

### Public Photos

```text
POST   /api/photos/upload
GET    /api/photos
GET    /api/photos/:id
GET    /api/photos/vehicle/:vehicleId
POST   /api/photos
PATCH  /api/photos/:id
DELETE /api/photos/:id
GET    /api/photos/pending
```

Photo create/update/delete requires auth. Pending photos require editor/admin role.

### Manage Vehicles

Editor/admin only:

```text
GET    /api/manage/vehicles
GET    /api/manage/vehicles/:id
PATCH  /api/manage/vehicles/:id
DELETE /api/manage/vehicles/:id
PATCH  /api/manage/vehicles/:id/approve
PATCH  /api/manage/vehicles/:id/reject
PATCH  /api/manage/vehicles/:id/pending
```

### Manage Photos

Editor/admin only:

```text
GET    /api/manage/photos
GET    /api/manage/photos/:id
PATCH  /api/manage/photos/:id
DELETE /api/manage/photos/:id
PATCH  /api/manage/photos/:id/approve
PATCH  /api/manage/photos/:id/reject
PATCH  /api/manage/photos/:id/pending
```

### Manage Users

Editor/admin can list and inspect users. Admin-only operations are enforced in routes/controllers where needed.

```text
GET    /api/manage/users
GET    /api/manage/users/:id
POST   /api/manage/users
PATCH  /api/manage/users/:id
DELETE /api/manage/users/:id
```

### Reference Data

```text
GET /api/reference/public-filters
GET /api/reference/my-filters
GET /api/reference/manage-filters
GET /api/reference/counties
GET /api/reference/cities
GET /api/reference/categories
GET /api/reference/models
GET /api/reference/companies
GET /api/reference/company-branches
```

`my-filters` requires auth. `manage-filters` requires editor/admin role and includes manage-visible data, including unreviewed/new data.

### Stats

```text
GET /api/stats/public
GET /api/stats/my
GET /api/stats/manage
```

`my` requires auth. `manage` requires editor/admin role.

### Contact

```text
POST /api/contact
```

Public endpoint for the contact form.

## Moderation Rules

- New vehicles and photos are created with `Ootel` status.
- Approved items become `Kinnitatud`.
- Rejected items become `Tagasi_lukatud` and require a review comment.
- Vehicle approval/rejection also updates related pending references where needed.
- Manage pages can see all statuses. Public pages only expose approved public data.

## Useful Commands

Backend:

```bash
cd backend
npm run prisma:generate
npm run build
npm run dev
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
npm run dev
```

## Security Notes

- Never commit real API keys, JWT secrets, database URLs, or seed passwords.
- Rotate any API key that was shared outside the local `.env`.
- Keep `VITE_API_BASE_URL` public-safe because frontend env variables are bundled into client code.
- Keep Resend, Cloudinary secret keys, JWT secret, and database credentials only in backend env variables.
