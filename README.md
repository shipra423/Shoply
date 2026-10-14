# Shoply

A premium, responsive SaaS-style e-commerce frontend built with React, Vite, Tailwind CSS and mock data. Includes a customer storefront and an admin dashboard.

## Features
- Home, categories, product catalog, search, category/price filtering, sorting and pagination
- Product details, stock availability, quantity selection, related products
- Persistent shopping cart with localStorage, empty state, order summary
- Checkout with client-side validation, mock payment choices, order confirmation
- Admin overview with metrics, illustrative sales chart, recent orders and inventory alerts
- Admin product CRUD (mock, localStorage), search/filter, confirmation modals
- Admin order status management, search/filter, details view
- Responsive layout, accessible labels, loading-ready local mock data architecture

## Tech Stack
React 18, Vite, React Router, Tailwind CSS, Lucide React, Recharts, localStorage.

## Installation
1. Install Node.js 18+.
2. Open the project in VS Code.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the URL shown by Vite (usually http://localhost:5173).

If PowerShell blocks npm.ps1 on Windows, run these commands in **Command Prompt** (CMD) or use `npm.cmd install` and `npm.cmd run dev`.

## Routes
`/` Home | `/products` Catalog | `/product/:id` Details | `/cart` Cart | `/checkout` Checkout | `/success/:id` Confirmation | `/admin` Dashboard | `/admin/products` Product management | `/admin/orders` Order management

## Deployment
Build with `npm run build`. Deploy to Vercel (Vite framework preset). Configure SPA fallback if your host does not support client-side routing.

**Deployment URL:** Add after deployment.

## Known limitations
- Frontend-only demonstration: no real authentication, payment processing, or backend database.
- Mock product and order changes persist in this browser's localStorage only.
- Sales chart is illustrative mock data, not derived from live payments.
- Product images are external Unsplash URLs and require internet connectivity.
- Payment options are simulations and do not collect card details.

## Evaluation focus
UI/UX, reusable components, React state, functional interactions, mobile responsiveness, and clear documentation.
