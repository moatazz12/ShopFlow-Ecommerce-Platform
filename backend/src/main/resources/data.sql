-- Insertion des categories
INSERT INTO category (nom, description) VALUES ('ELECTRONIQUE', 'High-Tech, Informatique et Gadgets');
INSERT INTO category (nom, description) VALUES ('MODE', 'Vêtements, Chaussures et Accessoires');
INSERT INTO category (nom, description) VALUES ('MAISON', 'Mobilier, Décoration et Électroménager');
INSERT INTO category (nom, description) VALUES ('SPORT', 'Articles et équipements de sport');

-- Insertion des utilisateurs (Mot de passe: admin123)
-- Hash BCrypt pour 'admin123'
INSERT INTO users (actif, date_creation, email, nom, prenom, role, password) 
VALUES (true, CURRENT_TIMESTAMP, 'admin@shopflow.com', 'TRIKI', 'Moataz', 'ADMIN', '$2a$10$RIsw1ID/RLoMFtAmGH4h0u3DrzZOJ8RD30TyP37mfm9WUUZviGKsy');

INSERT INTO users (actif, date_creation, email, nom, prenom, role, password, shop_name, shop_description) 
VALUES (true, CURRENT_TIMESTAMP, 'seller@shopflow.com', 'Seller', 'Demo', 'SELLER', '$2a$10$RIsw1ID/RLoMFtAmGH4h0u3DrzZOJ8RD30TyP37mfm9WUUZviGKsy', 'SuperStore', 'La boutique qui a tout ce dont vous avez besoin');

INSERT INTO users (actif, date_creation, email, nom, prenom, role, password) 
VALUES (true, CURRENT_TIMESTAMP, 'customer@shopflow.com', 'Client', 'Demo', 'CUSTOMER', '$2a$10$RIsw1ID/RLoMFtAmGH4h0u3DrzZOJ8RD30TyP37mfm9WUUZviGKsy');

-- ==========================================
-- PRODUITS ELECTRONIQUES
-- ==========================================
INSERT INTO product (actif, date_creation, description, nom, prix, prix_promo, stock, seller_id) 
SELECT true, CURRENT_TIMESTAMP, 'Le dernier smartphone avec écran OLED 120Hz et puce A17 Pro.', 'iPhone 15 Pro Max', 1200.0, 1099.0, 10, id 
FROM users WHERE email = 'seller@shopflow.com';

INSERT INTO product (actif, date_creation, description, nom, prix, prix_promo, stock, seller_id) 
SELECT true, CURRENT_TIMESTAMP, 'Casque Bluetooth sans fil avec la meilleure réduction de bruit du marché.', 'Sony WH-1000XM5', 380.0, 329.0, 15, id 
FROM users WHERE email = 'seller@shopflow.com';

INSERT INTO product (actif, date_creation, description, nom, prix, stock, seller_id) 
SELECT true, CURRENT_TIMESTAMP, 'Clavier gaming mécanique pour des performances ultimes.', 'Razer BlackWidow', 149.0, 20, id 
FROM users WHERE email = 'seller@shopflow.com';

INSERT INTO product (actif, date_creation, description, nom, prix, stock, seller_id) 
SELECT true, CURRENT_TIMESTAMP, 'Ordinateur portable ultra fin avec la puce M2, parfait pour la productivité.', 'MacBook Air M2', 1199.0, 8, id 
FROM users WHERE email = 'seller@shopflow.com';

INSERT INTO product (actif, date_creation, description, nom, prix, prix_promo, stock, seller_id) 
SELECT true, CURRENT_TIMESTAMP, 'Montre connectée avec suivi de fréquence cardiaque et GPS.', 'Apple Watch Series 9', 450.0, 399.0, 25, id 
FROM users WHERE email = 'seller@shopflow.com';

-- ==========================================
-- PRODUITS DE MODE
-- ==========================================
INSERT INTO product (actif, date_creation, description, nom, prix, stock, seller_id) 
SELECT true, CURRENT_TIMESTAMP, 'Baskets iconiques rouges pour un style urbain incontournable.', 'Nike Air Max', 160.0, 30, id 
FROM users WHERE email = 'seller@shopflow.com';

INSERT INTO product (actif, date_creation, description, nom, prix, prix_promo, stock, seller_id) 
SELECT true, CURRENT_TIMESTAMP, 'T-shirt basique en coton 100% biologique, coupe décontractée.', 'T-shirt Coton Bio', 25.0, 15.0, 100, id 
FROM users WHERE email = 'seller@shopflow.com';

INSERT INTO product (actif, date_creation, description, nom, prix, stock, seller_id) 
SELECT true, CURRENT_TIMESTAMP, 'Veste en véritable cuir noir avec style motard vintage.', 'Veste en Cuir Vintage', 250.0, 5, id 
FROM users WHERE email = 'seller@shopflow.com';

-- ==========================================
-- PRODUITS DE MAISON
-- ==========================================
INSERT INTO product (actif, date_creation, description, nom, prix, prix_promo, stock, seller_id) 
SELECT true, CURRENT_TIMESTAMP, 'Canapé d''angle confortable avec design scandinave élégant pour votre salon.', 'Canapé Scandinave', 899.0, 750.0, 4, id 
FROM users WHERE email = 'seller@shopflow.com';

INSERT INTO product (actif, date_creation, description, nom, prix, stock, seller_id) 
SELECT true, CURRENT_TIMESTAMP, 'Machine à espresso automatique avec broyeur à grains intégré.', 'Machine à café Espresso', 350.0, 12, id 
FROM users WHERE email = 'seller@shopflow.com';

INSERT INTO product (actif, date_creation, description, nom, prix, prix_promo, stock, seller_id) 
SELECT true, CURRENT_TIMESTAMP, 'Lampe de bureau ergonomique avec plusieurs intensités de lumière.', 'Lampe de Bureau LED', 45.0, 35.0, 40, id 
FROM users WHERE email = 'seller@shopflow.com';

-- ==========================================
-- PRODUITS DE SPORT
-- ==========================================
INSERT INTO product (actif, date_creation, description, nom, prix, stock, seller_id) 
SELECT true, CURRENT_TIMESTAMP, 'Tapis antidérapant avec lignes d''alignement, idéal pour le yoga et le Pilates.', 'Tapis de Yoga Pro', 39.0, 60, id 
FROM users WHERE email = 'seller@shopflow.com';

INSERT INTO product (actif, date_creation, description, nom, prix, stock, seller_id) 
SELECT true, CURRENT_TIMESTAMP, 'Paire d''haltères hexagonaux 10kg avec revêtement en caoutchouc.', 'Haltères 10kg', 65.0, 20, id 
FROM users WHERE email = 'seller@shopflow.com';


-- ==========================================
-- IMAGES DES PRODUITS (Via Unsplash)
-- ==========================================

-- Info
INSERT INTO product_images (product_id, images) SELECT id, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800' FROM product WHERE nom = 'iPhone 15 Pro Max';
INSERT INTO product_images (product_id, images) SELECT id, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800' FROM product WHERE nom = 'Sony WH-1000XM5';
INSERT INTO product_images (product_id, images) SELECT id, 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800' FROM product WHERE nom = 'Razer BlackWidow';
INSERT INTO product_images (product_id, images) SELECT id, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800' FROM product WHERE nom = 'MacBook Air M2';
INSERT INTO product_images (product_id, images) SELECT id, 'https://images.unsplash.com/photo-1546868871-70c122467d8b?w=800' FROM product WHERE nom = 'Apple Watch Series 9';

-- Mode
INSERT INTO product_images (product_id, images) SELECT id, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800' FROM product WHERE nom = 'Nike Air Max';
INSERT INTO product_images (product_id, images) SELECT id, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800' FROM product WHERE nom = 'T-shirt Coton Bio';
INSERT INTO product_images (product_id, images) SELECT id, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800' FROM product WHERE nom = 'Veste en Cuir Vintage';

-- Maison
INSERT INTO product_images (product_id, images) SELECT id, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800' FROM product WHERE nom = 'Canapé Scandinave';
INSERT INTO product_images (product_id, images) SELECT id, 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800' FROM product WHERE nom = 'Machine à café Espresso';
INSERT INTO product_images (product_id, images) SELECT id, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800' FROM product WHERE nom = 'Lampe de Bureau LED';

-- Sport
INSERT INTO product_images (product_id, images) SELECT id, 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=800' FROM product WHERE nom = 'Tapis de Yoga Pro';
INSERT INTO product_images (product_id, images) SELECT id, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800' FROM product WHERE nom = 'Haltères 10kg';


-- ==========================================
-- LIAISON PRODUITS <=> CATEGORIES
-- ==========================================
-- Info
INSERT INTO product_category (product_id, category_id) SELECT p.id, c.id FROM product p, category c 
WHERE p.nom IN ('iPhone 15 Pro Max', 'Sony WH-1000XM5', 'Razer BlackWidow', 'MacBook Air M2', 'Apple Watch Series 9') AND c.nom = 'ELECTRONIQUE';

-- Mode
INSERT INTO product_category (product_id, category_id) SELECT p.id, c.id FROM product p, category c 
WHERE p.nom IN ('Nike Air Max', 'T-shirt Coton Bio', 'Veste en Cuir Vintage') AND c.nom = 'MODE';

-- Maison
INSERT INTO product_category (product_id, category_id) SELECT p.id, c.id FROM product p, category c 
WHERE p.nom IN ('Canapé Scandinave', 'Machine à café Espresso', 'Lampe de Bureau LED') AND c.nom = 'MAISON';

-- Sport
INSERT INTO product_category (product_id, category_id) SELECT p.id, c.id FROM product p, category c 
WHERE p.nom IN ('Tapis de Yoga Pro', 'Haltères 10kg') AND c.nom = 'SPORT';

-- ==========================================
-- CODES PROMO
-- ==========================================
INSERT INTO promo_codes (active, code, discount_type, discount_value, usages_actuels, usages_max) 
VALUES (true, 'WELCOME10', 'PERCENTAGE', 10.0, 0, 100);
