# FLAWS
A full-stack e-commerce platform built for the clothing brand FLAWS. The platform covers the full retail experience — from product discovery and cart management to checkout and order tracking — paired with a custom-built admin panel for complete backend control.

---

## The Problem
Off-the-shelf e-commerce solutions are generic by design. FLAWS required a platform that matched the brand's aesthetic and gave full ownership over the storefront experience, inventory management, and customer data — without the constraints of third-party platforms like Shopify.

---

## What It Does
- **Storefront** — Product listings, collections, and individual product pages built for the FLAWS brand
- **Cart & Checkout** — Full cart functionality with order placement and confirmation
- **User Authentication** — Account creation, login, and session management for customers
- **Waitlist** — Pre-launch waitlist capture for upcoming drops and collections
- **Admin Dashboard** — Internal panel for managing the full operation
  - Revenue and order analytics
  - Product and collections catalogue management
  - Inventory and stock level tracking — low stock and out-of-stock alerts
  - Order management — pending, processing, and fulfilment tracking
  - Customer overview
  - Homepage and content management
  - Activity log

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, MongoDB |
| Hosting — Frontend | Vercel |
| Hosting — Backend | Railway |

---

## System Architecture

```
Client (React + TypeScript)
│
▼
REST API (Node.js + Express)
│
├── Auth Service
├── Product & Collections Service
├── Cart & Order Service
├── Inventory & Stock Service
├── Admin Dashboard Service
└── Waitlist & Content Service
│
┌───────┴────────┐
▼                ▼
PostgreSQL           MongoDB

```

---

## Key Features

### Storefront
Customers browse products and collections, add items to cart, and place orders through a branded storefront currently running a waitlist ahead of the full launch.

### Admin Panel
A fully custom internal dashboard giving the FLAWS team complete operational visibility — revenue trends, order pipeline, stock levels, top products, recent orders, and customer data all in one place.

### Inventory Management
Stock is tracked per product variant. The dashboard flags low stock and out-of-stock items in real time, and surfaces an all-variants stock overview for quick restocking decisions.

### Role-Based Access
| Role | Access |
|---|---|
| Admin | Full platform access — catalogue, orders, users, content, analytics |
| Customer | Storefront, cart, checkout, order history |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- MongoDB

### Installation
```bash
# Clone the repository
git clone https://github.com/andile593/flaws.git
cd flaws

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your DATABASE_URL, MONGODB_URI, and JWT_SECRET

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

---

## Live Site
[flawswrldwide.com](https://www.flawswrldwide.com) — waitlist currently active

---

## Roadmap
- [ ] Payments integration (Yoco / Stripe)
- [ ] Order status notifications via email
- [ ] Mobile-optimised checkout flow
- [ ] Discount codes and promotions engine
- [ ] Analytics — sales trends by collection and variant
Two things to swap out — confirm the actual GitHub repo URL and your migration command if it differs from npm run migrate. Everything else is pulled directly from what you shared.



