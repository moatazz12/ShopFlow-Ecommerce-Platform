# ShopFlow - B2C E-commerce Platform

[![Java 21](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.13-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JUnit 5](https://img.shields.io/badge/JUnit%205-123%20Passed-25A162?style=for-the-badge&logo=junit5&logoColor=white)](https://junit.org/junit5/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)

---

### Project Metadata
- **Timeline:** April 2026
- **Context:** Academic Software Engineering Project @ Institut International de Technologie (IIT)
- **Author:** Moataz TRIKI (GLID - Software Engineering)

---

## Overview

Engineered ShopFlow, a comprehensive B2C e-commerce platform designed for optimal user experience and high availability.

ShopFlow addresses real-world digital commerce complexities through a decoupled, multi-tier cloud-native architecture. Built with an enterprise-grade **Spring Boot** backend and an ultra-responsive **Next.js** App Router frontend, it delivers complete lifecycle management for e-commerce—from secure role-based access control and multi-variant inventory tracking to persistent cart sessions, coupon discount computation, checkout workflows, and role-specific analytics dashboards.

---

## Key Contributions

- **Architected and developed a high-performance multi-tier architecture.**
- **Built a robust backend REST API ensuring secure and efficient data management.**
- **Designed a responsive, modern frontend interface for seamless customer journeys.**

---

## Tech Stack

### Backend Architecture
- **Language & Runtime:** Java 21 (LTS)
- **Framework:** Spring Boot 3.5.13 (`spring-boot-starter-web`, `spring-boot-starter-validation`)
- **Security & Authorization:** Spring Security 6, Stateless JWT (Dual-token architecture: Access & Refresh tokens via `jjwt 0.11.5`), BCrypt hashing
- **Persistence & ORM:** Spring Data JPA, Hibernate, PostgreSQL driver, H2 In-Memory Database (zero-config local dev & automated test suites)
- **Object Mapping & Productivity:** MapStruct 1.5.5, Project Lombok
- **API Documentation:** Springdoc OpenAPI 2.8.6 (Interactive Swagger UI & OpenAPI 3.0 specs)
- **Code Coverage & Quality:** JaCoCo 0.8.12, Jakarta Bean Validation

### Frontend Engineering
- **Framework:** Next.js 16.2.3 (App Router architecture with React Server & Client Components)
- **Library:** React 19.2.4 with TypeScript 5
- **Styling & UI:** Tailwind CSS 4, Framer Motion 12.38 (fluid micro-interactions & page transitions), Lucide React
- **State Management & Data Fetching:** TanStack React Query v5.99 (server cache synchronization, optimistic mutations)
- **Networking:** Axios 1.15 with request/response interceptors for automated JWT token rotation & error normalization
- **Forms & Validation:** React Hook Form 7.72 paired with Zod 4.3 schemas
- **Document Generation & Feedback:** `@react-pdf/renderer` (client-side PDF invoice/order receipt generation), Sonner (toast notifications), `next-themes` (Dark/Light mode)

### DevOps & Engineering Tooling
- **Build Systems:** Apache Maven (Backend), npm (Frontend)
- **Testing Suites:** JUnit 5, Mockito, Spring Boot Starter Test (123 automated test suites)
- **API Collaboration:** Postman Collection (`shopflow.postman_collection.json`)
- **Version Control:** Git, GitHub

---

## System Architecture & Design

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|  Next.js 16 (App Router) • React 19 • Tailwind CSS 4 • TanStack Query • Framer  |
+---------------------------------------+-----------------------------------------+
                                        | HTTP / REST (JSON)
                                        | Axios Interceptors (JWT Bearer)
+---------------------------------------v-----------------------------------------+
|                              API & SECURITY TIER                                |
|  Spring Security 6 Filter Chain • JwtAuthenticationFilter • GlobalExceptionHandler |
+---------------------------------------+-----------------------------------------+
                                        | DTOs (MapStruct)
+---------------------------------------v-----------------------------------------+
|                             BUSINESS LOGIC TIER                                 |
|  AuthService  •  ProductService  •  CartService  •  OrderService  •  CouponService |
|  AddressService • ReviewService • DashboardService • CustomUserDetailsService   |
+---------------------------------------+-----------------------------------------+
                                        | Spring Data JPA
+---------------------------------------v-----------------------------------------+
|                               PERSISTENCE TIER                                  |
|  PostgreSQL 16 (Production)  /  H2 In-Memory Database (Development & Testing)   |
+---------------------------------------------------------------------------------+
```

### Key Architectural Highlights
1. **Stateless JWT Dual-Token Authentication:** Access tokens (short-lived) coupled with refresh tokens (long-lived) to prevent session hijacking while ensuring seamless background session renewal.
2. **Role-Based Access Control (RBAC):** Distinct permissions across `ADMIN`, `SELLER`, and `CUSTOMER` roles guarding endpoints at both the API filter level and Next.js middleware router level.
3. **Transactional Order & Inventory Pipeline:** Atomic order checkout with transactional stock verification, preventing race conditions and inventory drift.
4. **Decoupled Multi-Variant Engine:** Products support independent SKU variants (sizes, colors, custom attributes) with dedicated inventory management.
5. **Real-Time Promotional Calculation:** Discount validation engine supporting both percentage (`PERCENT`) and fixed-amount (`FIXED`) promo codes with expiration and minimum order constraints.

---

## Project Structure

```
miniProjet/
├── backend/                              # Spring Boot REST API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/shopflow/
│   │   │   │   ├── config/              # SecurityConfig, JwtAuthFilter, OpenApiConfig, WebConfig
│   │   │   │   ├── controller/          # REST Endpoints (Auth, Product, Cart, Order, etc.)
│   │   │   │   ├── dto/                 # Request/Response Data Transfer Objects
│   │   │   │   ├── entities/            # JPA Entities (User, Product, Order, Cart, etc.)
│   │   │   │   ├── exception/           # Custom Domain Exceptions & Error Payloads
│   │   │   │   ├── mapper/              # MapStruct Entity-DTO bidirectional mappers
│   │   │   │   ├── repository/          # Spring Data JPA Repositories
│   │   │   │   └── service/             # Transactional Service Implementations
│   │   │   └── resources/
│   │   │       ├── application.properties      # Dev profile (H2, Port 8095)
│   │   │       ├── application-prod.properties # Prod profile (PostgreSQL)
│   │   │       └── data.sql                    # Pre-seeded test data & catalog
│   │   └── test/java/com/shopflow/      # 123 JUnit 5 & Mockito Unit & Integration Tests
│   ├── pom.xml                          # Maven build definition & dependencies
│   ├── mvnw / mvnw.cmd                  # Maven wrappers (Unix / Windows)
│   └── uploads/                         # Multipart uploaded product images
│
├── frontend/                             # Next.js 16 Web Client
│   ├── src/
│   │   ├── app/                         # App Router (Pages, Layouts & Sub-routes)
│   │   │   ├── (auth)/                  # Login & Registration workflows
│   │   │   ├── admin/                   # Admin management dashboard
│   │   │   ├── seller/                  # Seller catalog & orders dashboard
│   │   │   ├── products/                # Catalog browsing, filtering, search
│   │   │   ├── product/[id]/            # Dynamic product detail & variant selector
│   │   │   ├── cart/                    # Shopping cart & coupon application
│   │   │   ├── checkout/                # Multi-step checkout & payment
│   │   │   └── orders/                  # Order tracking & invoice generation
│   │   ├── components/                  # Reusable UI component library
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── lib/                         # Utility helpers & formatters
│   │   ├── middleware.ts                # Route protection & role redirection
│   │   ├── services/                    # Axios API client & token interceptors
│   │   └── types/                       # TypeScript domain definitions
│   ├── package.json                     # Frontend dependencies & scripts
│   ├── tsconfig.json                    # TypeScript compiler configuration
│   └── tailwind.config / postcss        # Tailwind CSS 4 styling pipeline
│
├── shopflow.postman_collection.json      # Postman test collection for all endpoints
└── README.md                             # Comprehensive technical documentation
```

---

## Getting Started

### Prerequisites
- **Java Development Kit (JDK):** Version 21 LTS installed (`java -version`)
- **Node.js:** Version 18.x or 20.x+ (`node -v`) & npm
- **Git:** Version 2.x+

---

### 1. Backend Setup (Spring Boot)

The backend defaults to an embedded **H2 In-Memory Database** with automatic data pre-seeding via `data.sql`, enabling instant zero-config startup without installing external databases.

```bash
# Navigate to the backend directory
cd backend

# On Linux / macOS:
./mvnw spring-boot:run

# On Windows (PowerShell / Command Prompt):
./mvnw.cmd spring-boot:run
```

Once started, the backend services are exposed at:
- **API Base URL:** `http://localhost:8095`
- **Interactive Swagger UI:** `http://localhost:8095/swagger-ui.html`
- **OpenAPI 3.0 Specs:** `http://localhost:8095/v3/api-docs`
- **H2 In-Memory Console:** `http://localhost:8095/h2-console`
  - *JDBC URL:* `jdbc:h2:mem:shopflow_db`
  - *User:* `sa` | *Password:* *(empty)*

> **Production Mode (PostgreSQL):**
> To run with PostgreSQL, ensure a local instance is running on port `5432` with database `shopflow`, or pass environment variables:
> ```bash
> ./mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=prod
> ```

---

### 2. Frontend Setup (Next.js)

```bash
# Navigate to the frontend directory
cd frontend

# Install project dependencies
npm install

# Verify environment configuration (preconfigured in .env.example)
# NEXT_PUBLIC_API_URL=http://localhost:8095/api

# Launch the Next.js development server
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`** to interact with the application.

---

## Demonstration Accounts

The platform comes pre-seeded with sample user accounts representing all 3 user personas:

| Role | Email | Password | Access & Capabilities |
|---|---|---|---|
| **Administrator** | `admin@shopflow.com` | `admin123` | Platform analytics, user management, category management, dispute moderation |
| **Seller** | `seller@shopflow.com` | `seller123` | Product lifecycle, inventory & variant tracking, sales metrics, order fulfillment |
| **Customer** | `customer@shopflow.com` | `customer123` | Catalog browsing, persistent cart, promo coupons, checkout, order history |

---

## Testing & Quality Assurance

A core focus was placed on code reliability, defect prevention, and deterministic business logic across the application lifecycle.

- **Total Automated Tests:** 123 tests across 13 test suites
- **Coverage:** 100% test coverage across the Service (business logic) layer
- **Testing Frameworks:** JUnit 5, Mockito, Spring Boot Starter Test

```bash
cd backend
./mvnw test
```

| Domain Test Suite | Test Count | Status | Scope |
|---|:---:|:---:|---|
| **Product & Inventory Management** | 32 | PASSED | Variant stock synchronization, pagination, soft-delete |
| **Order & Checkout Lifecycle** | 28 | PASSED | Cart-to-order pipeline, price reconciliation, inventory locks |
| **Authentication & Security** | 24 | PASSED | JWT signature validation, token refresh, password hashing |
| **Coupons & Customer Reviews** | 39 | PASSED | Percentage/fixed discount calculations, moderation rules |

---

## API Testing with Postman

A comprehensive Postman collection is included in the project root:
- File: [`shopflow.postman_collection.json`](./shopflow.postman_collection.json)
- Features preconfigured requests, automated JWT Bearer variable persistence on login, and sample payloads covering the complete REST API surface.

---

## License & Academic Integrity

Developed as part of the Academic Curriculum in Software Engineering at **Institut International de Technologie (IIT)**.  
All rights reserved © 2026 Moataz TRIKI.
