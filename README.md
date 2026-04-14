# JAKBank — ระบบการธนาคารดิจิทัลที่เป็นส่วนตัว

A full-stack banking portfolio project built with Go (Gin) + Next.js + PostgreSQL + Redis, featuring a premium dark/gold UI inspired by private banking aesthetics.

---

## สแต็กเทคโนโลยี

| Layer | Technology |
|---|---|
| Backend | Go 1.26, Gin, JWT, bcrypt |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v3, NextUI |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Infrastructure | Docker Compose |

---

## คุณสมบัติ

- **Authentication** — Register, login with JWT, account lockout after 5 failed attempts (15-min cooldown)
- **Accounts** — Open savings/checking accounts, view balances and account details
- **Transfers** — Atomic fund transfers with `SELECT FOR UPDATE` to prevent race conditions
- **Deposits & Withdrawals** — Real-time balance updates
- **Transaction History** — Paginated statement view per account
- **Protected Routes** — Client-side auth guard, auto-redirect to login

---

## โครงสร้างโปรเจค

```
banking/
├── backend/
│   ├── cmd/main.go              # Entry point, DI wiring, router
│   ├── internal/
│   │   ├── auth/                # Register, login, JWT, lockout
│   │   ├── account/             # Account CRUD, number generation
│   │   ├── transaction/         # Transfer, deposit, withdraw
│   │   ├── middleware/          # JWT auth middleware
│   │   ├── config/              # Env config loader
│   │   ├── database/            # PostgreSQL connection
│   │   └── response/            # Standardized JSON responses
│   ├── db/migrations/           # SQL migration files
│   └── .env                     # Backend env vars (not committed)
├── frontend/
│   ├── app/                     # Next.js App Router pages
│   │   ├── page.tsx             # Landing page
│   │   ├── login/               # Sign in
│   │   ├── register/            # Open account
│   │   ├── dashboard/           # Overview
│   │   ├── accounts/            # Portfolio list + detail
│   │   ├── transfer/            # Wire transfer
│   │   ├── deposit/             # Deposit funds
│   │   └── withdraw/            # Withdraw funds
│   ├── components/
│   │   ├── AppLayout.tsx        # Sidebar layout with auth guard
│   │   └── Providers.tsx        # NextUI provider wrapper
│   └── lib/
│       ├── api.ts               # Fetch-based API client
│       ├── auth.ts              # Token helpers, formatters
│       └── types.ts             # Shared TypeScript types
├── docker-compose.yml
└── Makefile
```

---

## เริ่มต้นใช้งาน

### ข้อกำหนดเบื้องต้น

- Docker & Docker Compose
- Go 1.22+
- Node.js 18+

### 1. โคลนและตั้งค่า

```bash
git clone https://github.com/jakkayy/banking.git
cd banking
```

Copy and edit the backend env file:

```bash
cp backend/.env.example backend/.env
```

Copy and edit the frontend env file:

```bash
cp frontend/.env.local.example frontend/.env.local
```

### 2. เริ่มโครงสร้างพื้นฐาน

```bash
make up
```

This starts PostgreSQL, Redis, and pgAdmin. Migrations run automatically on first boot.

### 3. เรียกใช้ backend

```bash
make dev-backend
```

API available at `http://localhost:8080`

### 4. เรียกใช้ frontend

```bash
make dev-frontend
```

App available at `http://localhost:3000`

---

## จุดปลายทาง API

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me

GET    /api/v1/accounts
POST   /api/v1/accounts
GET    /api/v1/accounts/:id

POST   /api/v1/transactions/transfer
POST   /api/v1/transactions/deposit
POST   /api/v1/transactions/withdraw
GET    /api/v1/transactions/account/:id?page=1&limit=10
GET    /api/v1/transactions/:id
```

All endpoints except `/auth/register` and `/auth/login` require `Authorization: Bearer <token>`.

---

## Environment Variables

**`backend/.env`**

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=banking
REDIS_URL=localhost:6380
JWT_SECRET=your_secret_here
PORT=8080
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## คำสั่ง Makefile

```bash
make up            # Start Docker services
make down          # Stop Docker services
make logs          # Follow Docker logs
make dev-backend   # Run Go backend (hot reload not included)
make dev-frontend  # Run Next.js dev server
make tidy          # Run go mod tidy
make build-backend # Build Go binary
```

---

## หมายเหตุสถาปัตยกรรม

- **Clean Architecture** — Handler → Service → Repository with interface abstractions
- **Atomic Transfers** — Uses PostgreSQL transactions with `SELECT FOR UPDATE`, locks acquired in consistent UUID order to prevent deadlocks
- **Account Lockout** — Failed login attempts tracked in DB; account locked for 15 minutes after 5 consecutive failures
- **Standardized Responses** — All API responses follow `{ success, message, data }` schema

---

## ใบอนุญาต

MIT
