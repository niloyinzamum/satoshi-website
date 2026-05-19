# Satoshi Breakfast Ordering System

This project is a Next.js application that handles breakfast ordering, menu management, and order tracking. This document outlines the project's routing structure, including all pages and API endpoints.

## Application Pages (Frontend Routes)

The application uses the Next.js App Router (`src/app`). Below are the registered routes:

### Public Pages
- `/` - **Home / Landing Page** (`src/app/page.tsx`): The main public-facing interface where customers can browse the menu and place orders.
- `/order/[id]` - **Order Status Page** (`src/app/order/[id]/page.tsx`): Displays the status and details of a specific customer order.

### Manager Dashboard Pages
- `/manager/login` - **Manager Login** (`src/app/manager/login/page.tsx`): Authentication page for managers.
- `/manager` - **Manager Dashboard** (`src/app/manager/page.tsx`): The main dashboard for managers to view and manage active orders.
- `/manager/order/[id]` - **Manager Order Detail** (`src/app/manager/order/[id]/page.tsx`): Detailed view of a specific order for manager processing.
- `/manager/breakfast` - **Breakfast Menu Management** (`src/app/manager/breakfast/page.tsx`): Interface for managing breakfast items.
- `/manager/websitemanagement` - **Website Management** (`src/app/manager/websitemanagement/page.tsx`): Configuration for website settings.

### Admin Pages
- `/admin/catalog` - **Catalog Management** (`src/app/admin/catalog/page.tsx`): Admin-level catalog and inventory management.
- `/admin/deploy` - **Deployment Dashboard** (`src/app/admin/deploy/page.tsx`): Interface to manage site deployments.

---

## API Endpoints (Backend Routes)

The application exposes the following RESTful API routes under `/api`:

### Authentication
- `POST /api/auth/login` - Authenticate users/managers.
- `POST /api/auth/logout` - Clear user session.

### General Settings & Content
- `GET/PUT /api/settings` - Fetch or update application settings.
- `GET/POST /api/upload` - Upload image or media files.

### Menu & Products
- `GET /api/menu` - Fetch the current active menu for customers.
- `GET/POST /api/landing-products` - Manage products featured on the landing page.
- `GET/PUT/DELETE /api/landing-products/[id]` - Manage a specific landing page product.

### Orders
- `GET/POST /api/orders` - Create a new order or fetch a list of orders (manager).
- `GET/PUT/DELETE /api/orders/[id]` - Fetch, update status, or delete a specific order.

### Admin Endpoints
- `GET/POST /api/admin/packages` - Manage food packages.
- `GET/PUT/DELETE /api/admin/packages/[id]` - Manage a specific food package.
- `GET/POST /api/admin/beverages` - Manage beverage catalog.
- `GET/PUT/DELETE /api/admin/beverages/[id]` - Manage a specific beverage.
- `POST /api/admin/deploy` - Trigger a new deployment.
- `GET /api/deployments/active` - Retrieve current active deployment status.

---

## Development

To run the project locally:

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
