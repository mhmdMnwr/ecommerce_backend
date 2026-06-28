const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Brand = require('../models/brand.model');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const Feedback = require('../models/feedback.model');
const { Roles } = require('../constants/roles');
const { OrderStatus } = require('../constants/orderStatus');
const { ProductStatus } = require('../constants/productStatus');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// ============================================
// CONFIGURATION - Algerian Grossiste (Wholesale) Shop
// ============================================
const CONFIG = {
    BRANDS: 50,
    CATEGORIES: 20,
    PRODUCTS: 400,
    CUSTOMERS: 200,
    ORDERS: 600,
    FEEDBACKS: 150,
    DATE_RANGE_YEARS: 2
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - CONFIG.DATE_RANGE_YEARS);
    return { start, end };
};

// ============================================
// ALGERIAN WHOLESALE DATA
// ============================================

// Algerian & International Brands for Wholesale
const brandNames = [
    // Algerian Beverages
    'Hamoud Boualem', 'Ifri', 'Ngaous', 'Rouiba', 'Saida', 'Toudja', 'Star', 'NCA Rouiba',
    // International Beverages
    'Coca-Cola', 'Pepsi', 'Fanta', 'Sprite', 'Mirinda', '7UP', 'Schweppes', 'Orangina',
    // Dairy & Cheese
    'Soummam', 'Hodna', 'Trèfle', 'Tassili', 'Safilait', 'Candia Tchin', 'Danone', 'Activia',
    'Kiri', 'La Vache Qui Rit', 'Président', 'Babybel', 'Tartare', 'Philadelphia', 'Cœur de Lait',
    // Snacks & Biscuits
    'Bimo', 'Cebon', 'La Belle', 'Biskrem', 'Yago', 'Tartino', 'Chocotom', 'Madeleine',
    // Coffee & Tea
    'Carte Noire', 'Nescafé', 'Lipton', 'Twinings',
    // Oils & Condiments
    'Cevital', 'Afia', 'Fleurial', 'Elio', 'Lesieur',
    // Confectionery
    'Milka', 'Kinder', 'Nutella', 'Mars', 'Snickers', 'Twix', 'Bounty',
    // Cleaning & Hygiene
    'Isis', 'OMO', 'Ariel', 'Tide', 'Palmolive', 'Dove', 'Nivea', 'Signal'
];

// Categories for Wholesale
const categoryNames = [
    'Boissons Gazeuses', 'Jus et Nectars', 'Eaux Minérales', 'Produits Laitiers',
    'Fromages', 'Yaourts', 'Biscuits et Gâteaux', 'Chocolat et Confiseries',
    'Chips et Snacks', 'Café et Thé', 'Huiles Alimentaires', 'Conserves',
    'Pâtes et Semoule', 'Sucre et Farine', 'Produits d\'Entretien', 'Hygiène Corporelle',
    'Céréales Petit-Déjeuner', 'Condiments et Sauces', 'Produits Surgelés', 'Épicerie Générale'
];

// Algerian Products Database with realistic wholesale prices (in DZD)
const algerianProducts = [
    // BOISSONS GAZEUSES (Sodas)
    { name: 'Hamoud Boualem Selecto 1L', category: 'Boissons Gazeuses', brand: 'Hamoud Boualem', price: 80, units: 12 },
    { name: 'Hamoud Boualem Selecto 2L', category: 'Boissons Gazeuses', brand: 'Hamoud Boualem', price: 140, units: 6 },
    { name: 'Hamoud Boualem Slim 33cl', category: 'Boissons Gazeuses', brand: 'Hamoud Boualem', price: 45, units: 24 },
    { name: 'Hamoud Boualem Citron 1L', category: 'Boissons Gazeuses', brand: 'Hamoud Boualem', price: 80, units: 12 },
    { name: 'Hamoud Boualem Orange 1L', category: 'Boissons Gazeuses', brand: 'Hamoud Boualem', price: 80, units: 12 },
    { name: 'Coca-Cola 1L', category: 'Boissons Gazeuses', brand: 'Coca-Cola', price: 100, units: 12 },
    { name: 'Coca-Cola 2L', category: 'Boissons Gazeuses', brand: 'Coca-Cola', price: 180, units: 6 },
    { name: 'Coca-Cola 33cl Canette', category: 'Boissons Gazeuses', brand: 'Coca-Cola', price: 70, units: 24 },
    { name: 'Coca-Cola Zero 1L', category: 'Boissons Gazeuses', brand: 'Coca-Cola', price: 100, units: 12 },
    { name: 'Coca-Cola Zero 33cl', category: 'Boissons Gazeuses', brand: 'Coca-Cola', price: 70, units: 24 },
    { name: 'Pepsi 1L', category: 'Boissons Gazeuses', brand: 'Pepsi', price: 95, units: 12 },
    { name: 'Pepsi 2L', category: 'Boissons Gazeuses', brand: 'Pepsi', price: 170, units: 6 },
    { name: 'Pepsi 33cl Canette', category: 'Boissons Gazeuses', brand: 'Pepsi', price: 65, units: 24 },
    { name: 'Fanta Orange 1L', category: 'Boissons Gazeuses', brand: 'Fanta', price: 95, units: 12 },
    { name: 'Fanta Orange 33cl', category: 'Boissons Gazeuses', brand: 'Fanta', price: 65, units: 24 },
    { name: 'Sprite 1L', category: 'Boissons Gazeuses', brand: 'Sprite', price: 95, units: 12 },
    { name: 'Sprite 33cl', category: 'Boissons Gazeuses', brand: 'Sprite', price: 65, units: 24 },
    { name: 'Mirinda Orange 1L', category: 'Boissons Gazeuses', brand: 'Mirinda', price: 90, units: 12 },
    { name: 'Mirinda Pomme 1L', category: 'Boissons Gazeuses', brand: 'Mirinda', price: 90, units: 12 },
    { name: '7UP 1L', category: 'Boissons Gazeuses', brand: '7UP', price: 90, units: 12 },
    { name: '7UP 33cl', category: 'Boissons Gazeuses', brand: '7UP', price: 60, units: 24 },
    { name: 'Schweppes Citron 1L', category: 'Boissons Gazeuses', brand: 'Schweppes', price: 110, units: 12 },
    { name: 'Schweppes Tonic 1L', category: 'Boissons Gazeuses', brand: 'Schweppes', price: 110, units: 12 },
    { name: 'Ifri Citron 1L', category: 'Boissons Gazeuses', brand: 'Ifri', price: 75, units: 12 },
    { name: 'Ifri Orange 1L', category: 'Boissons Gazeuses', brand: 'Ifri', price: 75, units: 12 },

    // JUS ET NECTARS
    { name: 'Rouiba Orange 1L', category: 'Jus et Nectars', brand: 'NCA Rouiba', price: 120, units: 12 },
    { name: 'Rouiba Mangue 1L', category: 'Jus et Nectars', brand: 'NCA Rouiba', price: 120, units: 12 },
    { name: 'Rouiba Pomme 1L', category: 'Jus et Nectars', brand: 'NCA Rouiba', price: 120, units: 12 },
    { name: 'Rouiba Multifruit 1L', category: 'Jus et Nectars', brand: 'NCA Rouiba', price: 125, units: 12 },
    { name: 'Rouiba Cocktail 1L', category: 'Jus et Nectars', brand: 'NCA Rouiba', price: 125, units: 12 },
    { name: 'Rouiba Orange 25cl', category: 'Jus et Nectars', brand: 'NCA Rouiba', price: 40, units: 24 },
    { name: 'Rouiba Raisin 1L', category: 'Jus et Nectars', brand: 'NCA Rouiba', price: 130, units: 12 },
    { name: 'Ngaous Abricot 1L', category: 'Jus et Nectars', brand: 'Ngaous', price: 110, units: 12 },
    { name: 'Ngaous Pêche 1L', category: 'Jus et Nectars', brand: 'Ngaous', price: 110, units: 12 },
    { name: 'Ngaous Orange 1L', category: 'Jus et Nectars', brand: 'Ngaous', price: 105, units: 12 },
    { name: 'Ngaous Pomme 1L', category: 'Jus et Nectars', brand: 'Ngaous', price: 105, units: 12 },
    { name: 'Ifri Jus Orange 1L', category: 'Jus et Nectars', brand: 'Ifri', price: 100, units: 12 },
    { name: 'Ifri Jus Pomme 1L', category: 'Jus et Nectars', brand: 'Ifri', price: 100, units: 12 },

    // EAUX MINERALES
    { name: 'Saida 1.5L', category: 'Eaux Minérales', brand: 'Saida', price: 35, units: 6 },
    { name: 'Saida 0.5L', category: 'Eaux Minérales', brand: 'Saida', price: 20, units: 12 },
    { name: 'Ifri 1.5L', category: 'Eaux Minérales', brand: 'Ifri', price: 35, units: 6 },
    { name: 'Ifri 0.5L', category: 'Eaux Minérales', brand: 'Ifri', price: 20, units: 12 },
    { name: 'Toudja 1.5L', category: 'Eaux Minérales', brand: 'Toudja', price: 40, units: 6 },
    { name: 'Toudja 0.5L', category: 'Eaux Minérales', brand: 'Toudja', price: 25, units: 12 },
    { name: 'Star 1.5L', category: 'Eaux Minérales', brand: 'Star', price: 30, units: 6 },
    { name: 'Star 0.5L', category: 'Eaux Minérales', brand: 'Star', price: 18, units: 12 },
    { name: 'Guedila 1.5L', category: 'Eaux Minérales', brand: 'Ifri', price: 32, units: 6 },
    { name: 'Lalla Khedidja 1.5L', category: 'Eaux Minérales', brand: 'Ifri', price: 38, units: 6 },

    // PRODUITS LAITIERS
    { name: 'Lait Candia Viva 1L', category: 'Produits Laitiers', brand: 'Candia Tchin', price: 85, units: 12 },
    { name: 'Lait Candia Silhouette 1L', category: 'Produits Laitiers', brand: 'Candia Tchin', price: 90, units: 12 },
    { name: 'Lait Soummam 1L', category: 'Produits Laitiers', brand: 'Soummam', price: 80, units: 12 },
    { name: 'Lait Hodna 1L', category: 'Produits Laitiers', brand: 'Hodna', price: 75, units: 12 },
    { name: 'Lait Trèfle 1L', category: 'Produits Laitiers', brand: 'Trèfle', price: 78, units: 12 },
    { name: 'Lait Tassili 1L', category: 'Produits Laitiers', brand: 'Tassili', price: 75, units: 12 },
    { name: 'Lben Soummam 1L', category: 'Produits Laitiers', brand: 'Soummam', price: 70, units: 12 },
    { name: 'Lben Hodna 1L', category: 'Produits Laitiers', brand: 'Hodna', price: 65, units: 12 },
    { name: 'Raib Soummam 1L', category: 'Produits Laitiers', brand: 'Soummam', price: 75, units: 12 },
    { name: 'Crème Fraîche Trèfle 20cl', category: 'Produits Laitiers', brand: 'Trèfle', price: 90, units: 24 },

    // FROMAGES
    { name: 'Kiri 6 Portions', category: 'Fromages', brand: 'Kiri', price: 180, units: 24 },
    { name: 'Kiri 8 Portions', category: 'Fromages', brand: 'Kiri', price: 230, units: 24 },
    { name: 'Kiri 12 Portions', category: 'Fromages', brand: 'Kiri', price: 320, units: 12 },
    { name: 'La Vache Qui Rit 8 Portions', category: 'Fromages', brand: 'La Vache Qui Rit', price: 200, units: 24 },
    { name: 'La Vache Qui Rit 16 Portions', category: 'Fromages', brand: 'La Vache Qui Rit', price: 380, units: 12 },
    { name: 'La Vache Qui Rit 24 Portions', category: 'Fromages', brand: 'La Vache Qui Rit', price: 520, units: 6 },
    { name: 'Babybel Filet 6 Pièces', category: 'Fromages', brand: 'Babybel', price: 350, units: 12 },
    { name: 'Président Camembert 250g', category: 'Fromages', brand: 'Président', price: 450, units: 12 },
    { name: 'Président Emmental Râpé 200g', category: 'Fromages', brand: 'Président', price: 380, units: 12 },
    { name: 'Fromage Rouge Trèfle 200g', category: 'Fromages', brand: 'Trèfle', price: 280, units: 12 },
    { name: 'Fromage Fondu Cœur de Lait', category: 'Fromages', brand: 'Cœur de Lait', price: 150, units: 24 },
    { name: 'Philadelphia Original 200g', category: 'Fromages', brand: 'Philadelphia', price: 420, units: 12 },
    { name: 'Tartare Ail et Fines Herbes', category: 'Fromages', brand: 'Tartare', price: 380, units: 12 },
    { name: 'Fromage Râpé Soummam 200g', category: 'Fromages', brand: 'Soummam', price: 250, units: 12 },

    // YAOURTS
    { name: 'Activia Nature 4x125g', category: 'Yaourts', brand: 'Activia', price: 200, units: 12 },
    { name: 'Activia Fraise 4x125g', category: 'Yaourts', brand: 'Activia', price: 220, units: 12 },
    { name: 'Activia Céréales 4x125g', category: 'Yaourts', brand: 'Activia', price: 230, units: 12 },
    { name: 'Danone Fruix Fraise 6x110g', category: 'Yaourts', brand: 'Danone', price: 180, units: 12 },
    { name: 'Danone Fruix Abricot 6x110g', category: 'Yaourts', brand: 'Danone', price: 180, units: 12 },
    { name: 'Soummam Yaourt Brassé Nature 1kg', category: 'Yaourts', brand: 'Soummam', price: 200, units: 6 },
    { name: 'Soummam Yaourt Fruits 12x100g', category: 'Yaourts', brand: 'Soummam', price: 280, units: 6 },
    { name: 'Hodna Yaourt Nature 500g', category: 'Yaourts', brand: 'Hodna', price: 90, units: 12 },
    { name: 'Trèfle Crème Dessert Vanille', category: 'Yaourts', brand: 'Trèfle', price: 60, units: 24 },
    { name: 'Trèfle Crème Dessert Chocolat', category: 'Yaourts', brand: 'Trèfle', price: 60, units: 24 },

    // BISCUITS ET GATEAUX - TARTINO & YAGO
    { name: 'Tartino 16 (Paquet 16 pièces)', category: 'Biscuits et Gâteaux', brand: 'Tartino', price: 120, units: 24 },
    { name: 'Tartino 24 (Paquet 24 pièces)', category: 'Biscuits et Gâteaux', brand: 'Tartino', price: 170, units: 24 },
    { name: 'Tartino Chocolat 16', category: 'Biscuits et Gâteaux', brand: 'Tartino', price: 130, units: 24 },
    { name: 'Tartino Vanille 16', category: 'Biscuits et Gâteaux', brand: 'Tartino', price: 130, units: 24 },
    { name: 'Tartino Fraise 16', category: 'Biscuits et Gâteaux', brand: 'Tartino', price: 130, units: 24 },
    { name: 'Yago Original (Paquet)', category: 'Biscuits et Gâteaux', brand: 'Yago', price: 50, units: 48 },
    { name: 'Yago Chocolat', category: 'Biscuits et Gâteaux', brand: 'Yago', price: 55, units: 48 },
    { name: 'Yago Vanille', category: 'Biscuits et Gâteaux', brand: 'Yago', price: 55, units: 48 },
    { name: 'Yago Fraise', category: 'Biscuits et Gâteaux', brand: 'Yago', price: 55, units: 48 },
    { name: 'Yago Caramel', category: 'Biscuits et Gâteaux', brand: 'Yago', price: 55, units: 48 },
    { name: 'Bimo Choco Prince', category: 'Biscuits et Gâteaux', brand: 'Bimo', price: 45, units: 48 },
    { name: 'Bimo Petit Beurre 200g', category: 'Biscuits et Gâteaux', brand: 'Bimo', price: 80, units: 24 },
    { name: 'Bimo Sablé 200g', category: 'Biscuits et Gâteaux', brand: 'Bimo', price: 90, units: 24 },
    { name: 'Bimo Cookies Chocolat', category: 'Biscuits et Gâteaux', brand: 'Bimo', price: 100, units: 24 },
    { name: 'Biskrem Chocolat', category: 'Biscuits et Gâteaux', brand: 'Biskrem', price: 60, units: 36 },
    { name: 'Biskrem Vanille', category: 'Biscuits et Gâteaux', brand: 'Biskrem', price: 60, units: 36 },
    { name: 'Cebon Gaufrette Chocolat', category: 'Biscuits et Gâteaux', brand: 'Cebon', price: 40, units: 48 },
    { name: 'Cebon Gaufrette Vanille', category: 'Biscuits et Gâteaux', brand: 'Cebon', price: 40, units: 48 },
    { name: 'La Belle Madeleine x12', category: 'Biscuits et Gâteaux', brand: 'La Belle', price: 150, units: 24 },
    { name: 'Chocotom Barre Chocolat', category: 'Biscuits et Gâteaux', brand: 'Chocotom', price: 35, units: 48 },

    // CHOCOLAT ET CONFISERIES
    { name: 'Nutella 350g', category: 'Chocolat et Confiseries', brand: 'Nutella', price: 650, units: 12 },
    { name: 'Nutella 750g', category: 'Chocolat et Confiseries', brand: 'Nutella', price: 1100, units: 6 },
    { name: 'Kinder Bueno x3', category: 'Chocolat et Confiseries', brand: 'Kinder', price: 180, units: 24 },
    { name: 'Kinder Surprise', category: 'Chocolat et Confiseries', brand: 'Kinder', price: 150, units: 24 },
    { name: 'Kinder Country x4', category: 'Chocolat et Confiseries', brand: 'Kinder', price: 200, units: 24 },
    { name: 'Kinder Maxi', category: 'Chocolat et Confiseries', brand: 'Kinder', price: 80, units: 36 },
    { name: 'Milka Tablette Lait 100g', category: 'Chocolat et Confiseries', brand: 'Milka', price: 220, units: 24 },
    { name: 'Milka Tablette Noisettes 100g', category: 'Chocolat et Confiseries', brand: 'Milka', price: 240, units: 24 },
    { name: 'Milka Oreo 100g', category: 'Chocolat et Confiseries', brand: 'Milka', price: 250, units: 24 },
    { name: 'Mars Barre', category: 'Chocolat et Confiseries', brand: 'Mars', price: 70, units: 48 },
    { name: 'Snickers Barre', category: 'Chocolat et Confiseries', brand: 'Snickers', price: 70, units: 48 },
    { name: 'Twix Barre', category: 'Chocolat et Confiseries', brand: 'Twix', price: 70, units: 48 },
    { name: 'Bounty Barre', category: 'Chocolat et Confiseries', brand: 'Bounty', price: 70, units: 48 },

    // CHIPS ET SNACKS
    { name: 'Chips Bimo Nature 45g', category: 'Chips et Snacks', brand: 'Bimo', price: 40, units: 48 },
    { name: 'Chips Bimo Paprika 45g', category: 'Chips et Snacks', brand: 'Bimo', price: 40, units: 48 },
    { name: 'Chips Bimo Fromage 45g', category: 'Chips et Snacks', brand: 'Bimo', price: 40, units: 48 },
    { name: 'Chips Bimo BBQ 45g', category: 'Chips et Snacks', brand: 'Bimo', price: 40, units: 48 },
    { name: 'Chips Bimo Grand Format 150g', category: 'Chips et Snacks', brand: 'Bimo', price: 120, units: 24 },
    { name: 'Star Chips Nature 30g', category: 'Chips et Snacks', brand: 'Star', price: 30, units: 60 },
    { name: 'Star Chips Ketchup 30g', category: 'Chips et Snacks', brand: 'Star', price: 30, units: 60 },
    { name: 'Curly Cacahuète', category: 'Chips et Snacks', brand: 'Bimo', price: 50, units: 36 },
    { name: 'Pop Corn Sucré 100g', category: 'Chips et Snacks', brand: 'Cebon', price: 45, units: 48 },
    { name: 'Pop Corn Salé 100g', category: 'Chips et Snacks', brand: 'Cebon', price: 45, units: 48 },

    // CAFE ET THE
    { name: 'Nescafé Classic 50g', category: 'Café et Thé', brand: 'Nescafé', price: 350, units: 24 },
    { name: 'Nescafé Classic 100g', category: 'Café et Thé', brand: 'Nescafé', price: 650, units: 12 },
    { name: 'Nescafé Classic 200g', category: 'Café et Thé', brand: 'Nescafé', price: 1200, units: 6 },
    { name: 'Nescafé Gold 50g', category: 'Café et Thé', brand: 'Nescafé', price: 480, units: 24 },
    { name: 'Nescafé 3in1 Sachet x10', category: 'Café et Thé', brand: 'Nescafé', price: 180, units: 24 },
    { name: 'Carte Noire 250g Moulu', category: 'Café et Thé', brand: 'Carte Noire', price: 550, units: 12 },
    { name: 'Lipton Yellow Label 100 Sachets', category: 'Café et Thé', brand: 'Lipton', price: 480, units: 12 },
    { name: 'Lipton Green Tea 25 Sachets', category: 'Café et Thé', brand: 'Lipton', price: 220, units: 24 },
    { name: 'Twinings Earl Grey 25 Sachets', category: 'Café et Thé', brand: 'Twinings', price: 350, units: 12 },

    // HUILES ALIMENTAIRES
    { name: 'Huile Fleurial 5L', category: 'Huiles Alimentaires', brand: 'Fleurial', price: 950, units: 4 },
    { name: 'Huile Fleurial 2L', category: 'Huiles Alimentaires', brand: 'Fleurial', price: 400, units: 6 },
    { name: 'Huile Fleurial 1L', category: 'Huiles Alimentaires', brand: 'Fleurial', price: 220, units: 12 },
    { name: 'Huile Elio 5L', category: 'Huiles Alimentaires', brand: 'Elio', price: 900, units: 4 },
    { name: 'Huile Elio 2L', category: 'Huiles Alimentaires', brand: 'Elio', price: 380, units: 6 },
    { name: 'Huile Afia 5L', category: 'Huiles Alimentaires', brand: 'Afia', price: 980, units: 4 },
    { name: 'Huile Afia 1L', category: 'Huiles Alimentaires', brand: 'Afia', price: 230, units: 12 },
    { name: 'Huile Olive Cevital 1L', category: 'Huiles Alimentaires', brand: 'Cevital', price: 800, units: 12 },
    { name: 'Huile Olive Lesieur 75cl', category: 'Huiles Alimentaires', brand: 'Lesieur', price: 750, units: 12 },

    // CONSERVES
    { name: 'Tomate Concentré Double 400g', category: 'Conserves', brand: 'Cevital', price: 120, units: 24 },
    { name: 'Tomate Concentré Double 800g', category: 'Conserves', brand: 'Cevital', price: 220, units: 12 },
    { name: 'Harissa 400g', category: 'Conserves', brand: 'Cevital', price: 140, units: 24 },
    { name: 'Olives Vertes Bocal 400g', category: 'Conserves', brand: 'Cevital', price: 180, units: 12 },
    { name: 'Olives Noires Bocal 400g', category: 'Conserves', brand: 'Cevital', price: 200, units: 12 },
    { name: 'Thon Entier 400g', category: 'Conserves', brand: 'La Belle', price: 450, units: 24 },
    { name: 'Sardines Huile 125g', category: 'Conserves', brand: 'La Belle', price: 120, units: 48 },
    { name: 'Maïs Doux 400g', category: 'Conserves', brand: 'Cevital', price: 150, units: 24 },
    { name: 'Petits Pois 400g', category: 'Conserves', brand: 'Cevital', price: 130, units: 24 },
    { name: 'Haricots Blancs 400g', category: 'Conserves', brand: 'Cevital', price: 140, units: 24 },

    // PATES ET SEMOULE
    { name: 'Spaghetti 500g', category: 'Pâtes et Semoule', brand: 'La Belle', price: 80, units: 24 },
    { name: 'Spaghetti 1kg', category: 'Pâtes et Semoule', brand: 'La Belle', price: 150, units: 12 },
    { name: 'Macaroni 500g', category: 'Pâtes et Semoule', brand: 'La Belle', price: 75, units: 24 },
    { name: 'Penne 500g', category: 'Pâtes et Semoule', brand: 'La Belle', price: 80, units: 24 },
    { name: 'Couscous Moyen 1kg', category: 'Pâtes et Semoule', brand: 'Cevital', price: 180, units: 12 },
    { name: 'Couscous Fin 1kg', category: 'Pâtes et Semoule', brand: 'Cevital', price: 180, units: 12 },
    { name: 'Semoule Fine 5kg', category: 'Pâtes et Semoule', brand: 'Cevital', price: 600, units: 4 },
    { name: 'Semoule Moyenne 5kg', category: 'Pâtes et Semoule', brand: 'Cevital', price: 600, units: 4 },
    { name: 'Vermicelle 500g', category: 'Pâtes et Semoule', brand: 'La Belle', price: 70, units: 24 },
    { name: 'Lasagne 500g', category: 'Pâtes et Semoule', brand: 'La Belle', price: 120, units: 24 },

    // SUCRE ET FARINE
    { name: 'Sucre Blanc 1kg', category: 'Sucre et Farine', brand: 'Cevital', price: 120, units: 12 },
    { name: 'Sucre Blanc 5kg', category: 'Sucre et Farine', brand: 'Cevital', price: 550, units: 4 },
    { name: 'Sucre Glace 1kg', category: 'Sucre et Farine', brand: 'Cevital', price: 150, units: 12 },
    { name: 'Sucre Roux 1kg', category: 'Sucre et Farine', brand: 'Cevital', price: 180, units: 12 },
    { name: 'Farine Type 45 1kg', category: 'Sucre et Farine', brand: 'Cevital', price: 80, units: 12 },
    { name: 'Farine Type 55 1kg', category: 'Sucre et Farine', brand: 'Cevital', price: 75, units: 12 },
    { name: 'Farine 5kg', category: 'Sucre et Farine', brand: 'Cevital', price: 350, units: 4 },
    { name: 'Levure Sèche x10 Sachets', category: 'Sucre et Farine', brand: 'La Belle', price: 60, units: 48 },

    // PRODUITS D'ENTRETIEN
    { name: 'OMO Lessive 3kg', category: 'Produits d\'Entretien', brand: 'OMO', price: 850, units: 4 },
    { name: 'OMO Lessive 1kg', category: 'Produits d\'Entretien', brand: 'OMO', price: 320, units: 12 },
    { name: 'Ariel Lessive 3kg', category: 'Produits d\'Entretien', brand: 'Ariel', price: 900, units: 4 },
    { name: 'Ariel Lessive 1kg', category: 'Produits d\'Entretien', brand: 'Ariel', price: 350, units: 12 },
    { name: 'Tide Lessive 2.5kg', category: 'Produits d\'Entretien', brand: 'Tide', price: 750, units: 4 },
    { name: 'Isis Javel 1L', category: 'Produits d\'Entretien', brand: 'Isis', price: 80, units: 12 },
    { name: 'Isis Javel 2L', category: 'Produits d\'Entretien', brand: 'Isis', price: 140, units: 6 },
    { name: 'Isis Nettoyant Multi-Usage 1L', category: 'Produits d\'Entretien', brand: 'Isis', price: 120, units: 12 },
    { name: 'Isis Lave-Vaisselle 750ml', category: 'Produits d\'Entretien', brand: 'Isis', price: 150, units: 12 },

    // HYGIENE CORPORELLE
    { name: 'Palmolive Savon 90g x3', category: 'Hygiène Corporelle', brand: 'Palmolive', price: 180, units: 24 },
    { name: 'Palmolive Gel Douche 250ml', category: 'Hygiène Corporelle', brand: 'Palmolive', price: 280, units: 12 },
    { name: 'Dove Savon 100g', category: 'Hygiène Corporelle', brand: 'Dove', price: 150, units: 48 },
    { name: 'Dove Gel Douche 250ml', category: 'Hygiène Corporelle', brand: 'Dove', price: 350, units: 12 },
    { name: 'Nivea Crème 150ml', category: 'Hygiène Corporelle', brand: 'Nivea', price: 380, units: 12 },
    { name: 'Nivea Déodorant 150ml', category: 'Hygiène Corporelle', brand: 'Nivea', price: 320, units: 12 },
    { name: 'Signal Dentifrice 75ml', category: 'Hygiène Corporelle', brand: 'Signal', price: 180, units: 24 },
    { name: 'Signal Dentifrice 100ml', category: 'Hygiène Corporelle', brand: 'Signal', price: 220, units: 24 },
    { name: 'Signal Brosse à Dents', category: 'Hygiène Corporelle', brand: 'Signal', price: 120, units: 48 },

    // CEREALES PETIT-DEJEUNER
    { name: 'Corn Flakes 500g', category: 'Céréales Petit-Déjeuner', brand: 'Cebon', price: 250, units: 12 },
    { name: 'Choco Pops 375g', category: 'Céréales Petit-Déjeuner', brand: 'Cebon', price: 280, units: 12 },
    { name: 'Muesli Fruits 500g', category: 'Céréales Petit-Déjeuner', brand: 'Cebon', price: 320, units: 12 },
    { name: 'Flocons d\'Avoine 500g', category: 'Céréales Petit-Déjeuner', brand: 'Cebon', price: 200, units: 12 },

    // CONDIMENTS ET SAUCES
    { name: 'Mayonnaise 500g', category: 'Condiments et Sauces', brand: 'Cevital', price: 250, units: 12 },
    { name: 'Mayonnaise 250g', category: 'Condiments et Sauces', brand: 'Cevital', price: 150, units: 24 },
    { name: 'Ketchup 500g', category: 'Condiments et Sauces', brand: 'Cevital', price: 180, units: 12 },
    { name: 'Moutarde 200g', category: 'Condiments et Sauces', brand: 'Cevital', price: 120, units: 24 },
    { name: 'Vinaigre 1L', category: 'Condiments et Sauces', brand: 'Cevital', price: 100, units: 12 },
    { name: 'Sauce Soja 250ml', category: 'Condiments et Sauces', brand: 'La Belle', price: 180, units: 24 },

    // EPICERIE GENERALE
    { name: 'Riz Long 1kg', category: 'Épicerie Générale', brand: 'Cevital', price: 200, units: 12 },
    { name: 'Riz Long 5kg', category: 'Épicerie Générale', brand: 'Cevital', price: 900, units: 4 },
    { name: 'Lentilles 500g', category: 'Épicerie Générale', brand: 'Cevital', price: 120, units: 24 },
    { name: 'Pois Chiches 500g', category: 'Épicerie Générale', brand: 'Cevital', price: 130, units: 24 },
    { name: 'Haricots Secs 500g', category: 'Épicerie Générale', brand: 'Cevital', price: 110, units: 24 },
    { name: 'Sel Fin 1kg', category: 'Épicerie Générale', brand: 'Cevital', price: 40, units: 24 },
    { name: 'Sel Gros 1kg', category: 'Épicerie Générale', brand: 'Cevital', price: 35, units: 24 },
    { name: 'Poivre Noir Moulu 50g', category: 'Épicerie Générale', brand: 'Cevital', price: 80, units: 48 },
    { name: 'Cumin Moulu 50g', category: 'Épicerie Générale', brand: 'Cevital', price: 70, units: 48 },
    { name: 'Paprika 50g', category: 'Épicerie Générale', brand: 'Cevital', price: 65, units: 48 },
    { name: 'Cannelle Moulue 50g', category: 'Épicerie Générale', brand: 'Cevital', price: 90, units: 48 },
    { name: 'Ras El Hanout 50g', category: 'Épicerie Générale', brand: 'Cevital', price: 100, units: 48 }
];

// Algerian Names for Customers (Shop Owners)
const algerianFirstNames = [
    'Mohamed', 'Ahmed', 'Karim', 'Youcef', 'Omar', 'Amine', 'Rachid', 'Samir', 'Khaled', 'Walid',
    'Hakim', 'Nabil', 'Farid', 'Tarek', 'Hichem', 'Sofiane', 'Bilal', 'Mourad', 'Djamel', 'Nadir',
    'Fatima', 'Amina', 'Khadija', 'Aicha', 'Meriem', 'Nadia', 'Samira', 'Leila', 'Zineb', 'Houria',
    'Amel', 'Souad', 'Karima', 'Djamila', 'Nabila', 'Farida', 'Yasmina', 'Salima', 'Hakima', 'Radia',
    'Abdelkader', 'Abderrahmane', 'Boumediene', 'Messaoud', 'Belkacem', 'Mouloud', 'Larbi', 'Hamid', 'Said', 'Bachir'
];

const algerianLastNames = [
    'Benali', 'Boudiaf', 'Khelifa', 'Hamidi', 'Cherif', 'Belhadj', 'Mansouri', 'Saidi', 'Brahimi', 'Taleb',
    'Meziane', 'Benaissa', 'Zeroual', 'Bouzid', 'Hadj', 'Benkhedda', 'Mokhtar', 'Slimani', 'Berrada', 'Chakib',
    'Amrani', 'Kassouri', 'Dahmani', 'Belkacemi', 'Guerrouche', 'Haddad', 'Mebarki', 'Rebah', 'Toumi', 'Yahia',
    'Ait Ahmed', 'Benyahia', 'Boudina', 'Djebbar', 'Ferhat', 'Guendouz', 'Hadjadj', 'Ighil', 'Kadir', 'Labed'
];

// Algerian Wilayas (States) and Cities
const algerianLocations = [
    { wilaya: 'Alger', cities: ['Bab El Oued', 'El Harrach', 'Hussein Dey', 'Kouba', 'Bir Mourad Rais', 'Cheraga', 'Draria', 'Bordj El Kiffan'] },
    { wilaya: 'Oran', cities: ['Bir El Djir', 'Es Senia', 'Arzew', 'Ain El Turck', 'Gdyel', 'Bethioua'] },
    { wilaya: 'Constantine', cities: ['El Khroub', 'Ain Smara', 'Didouche Mourad', 'Hamma Bouziane', 'Zighoud Youcef'] },
    { wilaya: 'Annaba', cities: ['El Bouni', 'Sidi Amar', 'El Hadjar', 'Berrahal'] },
    { wilaya: 'Blida', cities: ['Boufarik', 'Mouzaia', 'Oued El Alleug', 'Bougara', 'Larbaa', 'Bouinan'] },
    { wilaya: 'Setif', cities: ['El Eulma', 'Ain Arnat', 'Ain Oulmene', 'Bougaa', 'Ain El Kebira'] },
    { wilaya: 'Batna', cities: ['Barika', 'Ain Touta', 'N\'Gaous', 'Merouana', 'Arris'] },
    { wilaya: 'Bejaia', cities: ['Akbou', 'El Kseur', 'Amizour', 'Tichy', 'Aokas'] },
    { wilaya: 'Tizi Ouzou', cities: ['Draa Ben Khedda', 'Azazga', 'Ain El Hammam', 'Larbaa Nath Irathen', 'Tigzirt'] },
    { wilaya: 'Tlemcen', cities: ['Maghnia', 'Ghazaouet', 'Remchi', 'Sebdou', 'Nedroma'] },
    { wilaya: 'Djelfa', cities: ['Ain Oussera', 'Hassi Bahbah', 'Messaad', 'Birine'] },
    { wilaya: 'Biskra', cities: ['Tolga', 'Ouled Djellal', 'Sidi Okba', 'El Kantara', 'Zeribet El Oued'] },
    { wilaya: 'Mostaganem', cities: ['Ain Tedeles', 'Hassi Mameche', 'Mazagran', 'Achaacha'] },
    { wilaya: 'Mascara', cities: ['Sig', 'Mohammadia', 'Tighennif', 'Ghriss'] },
    { wilaya: 'Chlef', cities: ['Tenes', 'El Karimia', 'Oued Fodda', 'Ain Merane'] }
];

// Feedback comments in French/Arabic style
const feedbackComments = [
    'Excellent service, livraison rapide!',
    'Produits de qualité, je recommande!',
    'Très satisfait de ma commande.',
    'Prix compétitifs pour le gros.',
    'Bonne qualité, emballage soigné.',
    'Service clientèle au top!',
    'Livraison dans les délais.',
    'Produits frais et bien conservés.',
    'Je reviendrai sûrement!',
    'Rapport qualité-prix excellent.',
    'Merci pour le service professionnel.',
    'Commande conforme, rien à dire.',
    'Très bon grossiste, sérieux.',
    'Parfait pour mon commerce.',
    'Service fiable et rapide.',
    'Baraka Allahou fikom!',
    'Hamdoulilah, tout est parfait.',
    'Inchallah on continue ensemble.',
    'Mashallah, très bonne qualité.',
    'Que du bonheur, merci!'
];

// ============================================
// SEED FUNCTIONS
// ============================================

const seedBrands = async () => {
    console.log('🏷️  Clearing existing brands...');
    await Brand.deleteMany({});
    
    const { start, end } = getDateRange();
    
    // Extract unique brands from algerianProducts
    const uniqueBrands = [...new Set(algerianProducts.map(p => p.brand))];
    
    const brands = uniqueBrands.map(name => ({
        title: name,
        image: `https://loremflickr.com/400/400/grocery,food,${encodeURIComponent(name.split(' ')[0])}`,
        createdAt: randomDate(start, end)
    }));
    
    const result = await Brand.insertMany(brands);
    console.log(`✅ Created ${result.length} brands`);
    return result;
};

const seedCategories = async () => {
    console.log('📁 Clearing existing categories...');
    await Category.deleteMany({});
    
    const { start, end } = getDateRange();
    const categories = categoryNames.map(name => ({
        translation: { en: name, fr: name, ar: name },
        image: `https://loremflickr.com/400/400/grocery,food,${encodeURIComponent(name.split(' ')[0])}`,
        createdAt: randomDate(start, end)
    }));
    
    const result = await Category.insertMany(categories);
    console.log(`✅ Created ${result.length} categories`);
    return result;
};

const seedProducts = async (brands, categories) => {
    console.log('📦 Clearing existing products...');
    await Product.deleteMany({});
    
    const { start, end } = getDateRange();
    const products = [];
    const usedTitles = new Set();
    
    // Create brand and category lookup maps
    const brandMap = {};
    brands.forEach(b => { brandMap[b.title] = b._id; });
    
    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.translation.en] = c._id; });
    
    // First, add all predefined Algerian products
    for (const product of algerianProducts) {
        if (!usedTitles.has(product.name)) {
            usedTitles.add(product.name);
            
            products.push({
                title: product.name,
                price: product.price,
                image: `https://loremflickr.com/400/400/grocery,food,${encodeURIComponent(product.name.split(' ')[0])}`,
                brand: brandMap[product.brand] || null,
                category: categoryMap[product.category] || null,
                units: product.units,
                totalSold: 0,
                totalRevenue: 0,
                state: Math.random() > 0.05 ? ProductStatus.AVAILABLE : ProductStatus.UNAVAILABLE,
                createdAt: randomDate(start, end)
            });
        }
    }
    
    // If we need more products to reach CONFIG.PRODUCTS, generate variations
    const variations = ['Pack', 'Lot', 'Promo', 'Spécial', 'Familial', 'Économique', 'Premium', 'Extra'];
    let variationIndex = 0;
    
    while (products.length < CONFIG.PRODUCTS) {
        const baseProduct = randomItem(algerianProducts);
        const variation = variations[variationIndex % variations.length];
        const title = `${baseProduct.name} ${variation} ${randomInt(1, 99)}`;
        
        if (!usedTitles.has(title)) {
            usedTitles.add(title);
            const priceMultiplier = 0.8 + Math.random() * 0.4; // 80% to 120% of base price
            
            products.push({
                title,
                price: Math.round(baseProduct.price * priceMultiplier),
                image: `https://loremflickr.com/400/400/grocery,food,${encodeURIComponent(baseProduct.name.split(' ')[0])}`,
                brand: brandMap[baseProduct.brand] || null,
                category: categoryMap[baseProduct.category] || null,
                units: baseProduct.units,
                totalSold: 0,
                totalRevenue: 0,
                state: Math.random() > 0.08 ? ProductStatus.AVAILABLE : ProductStatus.UNAVAILABLE,
                createdAt: randomDate(start, end)
            });
        }
        variationIndex++;
    }
    
    // Skip validation since we already verified brands/categories exist
    const result = await Product.insertMany(products, { validateBeforeSave: false });
    console.log(`✅ Created ${result.length} products`);
    return result;
};

const seedCustomers = async () => {
    console.log('👥 Adding new customers (keeping existing users)...');
    
    const { start, end } = getDateRange();
    const hashedPassword = await bcrypt.hash('password123', 10);
    const customers = [];
    const usedUsernames = new Set();
    
    // Get existing usernames to avoid duplicates
    const existingUsers = await User.find({}).select('username');
    existingUsers.forEach(u => usedUsernames.add(u.username.toLowerCase()));
    
    for (let i = 0; i < CONFIG.CUSTOMERS; i++) {
        let username;
        do {
            const first = randomItem(algerianFirstNames);
            const last = randomItem(algerianLastNames).replace(/\s+/g, '');
            const num = randomInt(1, 999);
            username = `${first}${last}${num}`;
        } while (usedUsernames.has(username.toLowerCase()));
        usedUsernames.add(username.toLowerCase());
        
        // Generate Algerian address
        const location = randomItem(algerianLocations);
        const city = randomItem(location.cities);
        const address = `${randomInt(1, 200)} Rue ${randomInt(1, 50)}, ${city}, ${location.wilaya}`;
        
        // Generate Algerian phone number (05, 06, 07 prefixes)
        const phonePrefix = randomItem(['05', '06', '07']);
        const phone = `${phonePrefix}${randomInt(10000000, 99999999)}`;
        
        const customerDate = randomDate(start, end);
        
        customers.push({
            username,
            password: hashedPassword,
            role: Roles.CUSTOMER,
            status: 'active',
            address,
            phone,
            totalOrders: 0,
            totalSpent: 0,
            createdAt: customerDate,
            updatedAt: customerDate
        });
    }
    
    const result = await User.insertMany(customers);
    console.log(`✅ Created ${result.length} customers (shop owners)`);
    return result;
};

const seedOrders = async (customers, products) => {
    console.log('🛒 Clearing existing orders...');
    await Order.deleteMany({});
    
    const { start, end } = getDateRange();
    const orders = [];
    const statuses = [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED];
    const statusWeights = [0.1, 0.1, 0.1, 0.6, 0.1]; // 60% delivered for revenue stats
    
    // Create a weighted status picker
    const pickStatus = () => {
        const rand = Math.random();
        let cumulative = 0;
        for (let i = 0; i < statuses.length; i++) {
            cumulative += statusWeights[i];
            if (rand <= cumulative) return statuses[i];
        }
        return OrderStatus.DELIVERED;
    };
    
    // Track customer stats and product stats for updating
    const customerStats = {};
    const productStats = {};
    
    // Wholesale order comments
    const orderComments = [
        'Livraison urgente SVP',
        'Appeler avant livraison',
        'Laisser chez le voisin si absent',
        'Commande pour réapprovisionnement',
        'Promo spéciale grossiste',
        'Paiement à la livraison',
        'Livrer le matin',
        'Stock pour le weekend',
        'Commande régulière',
        ''
    ];
    
    for (let i = 0; i < CONFIG.ORDERS; i++) {
        const customer = randomItem(customers);
        const orderDate = randomDate(start, end);
        const status = pickStatus();
        
        // Generate 1-8 items per order (wholesale orders are larger)
        const itemCount = randomInt(1, 8);
        const items = [];
        let totalAmount = 0;
        const usedProducts = new Set();
        
        for (let j = 0; j < itemCount; j++) {
            let product;
            let attempts = 0;
            do {
                product = randomItem(products);
                attempts++;
            } while (usedProducts.has(product._id.toString()) && usedProducts.size < products.length && attempts < 20);
            
            if (usedProducts.has(product._id.toString())) continue;
            usedProducts.add(product._id.toString());
            
            // Wholesale quantities (1-20 packs/cartons)
            const quantity = randomInt(1, 20);
            const itemTotal = product.price * quantity;
            totalAmount += itemTotal;
            
            items.push({
                productId: product._id,
                quantity,
                units: product.units,
                price: product.price
            });
            
            // Track product stats for delivered orders
            if (status === OrderStatus.DELIVERED) {
                if (!productStats[product._id]) {
                    productStats[product._id] = { sold: 0, revenue: 0 };
                }
                productStats[product._id].sold += quantity;
                productStats[product._id].revenue += itemTotal;
            }
        }
        
        if (items.length === 0) continue;
        
        // Update customer stats tracking
        if (!customerStats[customer._id]) {
            customerStats[customer._id] = { orders: 0, spent: 0 };
        }
        customerStats[customer._id].orders++;
        if (status === OrderStatus.DELIVERED) {
            customerStats[customer._id].spent += totalAmount;
        }
        
        // Create order with dates
        const updatedAt = status === OrderStatus.DELIVERED 
            ? new Date(orderDate.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000)
            : orderDate;
        
        orders.push({
            customerId: customer._id,
            items,
            totalAmount,
            status,
            comment: randomItem(orderComments),
            createdAt: orderDate,
            updatedAt: updatedAt
        });
    }
    
    const result = await Order.insertMany(orders);
    console.log(`✅ Created ${result.length} orders`);
    
    // Update customer totalOrders and totalSpent
    console.log('📊 Updating customer statistics...');
    const customerBulkOps = Object.entries(customerStats).map(([customerId, stats]) => ({
        updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(customerId) },
            update: { $inc: { totalOrders: stats.orders, totalSpent: stats.spent } }
        }
    }));
    
    if (customerBulkOps.length > 0) {
        await User.bulkWrite(customerBulkOps);
        console.log(`✅ Updated stats for ${customerBulkOps.length} customers`);
    }
    
    // Update product totalSold and totalRevenue
    console.log('📊 Updating product statistics...');
    const productBulkOps = Object.entries(productStats).map(([productId, stats]) => ({
        updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(productId) },
            update: { $inc: { totalSold: stats.sold, totalRevenue: stats.revenue } }
        }
    }));
    
    if (productBulkOps.length > 0) {
        await Product.bulkWrite(productBulkOps);
        console.log(`✅ Updated stats for ${productBulkOps.length} products`);
    }
    
    return result;
};

const seedFeedbacks = async (customers) => {
    console.log('💬 Clearing existing feedbacks...');
    await Feedback.deleteMany({});
    
    const { start, end } = getDateRange();
    const feedbacks = [];
    
    for (let i = 0; i < CONFIG.FEEDBACKS; i++) {
        const feedbackDate = randomDate(start, end);
        feedbacks.push({
            customer: randomItem(customers)._id,
            comment: randomItem(feedbackComments),
            createdAt: feedbackDate,
            updatedAt: feedbackDate
        });
    }
    
    const result = await Feedback.insertMany(feedbacks);
    console.log(`✅ Created ${result.length} feedbacks`);
    return result;
};

// ============================================
// MAIN SEED FUNCTION
// ============================================

const seedDatabase = async () => {
    try {
        console.log('\n🚀 Starting database seeding...\n');
        console.log('📋 Configuration:');
        console.log(`   - Brands: ${CONFIG.BRANDS}`);
        console.log(`   - Categories: ${CONFIG.CATEGORIES}`);
        console.log(`   - Products: ${CONFIG.PRODUCTS}`);
        console.log(`   - Customers: ${CONFIG.CUSTOMERS} (new)`);
        console.log(`   - Orders: ${CONFIG.ORDERS}`);
        console.log(`   - Feedbacks: ${CONFIG.FEEDBACKS}`);
        console.log(`   - Date Range: Last ${CONFIG.DATE_RANGE_YEARS} years\n`);
        
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB\n');
        
        // Seed in order of dependencies
        const brands = await seedBrands();
        const categories = await seedCategories();
        const products = await seedProducts(brands, categories);
        const customers = await seedCustomers();
        await seedOrders(customers, products);
        await seedFeedbacks(customers);
        
        console.log('\n🎉 Database seeding completed successfully!\n');
        
        // Print summary
        console.log('📊 Final Database State:');
        const [brandCount, catCount, prodCount, userCount, orderCount, feedbackCount] = await Promise.all([
            Brand.countDocuments(),
            Category.countDocuments(),
            Product.countDocuments(),
            User.countDocuments(),
            Order.countDocuments(),
            Feedback.countDocuments()
        ]);
        console.log(`   - Brands: ${brandCount}`);
        console.log(`   - Categories: ${catCount}`);
        console.log(`   - Products: ${prodCount}`);
        console.log(`   - Total Users: ${userCount}`);
        console.log(`   - Orders: ${orderCount}`);
        console.log(`   - Feedbacks: ${feedbackCount}`);
        
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error seeding database:', err);
        process.exit(1);
    }
};

seedDatabase();
