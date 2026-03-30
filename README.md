<div align="center">

# 🍕 FoodApp — Food Delivery Platform

**A production-grade, microservices-based food delivery backend built with Spring Boot 3 and Java 21**

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.x-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Kafka](https://img.shields.io/badge/Apache_Kafka-3.x-231F20?style=flat&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#-features) · [Architecture](#-architecture) · [Services](#-services) · [Quick Start](#-quick-start) · [API Docs](#-api-documentation) · [Deployment](#-deployment)

</div>

---

## 📌 Overview

FoodApp is a scalable, event-driven food delivery backend modelled after platforms like Swiggy and Zomato. It is built as a collection of independently deployable Spring Boot microservices, each owning its own data store and communicating through REST (synchronous) and Kafka (asynchronous).

The system supports three user roles — **Customer**, **Restaurant Owner**, and **Delivery Driver** — and handles the full order lifecycle from browsing restaurants to live GPS tracking and payment settlement.

---

## ✨ Features

- 🔐 **JWT authentication** with OTP-based phone verification (MSG91 / Twilio)
- 🍽️ **Restaurant & menu management** with Elasticsearch-powered geo-search
- 📦 **Order state machine** — Pending → Confirmed → Preparing → Picked Up → Delivered
- 💳 **Payments** via Stripe (international) and Razorpay (India — UPI, NetBanking, wallets)
- 📍 **Real-time driver tracking** over WebSocket + STOMP, GPS positions stored in Redis & MongoDB
- 🔔 **Push, SMS & email notifications** triggered by Kafka events (Firebase FCM, Twilio, SendGrid)
- ⚡ **Virtual threads** (Java 21 Project Loom) for high-concurrency on all services
- 🛡️ **API gateway** with rate limiting, JWT validation, and circuit breakers
- 📊 **Observability** with Prometheus, Grafana, and Jaeger distributed tracing
- 🐳 **Docker Compose** for local development, **Kubernetes** manifests for production

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Client Apps                         │
│  Customer (iOS/Android) · Restaurant Portal · Driver App │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────────────┐
│          API Gateway  (Spring Cloud Gateway :8080)       │
│       JWT Filter · Rate Limiter · Route Config           │
└──────┬──────────┬──────────┬──────────┬──────────┬───────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
  [user-svc] [restaurant] [order-svc] [tracking] [payment]
   :8081       :8082        :8083      :8084      :8085
       │          │          │          │          │
       └──────────┴────┬─────┴──────────┴──────────┘
                       │ Kafka (async events)
                       ▼
              [notification-svc :8086]
               FCM · SMS · Email

  Shared infrastructure:
  PostgreSQL · Redis · MongoDB · Elasticsearch · Kafka
```

### Event flow

```
Order placed → order-service ──kafka──► notification-service (push to customer)
                            └──kafka──► tracking-service (assign driver)
Payment done → payment-service ──kafka──► order-service (confirm order)
Driver GPS  → tracking-service ──ws────► customer app (live map update)
```

---

## 📦 Services

| Service | Port | Database | Responsibility |
|---|---|---|---|
| `api-gateway` | 8080 | — | Routing, auth filter, rate limiting |
| `user-service` | 8081 | PostgreSQL | Registration, login, JWT, OTP |
| `restaurant-service` | 8082 | PostgreSQL + Elasticsearch | Menus, catalog, geo-search |
| `order-service` | 8083 | PostgreSQL | Order CRUD and status machine |
| `tracking-service` | 8084 | Redis + MongoDB | Driver GPS, WebSocket streaming |
| `payment-service` | 8085 | PostgreSQL | Stripe / Razorpay charge & refund |
| `notification-service` | 8086 | — | FCM push, SMS, email dispatch |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 21 (virtual threads enabled) |
| Framework | Spring Boot 3.3.x |
| API Gateway | Spring Cloud Gateway |
| Auth | Spring Security + jjwt 0.12.x |
| ORM | Spring Data JPA + Hibernate 6 |
| Primary DB | PostgreSQL 16 |
| Cache | Redis 7 (Spring Data Redis + Lettuce) |
| NoSQL | MongoDB 7 (Spring Data MongoDB) |
| Search | Elasticsearch 8 |
| Messaging | Apache Kafka 3 (Spring Kafka) |
| Real-time | Spring WebSocket + STOMP |
| Service calls | Spring Cloud OpenFeign |
| Resilience | Resilience4j (circuit breaker, retry) |
| Migrations | Flyway 10 |
| Mapping | MapStruct 1.6 |
| Payments | Stripe Java SDK · Razorpay Java SDK |
| Notifications | Firebase Admin SDK · Twilio Java SDK |
| Maps | Google Maps Services Java client |
| Docs | SpringDoc OpenAPI 2.x (Swagger UI) |
| Testing | JUnit 5 · Mockito · Testcontainers |
| Monitoring | Micrometer · Prometheus · Grafana |
| Tracing | OpenTelemetry + Jaeger |
| CI/CD | GitHub Actions |
| Containers | Docker + Kubernetes (EKS / GKE) |

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|---|---|
| Java | 21+ |
| Maven | 3.9+ |
| Docker & Docker Compose | Latest stable |
| Git | Any |

### 1. Clone the repository

```bash
git clone https://github.com/your-org/food-delivery.git
cd food-delivery
```

### 2. Configure environment variables

Copy the example env file and fill in your secrets:

```bash
cp .env.example .env
```

```env
# JWT
JWT_SECRET=your-256-bit-secret-here
JWT_EXPIRY_MINUTES=15

# PostgreSQL
POSTGRES_USER=foodapp
POSTGRES_PASSWORD=secret
POSTGRES_DB=foodapp

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# MSG91 (OTP)
MSG91_AUTH_KEY=...
MSG91_TEMPLATE_ID=...

# Google Maps
GOOGLE_MAPS_API_KEY=...

# Firebase (base64 encoded service account JSON)
FIREBASE_CREDENTIALS_BASE64=...
```

### 3. Start all infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL, Redis, MongoDB, Kafka, Zookeeper, and Elasticsearch locally.

### 4. Run the services

Run each service in a separate terminal, or use the helper script:

```bash
# Run all services (requires tmux or separate terminals)
./scripts/start-all.sh

# Or run individually
cd user-service && mvn spring-boot:run
cd api-gateway  && mvn spring-boot:run
cd order-service && mvn spring-boot:run
# ... etc
```

### 5. Verify everything is up

```bash
curl http://localhost:8080/actuator/health
# {"status":"UP"}

# Access Swagger UI for any service
open http://localhost:8081/swagger-ui.html   # user-service
open http://localhost:8082/swagger-ui.html   # restaurant-service
open http://localhost:8083/swagger-ui.html   # order-service
```

---

## 📁 Project Structure

```
food-delivery/
├── api-gateway/                  # Spring Cloud Gateway
├── user-service/                 # Auth, registration, profiles
├── restaurant-service/           # Restaurant & menu management
├── order-service/                # Order lifecycle
├── tracking-service/             # Driver GPS & WebSocket
├── payment-service/              # Payments & refunds
├── notification-service/         # Push, SMS, email
├── common/                       # Shared DTOs, events, exceptions
│   └── src/main/java/
│       ├── dto/
│       ├── event/                # Kafka event records
│       └── exception/
├── docker-compose.yml
├── k8s/
│   ├── deployments/
│   ├── services/
│   └── configmaps/
├── scripts/
│   ├── start-all.sh
│   └── seed-data.sh
└── .github/
    └── workflows/
        ├── ci.yml
        └── deploy.yml
```

Each service follows the same internal layout:

```
order-service/
└── src/main/java/com/foodapp/order/
    ├── config/        # Spring config classes
    ├── controller/    # REST endpoints
    ├── service/       # Business logic
    ├── repository/    # JPA / Redis / Mongo repos
    ├── domain/        # JPA entities
    ├── dto/           # Request & response objects
    ├── event/         # Kafka producers & consumers
    ├── exception/     # Custom exceptions + global handler
    └── mapper/        # MapStruct mappers
```

---

## 📡 API Documentation

All services expose Swagger UI via SpringDoc OpenAPI when running locally.

### Key endpoints

#### Auth (`user-service`)

```
POST   /api/v1/auth/register          Register a new user
POST   /api/v1/auth/login             Login, returns JWT + refresh token
POST   /api/v1/auth/refresh           Refresh access token
POST   /api/v1/auth/otp/send          Send OTP to phone
POST   /api/v1/auth/otp/verify        Verify OTP
GET    /api/v1/users/me               Current user profile
PUT    /api/v1/users/me               Update profile
```

#### Restaurants (`restaurant-service`)

```
GET    /api/v1/restaurants            List restaurants (geo-filtered, paginated)
GET    /api/v1/restaurants/search     Full-text search with location bias
GET    /api/v1/restaurants/{id}       Restaurant detail + menu
POST   /api/v1/restaurants            Create restaurant  [OWNER]
PUT    /api/v1/restaurants/{id}       Update restaurant  [OWNER]
POST   /api/v1/restaurants/{id}/menu  Add menu item      [OWNER]
PUT    /api/v1/menu-items/{id}        Update menu item   [OWNER]
```

#### Orders (`order-service`)

```
POST   /api/v1/orders                 Place an order
GET    /api/v1/orders/{id}            Order detail
GET    /api/v1/orders/me              Order history
PUT    /api/v1/orders/{id}/confirm    Restaurant confirms   [OWNER]
PUT    /api/v1/orders/{id}/ready      Mark ready for pickup [OWNER]
PUT    /api/v1/orders/{id}/pickup     Driver picks up       [DRIVER]
PUT    /api/v1/orders/{id}/deliver    Mark delivered        [DRIVER]
PUT    /api/v1/orders/{id}/cancel     Cancel order
```

#### Tracking (`tracking-service`)

```
GET    /api/v1/tracking/{orderId}           Current driver location
GET    /api/v1/tracking/{orderId}/history   Full trip path
WS     /ws/tracking                         STOMP WebSocket endpoint
```

#### Payments (`payment-service`)

```
POST   /api/v1/payments/charge              Initiate payment
POST   /api/v1/payments/refund/{orderId}    Full refund
GET    /api/v1/payments/order/{orderId}     Payment status
POST   /webhooks/stripe                     Stripe webhook
POST   /webhooks/razorpay                   Razorpay webhook
```

### Example — place an order

```bash
# 1. Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'

# Response
# { "accessToken": "eyJ...", "refreshToken": "..." }

# 2. Place order
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "uuid-here",
    "items": [{ "menuItemId": "uuid", "quantity": 2 }],
    "deliveryAddress": "123 Main St, Mumbai",
    "deliveryLat": 19.0760,
    "deliveryLon": 72.8777,
    "paymentMethod": "UPI"
  }'
```

### WebSocket — subscribe to live tracking

```javascript
import { Client } from '@stomp/stompjs';

const client = new Client({
  brokerURL: 'ws://localhost:8084/ws/tracking',
  connectHeaders: { Authorization: 'Bearer eyJ...' },
  onConnect: () => {
    client.subscribe(`/topic/order/${orderId}/location`, (msg) => {
      const { lat, lon } = JSON.parse(msg.body);
      console.log('Driver is at:', lat, lon);
    });
  }
});
client.activate();
```

---

## 🗄️ Database Design

### PostgreSQL — core tables

```sql
users          id · email · phone · password_hash · role · is_verified
restaurants    id · owner_id · name · latitude · longitude · is_open · rating
menu_items     id · restaurant_id · name · price · category · is_available
orders         id · customer_id · restaurant_id · driver_id · status · total
order_items    id · order_id · menu_item_id · quantity · price
payments       id · order_id · amount · status · method · gateway_payment_id
```

### Redis — key patterns

| Key | Purpose | TTL |
|---|---|---|
| `driver:location:{driverId}` | Current GPS position | 30 s |
| `otp:{phone}` | One-time password | 5 min |
| `cart:{userId}` | Shopping cart | 24 hrs |
| `menu:{restaurantId}` | Cached menu | 10 min |
| `session:{userId}` | Refresh token | 7 days |

### MongoDB — collections

```
trip_points    driverId · orderId · GeoJSON Point · timestamp
```

---

## 📨 Kafka Topics

| Topic | Producer | Consumers | Purpose |
|---|---|---|---|
| `order-events` | order-service | notification-service, tracking-service | All order status changes |
| `payment-events` | payment-service | order-service | Payment success / failure |
| `driver-assigned` | order-service | tracking-service, notification-service | Driver matched to order |
| `restaurant-events` | restaurant-service | notification-service | Order accepted / rejected |

---

## 🔒 Security

- **JWT access tokens** expire in 15 minutes; refresh tokens in 7 days stored in Redis
- **Passwords** hashed with BCrypt (strength 12)
- **OTP** generated server-side, stored in Redis with 5-minute TTL, never logged
- **Role-based access** enforced at gateway and at each service independently
- **HTTPS enforced** in production via TLS termination at load balancer
- **Secrets** injected via Kubernetes Secrets / AWS Secrets Manager — never in source code
- **Stripe webhook** verified using `Stripe-Signature` header before processing
- **Rate limiting** at gateway: 10 req/min (anonymous), 100 req/min (authenticated)

---

## 🧪 Testing

```bash
# Run unit tests for all modules
mvn test

# Run integration tests (requires Docker — uses Testcontainers)
mvn verify

# Run tests for a specific service
cd order-service && mvn test

# Run with coverage report
mvn verify jacoco:report
open order-service/target/site/jacoco/index.html
```

Test coverage targets:

| Layer | Target |
|---|---|
| Service / business logic | ≥ 80% |
| Repository (integration) | ≥ 70% |
| Controller (integration) | ≥ 70% |
| Kafka consumers | ≥ 70% |

---

## 🐳 Deployment

### Docker Compose (local / staging)

```bash
# Start all infrastructure
docker-compose up -d

# Build and start all application services
docker-compose -f docker-compose.yml -f docker-compose.app.yml up -d

# Tail logs
docker-compose logs -f order-service
```

### Kubernetes (production)

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check rollout status
kubectl rollout status deployment/order-service

# Scale a service
kubectl scale deployment/tracking-service --replicas=5

# Rolling update after new image is pushed
kubectl set image deployment/order-service \
  order-service=foodapp/order-service:v1.2.0
```

Recommended cloud: **AWS EKS** (Mumbai region `ap-south-1`) for India-first deployments.

### CI/CD — GitHub Actions

Every push to `main`:

1. Runs `mvn clean verify` (unit + integration tests)
2. Builds Docker image and pushes to ECR
3. Applies rolling update to EKS

Every pull request:

1. Runs tests
2. Posts code coverage report as a PR comment

---

## 📊 Monitoring

| Tool | URL (local) | Purpose |
|---|---|---|
| Spring Actuator | `http://localhost:{port}/actuator` | Health, metrics, env |
| Prometheus | `http://localhost:9090` | Metrics scraping |
| Grafana | `http://localhost:3000` | Dashboards |
| Jaeger | `http://localhost:16686` | Distributed traces |
| Kafka UI | `http://localhost:8090` | Topic & consumer group browser |

Key dashboards pre-configured in `grafana/dashboards/`:

- **Order funnel** — placement rate, confirmation rate, cancellation rate
- **Service latency** — p50 / p95 / p99 per endpoint
- **JVM metrics** — heap, GC, thread count per service
- **Kafka lag** — consumer group lag per topic

---

## 🗺️ Development Roadmap

### Phase 1 — Foundation ✅

- [x] Monorepo setup, Docker Compose, CI pipeline
- [x] User service: registration, JWT, OTP
- [x] API gateway: routing, JWT filter, rate limiting

### Phase 2 — Core services 🔄

- [ ] Restaurant service with Elasticsearch geo-search
- [ ] Order service with full state machine
- [ ] Payment service (Razorpay + Stripe)
- [ ] Notification service (FCM + MSG91)

### Phase 3 — Real-time 📍

- [ ] WebSocket driver tracking
- [ ] Driver assignment algorithm (nearest available)
- [ ] Google Maps ETA integration

### Phase 4 — Production ☁️

- [ ] Kubernetes manifests + Helm charts
- [ ] Grafana dashboards + alerting rules
- [ ] Load testing (Gatling — target 500 concurrent users)
- [ ] OWASP dependency vulnerability scan

### Future

- [ ] Driver earnings & payout dashboard
- [ ] Dynamic surge pricing
- [ ] ML-based ETA prediction
- [ ] Multi-restaurant cart

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) spec for commit messages.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 📬 Contact

For questions or collaboration, open a GitHub Issue or reach out at `hello@foodapp.dev`.

---

<div align="center">
Built with ☕ Java and Spring Boot · Designed for production scale
</div>
