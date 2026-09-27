# ₵ Centra — Personal Finance & Expense Tracker SaaS

A modern, production-grade **Personal Finance & Expense Tracker SaaS** application built with the **MERN stack** (MongoDB, Express.js, React, Node.js), TypeScript, Vite, Material UI (MUI), and TanStack React Query.

Designed with inspiration from products like **Linear**, **Stripe**, and modern banking dashboards — minimal, elegant, and data-dense without clutter.

---

## 🚀 Key Features

### 1. Financial Cockpit (Dashboard)
- **Financial Summary KPIs**: Real-time Total Net Balance, Monthly Income, Monthly Expenses, Monthly Savings, and Savings Rate (with health status indicators).
- **Interactive Cashflow Chart**: Spending Overview tracking Income, Expenses, and Net Savings across **7 days, 30 days, 3 months, 6 months, and 1 year**.
- **Category Donut Chart**: Expense distribution by category with interactive tooltips and center total metrics.
- **Budget Status Monitor**: Real-time spending progress bars against monthly budget thresholds (`Normal`, `Near Limit`, `Exceeded`).
- **Upcoming Payments**: Scheduled upcoming EMIs, rents, and subscriptions sorted by due date.
- **Deterministic Financial Insights Engine**: Real calculated financial signals (e.g. *"You spent 18% more on Food this month"*, *"Highest spending category is Rent"*, *"Savings improved by ₹4,200"*).

### 2. Full-Featured Transaction Ledger
- Search by description and notes.
- Multi-faceted filters: Income vs Expense, Categories, Payment Methods (Cash, UPI, Credit Card, Debit Card, Bank Transfer, Other), Date ranges, and Min/Max amounts.
- Column sorting and pagination.
- Add and Edit Transaction modal with **Formik + Yup** schema validation.
- Delete transactions with confirmation dialogs.
- **CSV & Excel (.xlsx) Export**: Instant file downloads.
- **CSV Import Engine**: Drag-and-drop file upload, automated validation check, error breakdown, record preview, and confirmed batch import.

### 3. Monthly Budgets
- Set category-specific limits per month and year.
- Customizable alert warning thresholds (default 80%).
- Real-time month-over-month navigation.
- Color-coded progress bars with warning states when approaching or exceeding limits.

### 4. Financial Analytics
- Date range filtering (30D, 3M, 6M, 1Y, Custom range).
- Side-by-side Monthly Income vs Expenses Bar Chart.
- Monthly Net Savings Trajectory Line Chart.
- Ranked Category Leaderboard with proportion breakdown and transaction count.
- Payment Method Distribution Chart (UPI, Cards, Net Banking, Cash).

### 5. Savings Goals & Projections
- Create targets (e.g., *MacBook Pro M3*, *Emergency Fund*, *Vacation Fund*).
- Dynamic progress calculation with target deadline countdown.
- **Projections Engine**: Calculates required monthly savings velocity vs actual contribution velocity and flags if the goal is "On Track".
- Add deposits/contributions with notes and view complete contribution history.

### 6. Subscriptions & Recurring Payments Tracker
- Dedicated Subscription Tracker with automated **Monthly and Yearly cost normalizers**.
- Frequency support: Daily, Weekly, Monthly, Quarterly, Yearly.
- One-click Active / Paused status toggles.
- Recurring payments list for EMIs, rent, and utility bills.

### 7. Category Management
- Categorize by Income or Expense.
- Icon picker and custom color palette selector.
- **Safe Deletion & Reassignment**: Prevents accidental data loss by prompting transaction reassignment to another category before deleting.

### 8. User Preferences & Settings
- Regional currency support: **₹ INR (India)**, **$ USD**, **€ EUR**, **£ GBP**, **CA$ CAD**, **AU$ AUD**, **SG$ SGD**, **AED**.
- Dark Mode & Light Mode toggle with instant switching.
- Date format preferences (`DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`).
- Secure password change and session termination.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** & **TypeScript**
- **Vite** (Ultra-fast build tool)
- **Material UI (MUI v5)** with custom Linear/Stripe design system
- **TanStack React Query v5** (Server state, caching, optimistic mutations)
- **React Router v6** (Protected routes, dashboard layouts)
- **Formik** & **Yup** (Form validation)
- **Recharts** (Area, Bar, Line, and Donut charts)
- **Axios** (Configured with credentials for HTTP-only cookies)

### Backend
- **Node.js** & **Express.js**
- **MongoDB** & **Mongoose**
- **JWT (JSON Web Tokens)** stored securely in **HTTP-only Cookies**
- **bcryptjs** (Password hashing)
- **express-validator** (Request schema validation)
- **express-rate-limit** (Brute-force protection on auth endpoints)
- **Helmet** & **CORS** (Security headers and origin control)
- **Multer**, **csv-parse**, and **xlsx** (CSV/Excel processing)
- **mongodb-memory-server** (Automatic zero-config local fallback if no external MongoDB instance is running)

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **npm**: v9+

### 2. Quick Start (Concurrently)
Clone the repository and run:

```bash
# 1. Install all dependencies (root, backend, and frontend)
npm run install:all

# 2. Start both backend and frontend concurrently
npm run dev
```

The application will be accessible at:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001](http://localhost:5001)

---

## 🔑 Demo Account Credentials

Centra comes pre-seeded with realistic financial data so you can test it immediately:

- **Email**: `demo@example.com`
- **Password**: `Password123!`

*(You can also click the **"🚀 One-Click Demo Account Login"** button on the Login page to sign in instantly!)*

---

## 📂 Project Architecture

```
expense-tracker/
├── package.json              # Root workspace scripts & concurrently config
├── server/
│   ├── package.json
│   ├── .env.example          # Environment variables template
│   └── src/
│       ├── config/           # MongoDB connection & Memory Server fallback
│       ├── controllers/      # Business logic (Auth, Transactions, Budgets, Goals, etc.)
│       ├── middleware/       # JWT Cookie Auth, Centralized Error Handler, Rate Limiting
│       ├── models/           # Mongoose Schemas (User, Category, Transaction, Budget, Goal, Recurring)
│       ├── routes/           # Express REST API Routes
│       ├── services/         # Deterministic Financial Insights Engine
│       ├── utils/            # Realistic Indian financial seed data script & default categories
│       ├── validators/       # express-validator request schemas
│       ├── app.js            # Express app configuration
│       └── server.js         # Server entry point & auto-seed
└── client/
    ├── package.json
    ├── vite.config.ts        # Vite build configuration with API reverse proxy
    ├── index.html            # Plus Jakarta Sans & Inter typography
    └── src/
        ├── api/              # Axios instance and typed endpoint SDKs
        ├── components/       # Reusable UI components (StatCard, CashflowChart, ExpenseDonutChart,
        │                     # BudgetProgress, GoalCard, TransactionFormModal, ImportModal, ExportMenu, etc.)
        ├── context/          # AuthContext, ColorModeContext (Dark/Light), ToastContext
        ├── layouts/          # DashboardLayout, Sidebar, Navbar
        ├── pages/            # Dashboard, Transactions, Budgets, Analytics, Goals, Subscriptions,
        │                     # Recurring, Categories, Settings, Login, Register, NotFound
        ├── routes/           # ProtectedRoute and AppRoutes
        ├── theme/            # Material UI customized light and dark theme definitions
        ├── types/            # TypeScript interfaces
        └── utils/            # Formatters (INR currency, dates, symbols)
```

---

## 🔒 Security Best Practices Implemented

1. **HTTP-only Cookies**: Authentication tokens are stored strictly in HTTP-only, SameSite cookies to protect against XSS token theft. Tokens are **never** stored in `localStorage`.
2. **Password Security**: Passwords are salted and hashed using `bcrypt` (10 rounds) and stripped from all API responses (`select: false` and `toJSON` sanitization).
3. **Data Isolation**: Every database query is strictly scoped to `req.user._id`, ensuring complete isolation between tenant users.
4. **Brute Force Protection**: Rate limiting is configured on `/api/auth/register` and `/api/auth/login`.
5. **Data Protection on Delete**: Categories cannot be deleted if transactions are linked to them without selecting an explicit reassignment category.

---

## ⌨️ Keyboard Shortcuts

Speed up navigation and workflows with built-in productivity shortcuts:

- `N`: Open Add Transaction modal from anywhere in the application.
- `/`: Instantly focus the global Search input in the top bar.
- `G` then `D`: Navigate directly to the **Dashboard**.
- `G` then `T`: Navigate directly to **Transactions**.
- `G` then `B`: Navigate directly to **Budgets**.
- `G` then `A`: Navigate directly to **Analytics**.
- `Esc`: Dismiss open search / cancel modals.

