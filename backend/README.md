# ShopFlow Backend

Backend Spring Boot 3 de la marketplace `ShopFlow`.

Le projet expose une API REST sécurisée par JWT pour gérer les utilisateurs, les produits, les catégories, le panier, les commandes, les coupons, les avis et les tableaux de bord par rôle.

## Fonctionnalités couvertes

- Authentification JWT avec `access token` et `refresh token`
- Rôles `ADMIN`, `SELLER` et `CUSTOMER`
- Gestion des produits avec pagination, recherche, promotions, top ventes et soft delete
- Gestion des catégories avec structure hiérarchique
- Gestion du panier client avec variantes produit et coupons
- Checkout avec paiement simulé, calcul des taxes et décrémentation du stock
- Gestion des commandes, annulation, remboursement logique et mise à jour de statut
- Gestion des adresses client
- Gestion des avis clients avec modération
- Dashboard admin, vendeur et client
- Documentation Swagger / OpenAPI
- Base H2 en développement et PostgreSQL en production

## Stack technique

- Java `21`
- Spring Boot `3.5.13`
- Spring Web
- Spring Data JPA
- Spring Security
- JWT (`jjwt`)
- MapStruct
- Lombok
- H2
- PostgreSQL
- Maven
- JUnit 5 / Mockito / MockMvc
- JaCoCo

## Architecture du projet

Le projet suit une architecture en couches :

- `controller` : endpoints REST
- `service` : logique métier
- `repository` : accès aux données avec Spring Data JPA
- `entities` : modèle de données JPA
- `dto` : objets d'entrée/sortie de l'API
- `config` : sécurité, exceptions globales et configuration OpenAPI

## Structure principale

```text
src/
  main/
    java/com/shopflow/
      backend/
      config/
      controller/
      dto/
      entities/
      exception/
      mapper/
      repository/
      service/
    resources/
      application.properties
      application-prod.properties
      data.sql
  test/
    java/com/shopflow/
      integration/
      service/
```

## Modèle métier principal

Les entités majeures du backend sont :

- `User`
- `SellerProfile`
- `Product`
- `ProductVariant`
- `Category`
- `Cart`
- `CartItem`
- `CustomerOrder`
- `OrderItem`
- `PromoCode`
- `Review`
- `Address`
- `PasswordResetToken`

Enums utilisés :

- `Role`
- `OrderStatus`
- `PaymentStatus`
- `DiscountType`

## Prérequis

- Java `21`
- Maven `3.9+` ou `mvnw.cmd`

## Configuration

### Développement

Le profil par défaut utilise H2 en mémoire :

- Port API : `8085`
- URL H2 : `jdbc:h2:mem:shopflow_db`
- Console H2 : `/h2-console`

### Production

Le fichier `application-prod.properties` est prévu pour PostgreSQL avec les variables suivantes :

- `SHOPFLOW_DB_URL`
- `SHOPFLOW_DB_USERNAME`
- `SHOPFLOW_DB_PASSWORD`

Exemple de valeur par défaut :

- `jdbc:postgresql://localhost:5432/shopflow`

## Lancement du projet

### En développement

```powershell
./mvnw.cmd spring-boot:run
```

### Avec le profil production

```powershell
./mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=prod
```

Application disponible sur :

- API : `http://localhost:8085`
- Swagger UI : `http://localhost:8085/swagger-ui/index.html`
- H2 Console : `http://localhost:8085/h2-console`

## Comptes de démonstration

Les données sont injectées automatiquement par `data.sql`.

Mot de passe pour tous les comptes :

- `admin123`

Comptes disponibles :

- `admin@shopflow.com`
- `seller@shopflow.com`
- `customer@shopflow.com`

Codes promo de démonstration :

- `WELCOME10`
- `SAVE20`

## Sécurité

- Authentification via JWT
- `access token` pour l'accès aux endpoints protégés
- `refresh token` pour renouveler l'accès
- Autorisation par rôle avec Spring Security et `@PreAuthorize`
- Endpoints publics pour l'authentification, Swagger, H2 et certaines lectures catalogue

## Endpoints principaux

### Authentification

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Catalogue

- `GET /api/products`
- `GET /api/products/search`
- `GET /api/products/top-selling`
- `GET /api/products/promotions`
- `GET /api/products/{id}`
- `POST /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`

### Catégories

- `GET /api/categories`
- `GET /api/categories/tree`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`

### Panier

- `GET /api/cart`
- `POST /api/cart/items`
- `PUT /api/cart/items/{itemId}`
- `POST /api/cart/coupon`
- `DELETE /api/cart/coupon`
- `DELETE /api/cart/items/{itemId}`
- `DELETE /api/cart`

### Commandes

- `POST /api/orders`
- `GET /api/orders/{orderId}`
- `GET /api/orders/my`
- `GET /api/orders/received`
- `GET /api/orders`
- `PUT /api/orders/{orderId}/status`
- `PUT /api/orders/{orderId}/cancel`

## Démonstration Swagger

### Authentification

1. Appeler `POST /api/auth/login`
2. Récupérer le `access_token`
3. Cliquer sur `Authorize` dans Swagger
4. Coller `Bearer <token>`

### Flux client

1. `GET /api/products`
2. `POST /api/cart/items`
3. `GET /api/cart`
4. `POST /api/orders`
5. `GET /api/orders/my`

### Flux vendeur

1. `POST /api/auth/login` avec `seller@shopflow.com`
2. `POST /api/products`
3. `GET /api/orders/received`
4. `PUT /api/orders/{orderId}/status`

### Flux admin

1. `POST /api/auth/login` avec `admin@shopflow.com`
2. `POST /api/categories`
3. `GET /api/users`
4. `PATCH /api/users/{id}/toggle-status`

## Tests

Commandes utiles :

```powershell
./mvnw.cmd clean compile
./mvnw.cmd test
./mvnw.cmd "-Dtest=CartServiceTest,OrderServiceTest,ProductServiceTest,AuthOrderFlowIntegrationTest" test
./mvnw.cmd verify
```

Les tests couvrent :

- tests unitaires des services avec JUnit 5 et Mockito
- test d'intégration MockMvc sur le flux `auth -> panier -> checkout`
- génération d'un rapport JaCoCo à la phase `verify`

## Couverture JaCoCo

Rapports générés :

- `target/site/jacoco/index.html`
- `target/site/jacoco/com.shopflow.service/index.html`

Résultat actuel de la couche `service` :

- couverture instructions : `88%`

Exemples de couverture atteinte :

- `CartServiceImpl` : `92%`
- `OrderServiceImpl` : `93%`
- `ProductServiceImpl` : `79%`

## Qualité du code

- DTOs validés avec `@Valid`
- gestion centralisée des erreurs via `GlobalExceptionHandler`
- séparation claire entre couches REST, service, repository et entités
- documentation OpenAPI disponible via Swagger UI
- Lombok et MapStruct utilisés pour réduire le code répétitif

## Auteur

Mini-projet backend `ShopFlow`.
