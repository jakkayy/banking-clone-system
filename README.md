# JAKBank

ระบบธนาคารดิจิทัล Full-Stack สร้างด้วย Go + Next.js + PostgreSQL + Redis  
UI ดีไซน์แนว Private Banking โทนสีเข้ม/ทอง

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Go 1.22+, Gin, JWT, bcrypt |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS v3, NextUI |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Infrastructure | Docker Compose |

---

## Features

- **Authentication** — Register / Login ด้วย JWT, ล็อคบัญชีหลังพยายาม Login ผิด 5 ครั้ง (cooldown 15 นาที)
- **Accounts** — เปิดบัญชีออมทรัพย์/กระแสรายวัน, ดูยอดคงเหลือและรายละเอียดบัญชี
- **Transfer** — โอนเงินแบบ Atomic ด้วย `SELECT FOR UPDATE` ป้องกัน Race Condition
- **Deposit / Withdraw** — ฝาก/ถอนเงิน อัปเดตยอดแบบ Real-time
- **Transaction History** — ดูรายการย้อนหลังแบบ Paginated ต่อบัญชี
- **Protected Routes** — Auth Guard ฝั่ง Client, Auto-redirect ไป Login

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
│   └── db/migrations/           # SQL migration files
├── frontend/
│   ├── app/                     # Next.js App Router pages
│   │   ├── page.tsx             # Landing page
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── accounts/
│   │   ├── transfer/
│   │   ├── deposit/
│   │   └── withdraw/
│   ├── components/
│   │   ├── AppLayout.tsx        # Sidebar layout + auth guard
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

### สิ่งที่ต้องติดตั้งก่อน

- Docker & Docker Compose
- Go 1.22+
- Node.js 18+

### 1. Clone โปรเจค

```bash
git clone https://github.com/jakkayy/banking.git
cd banking
```

### 2. ตั้งค่า Environment Variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

แก้ไขค่าต่าง ๆ ตามต้องการ (ดูรายละเอียดด้านล่าง)

### 3. เริ่ม Infrastructure

```bash
make up
```

รัน PostgreSQL, Redis และ pgAdmin — Migration รันอัตโนมัติตอน Boot ครั้งแรก

### 4. รัน Backend

```bash
make dev-backend
```

API พร้อมใช้งานที่ `http://localhost:8080`

### 5. รัน Frontend

```bash
make dev-frontend
```

App พร้อมใช้งานที่ `http://localhost:3000`

---

## API Endpoints

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

ทุก Endpoint ยกเว้น `/auth/register` และ `/auth/login` ต้องแนบ `Authorization: Bearer <token>`

---

## Environment Variables

**`backend/.env`**

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=banking_user
DB_PASSWORD=banking_password
DB_NAME=banking_db
REDIS_URL=localhost:6380
JWT_SECRET=your_secret_here
PORT=8080
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## Makefile Commands

```bash
make up             # เริ่ม Docker services
make down           # หยุด Docker services
make logs           # ดู Docker logs แบบ Follow
make dev-backend    # รัน Go backend
make dev-frontend   # รัน Next.js dev server
make tidy           # go mod tidy
make build-backend  # Build Go binary
```

---

## Architecture Notes

- **Clean Architecture** — Handler → Service → Repository พร้อม Interface abstraction
- **Atomic Transfers** — ใช้ PostgreSQL Transaction + `SELECT FOR UPDATE` ล็อค UUID ตามลำดับเพื่อป้องกัน Deadlock
- **Account Lockout** — นับความพยายาม Login ผิดใน DB, ล็อคบัญชี 15 นาทีหลังผิด 5 ครั้ง
- **Standardized Responses** — ทุก API Response ตาม Schema `{ success, message, data }`

---

## pgAdmin

เข้าใช้งานที่ `http://localhost:5050`

| | |
|---|---|
| Email | `admin@admin.com` |
| Password | `admin` |

---

## License

MIT
