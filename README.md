# JAKBank

ระบบธนาคารดิจิทัลแบบ full-stack ที่แยก `frontend`, `backend` และ infrastructure ออกจากกันชัดเจน เหมาะสำหรับใช้เป็นโปรเจกต์ตัวอย่างด้าน business flow, API design และ deployment พื้นฐานด้วย Docker Compose และ Kubernetes

## Overview

- Frontend ใช้ Next.js App Router, TypeScript, Tailwind CSS และ NextUI
- Backend ใช้ Go, Gin, PostgreSQL และ JWT authentication
- Infrastructure สำหรับ local development ใช้ Docker Compose
- Infrastructure สำหรับ container orchestration มี Kubernetes manifests อยู่ในโฟลเดอร์ `k8s/`

## Features

- สมัครสมาชิกและเข้าสู่ระบบด้วย JWT
- ป้องกัน brute force ด้วย account lockout หลัง login ผิด 5 ครั้ง
- เปิดบัญชีออมทรัพย์และกระแสรายวัน
- ฝาก ถอน และโอนเงินระหว่างบัญชี
- ดูข้อมูลบัญชีและประวัติธุรกรรมแบบแบ่งหน้า
- ป้องกัน race condition ในการโอนเงินด้วย database transaction และ row locking

## Architecture

### Application

```text
Frontend (Next.js)
        |
        v
Backend API (Go + Gin)
        |
        +--> PostgreSQL
        |
        +--> Redis
```

### Backend layers

โค้ดฝั่ง backend แยกเป็นแนว `handler -> service -> repository` เพื่อให้ logic ธุรกิจ, การเข้าถึงข้อมูล และ transport layer แยกกันชัดเจน

- `handler` รับ request/response
- `service` จัดการ business rules
- `repository` คุยกับฐานข้อมูล
- `middleware` จัดการ authentication

## Project structure

```text
banking/
├── backend/
│   ├── cmd/main.go
│   ├── db/migrations/
│   ├── internal/account/
│   ├── internal/auth/
│   ├── internal/config/
│   ├── internal/database/
│   ├── internal/middleware/
│   ├── internal/response/
│   └── internal/transaction/
├── frontend/
│   ├── app/
│   ├── components/
│   └── lib/
├── k8s/
│   ├── backend.yaml
│   ├── frontend.yaml
│   ├── postgres.yaml
│   └── redis.yaml
├── docker-compose.yml
├── Makefile
└── README.md
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, NextUI |
| Backend | Go 1.26, Gin, JWT, bcrypt |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Local Infra | Docker Compose |
| Container Deploy | Docker + Kubernetes manifests |

## Getting started

### Prerequisites

- Docker และ Docker Compose
- Go 1.26+
- Node.js 22+
- npm

### 1. Clone repository

```bash
git clone https://github.com/jakkayy/banking.git
cd banking
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

ค่าพื้นฐานที่โปรเจกต์ใช้:

**`backend/.env`**

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=banking_user
DB_PASSWORD=banking_password
DB_NAME=banking_db
REDIS_URL=localhost:6380
JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRY=24h
SERVER_PORT=8080
GIN_MODE=debug
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## Run locally

### Start infrastructure

```bash
make up
```

คำสั่งนี้จะเปิด services ต่อไปนี้:

- PostgreSQL ที่ `localhost:5432`
- Redis ที่ `localhost:6380`
- pgAdmin ที่ `http://localhost:5050`

หมายเหตุ: migration SQL ใน `backend/db/migrations` จะถูก mount เข้าไปที่ `docker-entrypoint-initdb.d` ของ PostgreSQL และจะรันตอนสร้าง database volume ครั้งแรก

### Start backend

```bash
make dev-backend
```

Backend API จะรันที่ `http://localhost:8080`

### Start frontend

```bash
make dev-frontend
```

Frontend จะรันที่ `http://localhost:3000`

## Docker Compose infrastructure

ไฟล์ [docker-compose.yml](/home/naeiger/banking/docker-compose.yml) ใช้สำหรับ local stack โดยมีองค์ประกอบดังนี้:

- `postgres`
  ใช้ image `postgres:16-alpine`
- `redis`
  ใช้ image `redis:7-alpine`
- `pgadmin`
  ใช้ image `dpage/pgadmin4:latest`
- `postgres_data`
  named volume สำหรับเก็บข้อมูล PostgreSQL

### Service map

| Service | Port | Purpose |
|---|---:|---|
| PostgreSQL | `5432` | ฐานข้อมูลหลัก |
| Redis | `6380` -> container `6379` | cache / shared in-memory service |
| pgAdmin | `5050` | database UI |

### pgAdmin credentials

| Field | Value |
|---|---|
| Email | `admin@admin.com` |
| Password | `admin` |

## Kubernetes manifests

โฟลเดอร์ [k8s](/home/naeiger/banking/k8s) มี manifest แยกสำหรับ 4 workloads:

- [k8s/postgres.yaml](/home/naeiger/banking/k8s/postgres.yaml)
- [k8s/redis.yaml](/home/naeiger/banking/k8s/redis.yaml)
- [k8s/backend.yaml](/home/naeiger/banking/k8s/backend.yaml)
- [k8s/frontend.yaml](/home/naeiger/banking/k8s/frontend.yaml)

แต่ละไฟล์ประกอบด้วย `Deployment` และ `Service` แบบพื้นฐาน เพื่อให้เห็นโครง deploy ระดับเริ่มต้นของระบบ

### Apply manifests

```bash
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

### สิ่งที่ manifests ชุดนี้ทำได้แล้ว

- แยก workload ตาม service หลัก
- เปิด service ภายใน cluster ให้ backend คุยกับ database และ redis ได้
- รองรับการ scale backend หลาย replica

### สิ่งที่ควรเพิ่มก่อนใช้จริง

- `Secret` และ `ConfigMap` สำหรับ credentials และ config
- `PersistentVolume` / `PersistentVolumeClaim` สำหรับ PostgreSQL
- `Ingress` หรือ external load balancer สำหรับเปิด frontend/backend ออกนอก cluster
- health probes เช่น `readinessProbe` และ `livenessProbe`
- migration job หรือ init container สำหรับ schema management
- ปรับค่า image tag จาก `latest` เป็น version ที่ชัดเจน

### ข้อสังเกตจาก manifest ปัจจุบัน

- Backend โค้ดอ่าน `REDIS_URL` และ `SERVER_PORT` เป็นหลัก แต่ manifest ยังแยก `REDIS_HOST` กับ `REDIS_PORT`
- Frontend ใช้ `NEXT_PUBLIC_API_URL` แบบเต็ม path เช่น `http://<host>/api/v1` แต่ manifest ปัจจุบันตั้งค่าเป็น `http://localhost:8080`
- PostgreSQL ใน Kubernetes ยังไม่มี persistent storage ดังนั้นข้อมูลจะไม่ทนต่อการ recreate pod

README นี้จึงมอง manifests ใน `k8s/` เป็น baseline สำหรับการต่อยอด มากกว่าจะเป็น production-ready deployment ทันที

## API summary

### Auth

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

### Accounts

```text
GET  /api/v1/accounts
POST /api/v1/accounts
GET  /api/v1/accounts/:id
```

### Transactions

```text
POST /api/v1/transactions/transfer
POST /api/v1/transactions/deposit
POST /api/v1/transactions/withdraw
GET  /api/v1/transactions?account_id=<id>&page=1&limit=20
GET  /api/v1/transactions/:id
```

ทุก endpoint ยกเว้น `register` และ `login` ต้องส่ง header:

```text
Authorization: Bearer <token>
```

## Development commands

```bash
make up
make down
make logs
make dev-backend
make dev-frontend
make tidy
make build-backend
```

## Operational notes

- CORS ถูกเปิดแบบ `*` ใน backend เพื่อความง่ายในการพัฒนา
- Frontend จะ fallback ไปที่ `http://localhost:8080/api/v1` ถ้าไม่ได้ตั้ง `NEXT_PUBLIC_API_URL`
- Backend จะ fallback ไปที่ค่า default ของ database, redis และ port ถ้าไม่ได้กำหนด env
- Redis มีอยู่ในระบบ infra แต่จากโค้ดปัจจุบัน backend ยังไม่ได้เชื่อมใช้งานจริงใน flow หลัก

## License

MIT
