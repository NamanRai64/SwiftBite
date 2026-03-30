# Food Delivery App — Spring Boot Implementation Plan

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Tech Stack](#2-tech-stack)
3. [Microservices Overview](#3-microservices-overview)
4. [Service Implementation Plans](#4-service-implementation-plans)
   - [API Gateway](#41-api-gateway-service)
   - [User & Auth Service](#42-user--auth-service)
   - [Restaurant & Menu Service](#43-restaurant--menu-service)
   - [Order Service](#44-order-service)
   - [Tracking Service](#45-tracking-service)
   - [Payment Service](#46-payment-service)
   - [Notification Service](#47-notification-service)
5. [Database Design](#5-database-design)
6. [Third-Party API Integration](#6-third-party-api-integration)
7. [Kafka Event Architecture](#7-kafka-event-architecture)
8. [Real-Time Tracking (WebSocket)](#8-real-time-tracking-websocket)
9. [Security Implementation](#9-security-implementation)
10. [Infrastructure & Deployment](#10-infrastructure--deployment)
11. [Development Phases](#11-development-phases)
12. [Estimated Timeline](#12-estimated-timeline)

---

## 1. Project Structure

Each microservice is a standalone Spring Boot application in a monorepo.

```
food-delivery/
├── api-gateway/                  # Spring Cloud Gateway
├── user-service/                 # Auth, registration, profiles
├── restaurant-service/           # Restaurant & menu management
├── order-service/                # Order lifecycle management
├── tracking-service/             # Driver GPS & WebSocket
├── payment-service/              # Payments & refunds
├── notification-service/         # Push, SMS, email
├── common/                       # Shared DTOs, exceptions, utilities
├── docker-compose.yml            # Local dev orchestration
├── k8s/                          # Kubernetes manifests
│   ├── deployments/
│   ├── services/
│   └── configmaps/
└── .github/
    └── workflows/                # CI/CD pipelines
```

Each service follows this internal structure:

```
order-service/
├── src/main/java/com/foodapp/order/
│   ├── config/           # Spring config classes
│   ├── controller/       # REST controllers
│   ├── service/          # Business logic
│   ├── repository/       # JPA / Redis / Mongo repos
│   ├── domain/           # JPA entities
│   ├── dto/              # Request / response objects
│   ├── event/            # Kafka producers & consumers
│   ├── exception/        # Custom exceptions + handlers
│   └── mapper/           # MapStruct mappers
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/     # Flyway SQL scripts
└── pom.xml
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Language | Java | 21 (LTS) |
| Framework | Spring Boot | 3.3.x |
| Build tool | Maven | 3.9.x |
| API gateway | Spring Cloud Gateway | 2023.x |
| Auth | Spring Security + JWT | jjwt 0.12.x |
| ORM | Spring Data JPA + Hibernate | 6.x |
| Primary DB | PostgreSQL | 16 |
| Cache | Spring Data Redis | Lettuce client |
| NoSQL | Spring Data MongoDB | 4.x |
| Messaging | Spring Kafka | 3.x |
| WebSocket | Spring WebSocket + STOMP | — |
| Service comm | Spring Cloud OpenFeign | 4.x |
| Resilience | Resilience4j | 2.x |
| Search | Elasticsearch Java client | 8.x |
| Migrations | Flyway | 10.x |
| Mapping | MapStruct | 1.6.x |
| Validation | Spring Validation (Hibernate Validator) | — |
| Testing | JUnit 5 + Mockito + Testcontainers | — |
| Docs | SpringDoc OpenAPI (Swagger UI) | 2.x |
| Monitoring | Micrometer + Prometheus + Grafana | — |
| Tracing | OpenTelemetry + Jaeger | — |
| Containerisation | Docker + Kubernetes | — |
| CI/CD | GitHub Actions | — |

> **Java 21 tip:** Enable virtual threads for free concurrency gains on all servlet-based services:
> ```yaml
> spring:
>   threads:
>     virtual:
>       enabled: true
> ```

---

## 3. Microservices Overview

| Service | Port | DB | Key responsibility |
|---|---|---|---|
| api-gateway | 8080 | — | Routing, auth filter, rate limit |
| user-service | 8081 | PostgreSQL | Registration, login, JWT issuance |
| restaurant-service | 8082 | PostgreSQL + Elasticsearch | Menus, restaurant catalog, search |
| order-service | 8083 | PostgreSQL | Order CRUD, status machine |
| tracking-service | 8084 | Redis + MongoDB | Driver GPS, WebSocket push |
| payment-service | 8085 | PostgreSQL | Charge, refund, payout |
| notification-service | 8086 | — | FCM, SMS, email dispatch |

Inter-service communication: **synchronous** via OpenFeign for queries, **asynchronous** via Kafka for events.

---

## 4. Service Implementation Plans

### 4.1 API Gateway Service

**Dependencies:** `spring-cloud-starter-gateway`, `spring-cloud-starter-circuitbreaker-reactor-resilience4j`

**Responsibilities:**
- Route all inbound requests to the correct downstream service
- Validate JWT on every request using a global filter
- Apply per-IP and per-user rate limiting
- Strip internal headers before forwarding

**Key configuration (`application.yml`):**

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/v1/users/**
          filters:
            - AuthFilter
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/v1/orders/**
          filters:
            - AuthFilter
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 20
                redis-rate-limiter.burstCapacity: 40
```

**Custom JWT filter:**

```java
@Component
public class AuthFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = extractToken(exchange.getRequest());
        if (token == null || !jwtUtil.isValid(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
        // Propagate user ID as header to downstream services
        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
            .header("X-User-Id", jwtUtil.getUserId(token))
            .header("X-User-Role", jwtUtil.getRole(token))
            .build();
        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() { return -1; }
}
```

---

### 4.2 User & Auth Service

**Dependencies:** `spring-boot-starter-web`, `spring-boot-starter-security`, `spring-boot-starter-data-jpa`, `jjwt-api`, `postgresql`

**Entities:**

```java
@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String name;
    @Column(unique = true) private String email;
    @Column(unique = true) private String phone;
    private String passwordHash;
    @Enumerated(EnumType.STRING)
    private Role role;  // CUSTOMER, DRIVER, RESTAURANT_OWNER, ADMIN
    private boolean isVerified;
    private LocalDateTime createdAt;
}
```

**REST endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Return JWT + refresh token |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/otp/send` | Send OTP via SMS (MSG91 / Twilio) |
| POST | `/api/v1/auth/otp/verify` | Verify OTP, mark phone verified |
| GET | `/api/v1/users/me` | Get current user profile |
| PUT | `/api/v1/users/me` | Update profile |
| PUT | `/api/v1/users/me/addresses` | Add/update delivery addresses |

**JWT implementation:**

```java
@Component
public class JwtUtil {

    @Value("${jwt.secret}") private String secret;
    @Value("${jwt.expiry-minutes:15}") private long expiryMinutes;

    public String generate(User user) {
        return Jwts.builder()
            .subject(user.getId())
            .claim("role", user.getRole().name())
            .issuedAt(new Date())
            .expiration(Date.from(Instant.now().plusSeconds(expiryMinutes * 60)))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes()))
            .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
            .verifyWith(Keys.hmacShaKeyFor(secret.getBytes()))
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
```

**OTP flow:** Generate a 6-digit OTP → store in Redis with 5-minute TTL → send via MSG91 → verify on login.

---

### 4.3 Restaurant & Menu Service

**Dependencies:** `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-data-elasticsearch`, `spring-boot-starter-cache`, `spring-boot-starter-data-redis`

**Entities:**

```java
@Entity
@Table(name = "restaurants")
public class Restaurant {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String name;
    private String ownerId;          // FK to user-service (logical)
    private String description;
    private String imageUrl;
    private Double latitude;
    private Double longitude;
    private String address;
    private boolean isOpen;
    private Integer avgPrepTimeMinutes;
    private Double rating;
    @Enumerated(EnumType.STRING)
    private CuisineType cuisineType;
}

@Entity
@Table(name = "menu_items")
public class MenuItem {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String restaurantId;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private boolean isAvailable;
    @Enumerated(EnumType.STRING)
    private FoodCategory category;  // STARTER, MAIN, DESSERT, DRINK
}
```

**REST endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/restaurants` | List restaurants (paginated, geo-filtered) |
| GET | `/api/v1/restaurants/search` | Full-text search via Elasticsearch |
| GET | `/api/v1/restaurants/{id}` | Restaurant detail + menu |
| POST | `/api/v1/restaurants` | Create restaurant (OWNER role) |
| PUT | `/api/v1/restaurants/{id}` | Update restaurant details |
| PUT | `/api/v1/restaurants/{id}/toggle` | Open/close restaurant |
| GET | `/api/v1/restaurants/{id}/menu` | Full menu |
| POST | `/api/v1/restaurants/{id}/menu` | Add menu item |
| PUT | `/api/v1/menu-items/{id}` | Update menu item |
| DELETE | `/api/v1/menu-items/{id}` | Remove menu item |

**Geo-search query:**

```java
// Find restaurants within radius using Elasticsearch geo_distance query
public List<RestaurantDoc> searchNearby(double lat, double lon, double radiusKm, String query) {
    Query geoQuery = NativeQuery.builder()
        .withQuery(q -> q
            .bool(b -> b
                .must(m -> m.multiMatch(mm -> mm.query(query).fields("name", "cuisineType")))
                .filter(f -> f.geoDistance(g -> g
                    .field("location")
                    .distance(radiusKm + "km")
                    .location(gl -> gl.latlon(ll -> ll.lat(lat).lon(lon)))
                ))
            )
        )
        .build();
    return elasticsearchOperations.search(geoQuery, RestaurantDoc.class)
        .map(SearchHit::getContent)
        .toList();
}
```

**Caching strategy:** Cache individual menu items in Redis with a 10-minute TTL. Evict on update.

```java
@Cacheable(value = "menu", key = "#restaurantId")
public List<MenuItemDto> getMenu(String restaurantId) { ... }

@CacheEvict(value = "menu", key = "#restaurantId")
public void updateMenuItem(String restaurantId, UpdateMenuItemRequest req) { ... }
```

---

### 4.4 Order Service

**Dependencies:** `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-kafka`, `spring-cloud-openfeign`, `resilience4j-spring-boot3`

**Order state machine:**

```
PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP → PICKED_UP → DELIVERED
                                                                ↘ CANCELLED
```

**Entity:**

```java
@Entity
@Table(name = "orders")
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String customerId;
    private String restaurantId;
    private String driverId;
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    @OneToMany(cascade = CascadeType.ALL)
    private List<OrderItem> items;
    private BigDecimal subtotal;
    private BigDecimal deliveryFee;
    private BigDecimal total;
    private String deliveryAddress;
    private Double deliveryLat;
    private Double deliveryLon;
    private LocalDateTime placedAt;
    private LocalDateTime estimatedDeliveryTime;
}
```

**REST endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/orders` | Place new order |
| GET | `/api/v1/orders/{id}` | Get order detail |
| GET | `/api/v1/orders/me` | Customer's order history |
| PUT | `/api/v1/orders/{id}/confirm` | Restaurant confirms (OWNER role) |
| PUT | `/api/v1/orders/{id}/ready` | Mark ready for pickup |
| PUT | `/api/v1/orders/{id}/pickup` | Driver picks up |
| PUT | `/api/v1/orders/{id}/deliver` | Mark delivered |
| PUT | `/api/v1/orders/{id}/cancel` | Cancel order |

**Kafka event publishing on each status change:**

```java
@Service
public class OrderService {

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public void updateStatus(String orderId, OrderStatus newStatus) {
        Order order = findOrThrow(orderId);
        order.setStatus(newStatus);
        orderRepository.save(order);

        kafkaTemplate.send("order-events", order.getId(),
            new OrderEvent(order.getId(), order.getCustomerId(),
                           order.getRestaurantId(), order.getDriverId(), newStatus));
    }
}
```

**Resilient Feign client to payment service:**

```java
@FeignClient(name = "payment-service", fallbackFactory = PaymentFallbackFactory.class)
public interface PaymentClient {
    @PostMapping("/api/v1/payments/charge")
    PaymentResponse charge(@RequestBody ChargeRequest request);
}

@Component
public class PaymentFallbackFactory implements FallbackFactory<PaymentClient> {
    @Override
    public PaymentClient create(Throwable cause) {
        return request -> {
            log.error("Payment service unreachable: {}", cause.getMessage());
            throw new PaymentUnavailableException("Payment service is temporarily unavailable");
        };
    }
}
```

---

### 4.5 Tracking Service

**Dependencies:** `spring-boot-starter-websocket`, `spring-boot-starter-data-redis`, `spring-boot-starter-data-mongodb`, `spring-kafka`

> This is the most I/O-intensive service. Use **Spring WebFlux** or enable **virtual threads** (Java 21).

**WebSocket configuration:**

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");     // Customer subscribes here
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/tracking")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
```

**Driver location update flow:**

```java
// Driver app sends GPS ping every 5 seconds
@MessageMapping("/driver/location")
public void updateLocation(LocationUpdate update, Principal principal) {
    String driverId = principal.getName();

    // 1. Write to Redis (fast read, expires in 30s)
    redisTemplate.opsForValue().set(
        "driver:location:" + driverId,
        update,
        30, TimeUnit.SECONDS
    );

    // 2. Push to customer tracking WebSocket topic
    String orderId = locationUpdate.getOrderId();
    simpMessagingTemplate.convertAndSend(
        "/topic/order/" + orderId + "/location", update
    );

    // 3. Persist to MongoDB for trip history
    tripHistoryRepository.save(new TripPoint(driverId, orderId,
        update.getLat(), update.getLon(), Instant.now()));
}
```

**MongoDB document for trip history:**

```java
@Document(collection = "trip_points")
public class TripPoint {
    @Id private String id;
    private String driverId;
    private String orderId;
    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint location;
    private Instant timestamp;
}
```

**REST endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/tracking/{orderId}` | Current driver location |
| GET | `/api/v1/tracking/{orderId}/history` | Full trip path |
| GET | `/api/v1/drivers/available` | Available drivers near a point |

---

### 4.6 Payment Service

**Dependencies:** `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-retry`, `stripe-java` / `razorpay-java`

**Entity:**

```java
@Entity
@Table(name = "payments")
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String orderId;
    private String customerId;
    private BigDecimal amount;
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;   // PENDING, SUCCESS, FAILED, REFUNDED
    @Enumerated(EnumType.STRING)
    private PaymentMethod method;   // CARD, UPI, NETBANKING, WALLET, COD
    private String gatewayPaymentId;
    private String gatewayResponse;
    private LocalDateTime processedAt;
}
```

**Stripe integration:**

```java
@Service
public class StripePaymentService {

    public PaymentResponse charge(ChargeRequest request) {
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(request.getAmountInPaise())   // smallest currency unit
                .setCurrency("inr")
                .setPaymentMethod(request.getPaymentMethodId())
                .setConfirm(true)
                .build();

            PaymentIntent intent = PaymentIntent.create(params);
            return new PaymentResponse(intent.getId(), intent.getStatus());

        } catch (StripeException e) {
            throw new PaymentFailedException("Stripe charge failed: " + e.getMessage());
        }
    }

    public void refund(String gatewayPaymentId) {
        RefundCreateParams params = RefundCreateParams.builder()
            .setPaymentIntent(gatewayPaymentId)
            .build();
        Refund.create(params);
    }
}
```

**Webhook handler for async payment confirmation:**

```java
@PostMapping("/webhooks/stripe")
public ResponseEntity<Void> handleStripeWebhook(
        @RequestBody String payload,
        @RequestHeader("Stripe-Signature") String sigHeader) {
    Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
    if ("payment_intent.succeeded".equals(event.getType())) {
        // Update payment status and publish Kafka event
    }
    return ResponseEntity.ok().build();
}
```

**REST endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/payments/charge` | Initiate payment |
| POST | `/api/v1/payments/refund/{orderId}` | Full refund |
| GET | `/api/v1/payments/order/{orderId}` | Payment status |
| POST | `/webhooks/stripe` | Stripe webhook receiver |
| POST | `/webhooks/razorpay` | Razorpay webhook receiver |

---

### 4.7 Notification Service

**Dependencies:** `spring-boot-starter-web`, `spring-kafka`, `firebase-admin`, `twilio-java`, `spring-boot-starter-mail`

**Kafka consumer — reacts to all order events:**

```java
@Service
public class NotificationConsumer {

    @KafkaListener(topics = "order-events", groupId = "notification-service")
    public void handleOrderEvent(OrderEvent event) {
        switch (event.getStatus()) {
            case CONFIRMED    -> sendPush(event.getCustomerId(), "Order confirmed!",
                                          "Your order is being prepared.");
            case PICKED_UP    -> sendPush(event.getCustomerId(), "Order picked up",
                                          "Your delivery is on the way.");
            case DELIVERED    -> sendPush(event.getCustomerId(), "Delivered!",
                                          "Enjoy your meal. Rate your experience.");
            case CANCELLED    -> {
                sendPush(event.getCustomerId(), "Order cancelled", "Your order was cancelled.");
                sendSms(event.getCustomerId(), "Your food delivery order has been cancelled.");
            }
        }
    }
}
```

**FCM push notification:**

```java
@Service
public class FirebaseNotificationService {

    public void send(String deviceToken, String title, String body) {
        Message message = Message.builder()
            .setToken(deviceToken)
            .setNotification(Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build())
            .build();
        FirebaseMessaging.getInstance().send(message);
    }
}
```

---

## 5. Database Design

### PostgreSQL — key tables

```sql
-- users
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    phone       VARCHAR(15) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role        VARCHAR(30) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- restaurants
CREATE TABLE restaurants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(150) NOT NULL,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    is_open         BOOLEAN DEFAULT FALSE,
    rating          NUMERIC(2,1),
    avg_prep_time   INT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- orders
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID NOT NULL,
    restaurant_id   UUID NOT NULL,
    driver_id       UUID,
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    subtotal        NUMERIC(10,2),
    delivery_fee    NUMERIC(10,2),
    total           NUMERIC(10,2),
    delivery_address TEXT,
    delivery_lat    DOUBLE PRECISION,
    delivery_lon    DOUBLE PRECISION,
    placed_at       TIMESTAMP DEFAULT NOW(),
    estimated_eta   TIMESTAMP
);

-- order_items
CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id),
    menu_item_id    UUID NOT NULL,
    name            VARCHAR(150),
    price           NUMERIC(10,2),
    quantity        INT NOT NULL
);

-- payments
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders(id),
    customer_id         UUID NOT NULL,
    amount              NUMERIC(10,2),
    status              VARCHAR(30),
    method              VARCHAR(30),
    gateway_payment_id  VARCHAR(200),
    processed_at        TIMESTAMP
);
```

### Redis — key patterns

| Key pattern | Value | TTL |
|---|---|---|
| `driver:location:{driverId}` | JSON (lat, lon, heading) | 30s |
| `session:{userId}` | JWT refresh token | 7 days |
| `otp:{phone}` | 6-digit OTP string | 5 min |
| `cart:{userId}` | JSON cart object | 24 hrs |
| `menu:{restaurantId}` | Serialized menu list | 10 min |
| `rate_limit:{ip}` | Request count | 1 min |

### MongoDB — collections

```javascript
// trip_points — one document per GPS ping
{
  _id: ObjectId,
  driverId: "uuid",
  orderId: "uuid",
  location: { type: "Point", coordinates: [72.8777, 19.0760] },
  timestamp: ISODate("2025-01-01T10:00:00Z")
}

// 2dsphere index for geo queries
db.trip_points.createIndex({ location: "2dsphere" });
```

---

## 6. Third-Party API Integration

### Google Maps (routing & ETA)

```java
@Service
public class MapsService {

    private final GeoApiContext geoApiContext;

    public DirectionsResult getRoute(LatLng origin, LatLng destination) throws Exception {
        return DirectionsApi.newRequest(geoApiContext)
            .origin(origin)
            .destination(destination)
            .mode(TravelMode.DRIVING)
            .await();
    }

    public long getEtaSeconds(LatLng origin, LatLng destination) throws Exception {
        DirectionsResult result = getRoute(origin, destination);
        return result.routes[0].legs[0].duration.inSeconds;
    }
}
```

### Razorpay (recommended for India — UPI support)

```java
@Service
public class RazorpayPaymentService {

    private final RazorpayClient razorpay;

    public String createOrder(BigDecimal amount, String receiptId) throws RazorpayException {
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue());
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", receiptId);
        orderRequest.put("payment_capture", 1);
        Order order = razorpay.orders.create(orderRequest);
        return order.get("id");
    }
}
```

### MSG91 (OTP — India)

```java
@Service
public class SmsService {

    @Value("${msg91.auth-key}") private String authKey;
    @Value("${msg91.template-id}") private String templateId;

    public void sendOtp(String phone, String otp) {
        // MSG91 Send OTP API
        String url = "https://api.msg91.com/api/v5/otp?template_id=" + templateId
                   + "&mobile=" + phone + "&authkey=" + authKey + "&otp=" + otp;
        restTemplate.postForEntity(url, null, String.class);
    }
}
```

---

## 7. Kafka Event Architecture

### Topics

| Topic | Producer | Consumer(s) | Purpose |
|---|---|---|---|
| `order-events` | order-service | notification-service, tracking-service | All order status changes |
| `payment-events` | payment-service | order-service | Payment success/failure |
| `driver-assigned` | order-service | tracking-service, notification-service | Driver matched to order |
| `restaurant-events` | restaurant-service | notification-service | Order accepted/rejected |

### Event schema (common module)

```java
public record OrderEvent(
    String orderId,
    String customerId,
    String restaurantId,
    String driverId,
    OrderStatus status,
    Instant timestamp
) {}
```

### Kafka configuration

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all          # Strongest durability guarantee
      retries: 3
    consumer:
      group-id: ${spring.application.name}
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
```

---

## 8. Real-Time Tracking (WebSocket)

**Customer app connects via STOMP over SockJS:**

```javascript
// Frontend (React Native)
const client = new Client({
  brokerURL: 'ws://api.foodapp.com/ws/tracking',
  onConnect: () => {
    client.subscribe(`/topic/order/${orderId}/location`, (message) => {
      const location = JSON.parse(message.body);
      updateMapMarker(location.lat, location.lon);
    });
  }
});
client.activate();
```

**Driver sends location every 5 seconds:**

```javascript
// Driver app — publishes to server
setInterval(() => {
  client.publish({
    destination: '/app/driver/location',
    body: JSON.stringify({ orderId, lat, lon, heading, speed })
  });
}, 5000);
```

**Message flow:**

```
Driver app → WebSocket → Tracking Service
                              ↓ Redis (current position, 30s TTL)
                              ↓ MongoDB (trip history)
                              ↓ STOMP broker → Customer app
```

---

## 9. Security Implementation

### JWT token strategy

| Token | Expiry | Storage |
|---|---|---|
| Access token | 15 minutes | In-memory (mobile) |
| Refresh token | 7 days | Redis + HttpOnly cookie |

### Spring Security config per service

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/restaurants").hasRole("RESTAURANT_OWNER")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

### Rate limiting (at gateway)

- Anonymous users: 10 requests/minute
- Authenticated users: 100 requests/minute
- Restaurant owners: 200 requests/minute
- Payment endpoints: 5 requests/minute per user

---

## 10. Infrastructure & Deployment

### Docker Compose (local development)

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: foodapp
      POSTGRES_USER: foodapp
      POSTGRES_PASSWORD: secret
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  mongodb:
    image: mongo:7
    ports: ["27017:27017"]

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
    ports: ["9092:9092"]

  elasticsearch:
    image: elasticsearch:8.13.0
    environment:
      discovery.type: single-node
      xpack.security.enabled: "false"
    ports: ["9200:9200"]
```

### Kubernetes deployment (per service)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
        - name: order-service
          image: foodapp/order-service:latest
          ports:
            - containerPort: 8083
          env:
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8083
            initialDelaySeconds: 20
```

### CI/CD pipeline (GitHub Actions)

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      - run: mvn clean verify       # Runs unit + integration tests
      - run: docker build -t foodapp/order-service:${{ github.sha }} .
      - run: docker push foodapp/order-service:${{ github.sha }}
      - run: kubectl set image deployment/order-service order-service=foodapp/order-service:${{ github.sha }}
```

### Monitoring stack

| Tool | Purpose |
|---|---|
| Spring Actuator | Health, metrics, info endpoints |
| Micrometer | Metrics collection (JVM, HTTP, DB, Kafka) |
| Prometheus | Scrapes metrics from all services |
| Grafana | Dashboards (order rate, latency, error rate) |
| OpenTelemetry + Jaeger | Distributed tracing across services |
| ELK Stack | Centralised log aggregation |

---

## 11. Development Phases

### Phase 1 — Foundation (Weeks 1–3)

- [ ] Set up monorepo with Maven multi-module
- [ ] Scaffold all 7 Spring Boot services with health endpoints
- [ ] Configure Docker Compose for all infrastructure
- [ ] Implement user-service: registration, login, JWT, OTP
- [ ] Implement API gateway with JWT filter and routing
- [ ] Set up Flyway migrations for PostgreSQL
- [ ] Write integration tests using Testcontainers

### Phase 2 — Core services (Weeks 4–7)

- [ ] Restaurant service: CRUD, menu management, image upload to S3
- [ ] Elasticsearch integration for restaurant search with geo-filtering
- [ ] Order service: placement, status machine, Feign client to payment
- [ ] Payment service: Razorpay / Stripe integration, webhook handlers
- [ ] Kafka event bus: order-events, payment-events topics
- [ ] Notification service: FCM push, MSG91 SMS consumers

### Phase 3 — Real-time & advanced features (Weeks 8–10)

- [ ] Tracking service: WebSocket + STOMP server
- [ ] Driver location streaming: Redis + MongoDB persistence
- [ ] Driver assignment algorithm (nearest available driver)
- [ ] Google Maps ETA integration
- [ ] Admin service: user management, analytics endpoints

### Phase 4 — Production readiness (Weeks 11–12)

- [ ] Kubernetes manifests for all services
- [ ] GitHub Actions CI/CD pipeline
- [ ] Prometheus + Grafana dashboards
- [ ] Distributed tracing with Jaeger
- [ ] Load testing with Gatling (target: 500 concurrent users)
- [ ] Security audit: OWASP dependency check, pen testing basics
- [ ] API documentation with SpringDoc OpenAPI

---

## 12. Estimated Timeline

| Phase | Duration | Deliverable |
|---|---|---|
| Phase 1 — Foundation | 3 weeks | Auth, gateway, infra running locally |
| Phase 2 — Core services | 4 weeks | End-to-end order placement + payment |
| Phase 3 — Real-time | 3 weeks | Live driver tracking on customer app |
| Phase 4 — Production | 2 weeks | Deployed to AWS EKS, monitored |
| **Total** | **12 weeks** | **Production-ready MVP** |

---

## Quick Start

```bash
# Clone repo and start all infrastructure
git clone https://github.com/your-org/food-delivery
cd food-delivery
docker-compose up -d

# Run a specific service
cd order-service
mvn spring-boot:run

# Run all tests
mvn clean verify

# Build all services
mvn clean package -DskipTests

# Build Docker image for a service
cd order-service
docker build -t foodapp/order-service:latest .
```

---

*Generated implementation plan for a Spring Boot 3.x microservices food delivery platform.*
*Java 21 · Spring Cloud 2023.x · PostgreSQL · Redis · MongoDB · Kafka · Elasticsearch*
