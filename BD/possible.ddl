-- *********************************************
-- * SQL MySQL generation (CORRIGÉ & OPTIMISÉ)
-- * Schema: BDD
-- * Avec données de test
-- *********************************************

DROP DATABASE IF EXISTS BDD;
CREATE DATABASE BDD;
USE BDD;

-- =============================================
-- TABLES
-- =============================================

-- Table FABRICANT
CREATE TABLE FABRICANT (
    id_fabricant BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    Mail VARCHAR(120) NOT NULL UNIQUE,
    PRIMARY KEY (id_fabricant)
);

-- Table DETAIL (un détail de prix, partagé entre plusieurs contextes)
CREATE TABLE DETAIL (
    id_detail BIGINT NOT NULL AUTO_INCREMENT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    PRIMARY KEY (id_detail)
);

-- Table BALAI (produit de base)
CREATE TABLE BALAI (
    id_balai BIGINT NOT NULL AUTO_INCREMENT,
    Libelle VARCHAR(120) NOT NULL COMMENT 'Intitulé du produit (modèle)',
    description VARCHAR(255) NOT NULL COMMENT 'Petite description accrocheuse',
    img VARCHAR(255) NOT NULL COMMENT 'Chemin vers l''image',
    uses_number INT NOT NULL DEFAULT 0,
    sale_price DECIMAL(10,2) NOT NULL CHECK (sale_price >= 0),
    location_price DECIMAL(10,2) NOT NULL CHECK (location_price >= 0),
    wear INT NOT NULL DEFAULT 0 CHECK (wear BETWEEN 0 AND 100),
    status ENUM('in stock', 'in location', 'arriving') NOT NULL DEFAULT 'in stock',
    id_detail BIGINT NOT NULL,
    id_fabricant BIGINT NOT NULL,
    PRIMARY KEY (id_balai),
    FOREIGN KEY (id_detail) REFERENCES DETAIL(id_detail),
    FOREIGN KEY (id_fabricant) REFERENCES FABRICANT(id_fabricant)
);

-- Table BALAI_MAGIQUE (héritage de BALAI)
CREATE TABLE BALAI_MAGIQUE (
    id_balai BIGINT NOT NULL,
    Flight_licence_required INT NOT NULL CHECK (Flight_licence_required BETWEEN 1 AND 5),
    speed INT NOT NULL CHECK (speed > 0),
    magic_component VARCHAR(120) NOT NULL,
    PRIMARY KEY (id_balai),
    FOREIGN KEY (id_balai) REFERENCES BALAI(id_balai)
);

-- Table EMPLOYEE
CREATE TABLE EMPLOYEE (
    id_employee BIGINT NOT NULL AUTO_INCREMENT,
    login VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(120) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    name VARCHAR(120) NOT NULL,
    surname VARCHAR(120) NOT NULL,
    mail_pro VARCHAR(120) NOT NULL UNIQUE,
    is_patron BOOLEAN NOT NULL DEFAULT FALSE,
    id_patron BIGINT NULL,
    PRIMARY KEY (id_employee),
    FOREIGN KEY (id_patron) REFERENCES EMPLOYEE(id_employee)
);

-- Table CLIENT (parent)
CREATE TABLE CLIENT (
    id_client BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    surname VARCHAR(120) NOT NULL,
    birth_date DATE NOT NULL,
    money DECIMAL(10,2) NOT NULL CHECK (money >= 0),
    type_client ENUM('moldu', 'sorcier') NOT NULL,
    id_employee BIGINT NOT NULL,
    PRIMARY KEY (id_client),
    FOREIGN KEY (id_employee) REFERENCES EMPLOYEE(id_employee)
);

-- Téléphones des clients (normalisation)
CREATE TABLE TELEPHONE_CLIENT (
    id_telephone BIGINT NOT NULL AUTO_INCREMENT,
    id_client BIGINT NOT NULL,
    numero VARCHAR(20) NOT NULL,
    PRIMARY KEY (id_telephone),
    FOREIGN KEY (id_client) REFERENCES CLIENT(id_client)
);

-- Table MOLDU
CREATE TABLE MOLDU (
    id_client BIGINT NOT NULL,
    National_register_number BIGINT NOT NULL UNIQUE,
    Mail VARCHAR(120) NOT NULL,
    Add_Street VARCHAR(120) NOT NULL,
    Add_City VARCHAR(120) NOT NULL,
    Add_House_number VARCHAR(10) NOT NULL,
    Add_Country VARCHAR(120) NOT NULL,
    PRIMARY KEY (id_client),
    FOREIGN KEY (id_client) REFERENCES CLIENT(id_client)
);

-- Table SORCIER
CREATE TABLE SORCIER (
    id_client BIGINT NOT NULL,
    Wizard_registry_number BIGINT NOT NULL UNIQUE,
    Chimney VARCHAR(120) NOT NULL,
    Add_School_name VARCHAR(120) NOT NULL,
    Add_House VARCHAR(120) NOT NULL,
    Add_Country VARCHAR(120) NOT NULL,
    Flight_licence INT NOT NULL DEFAULT 0 CHECK (Flight_licence BETWEEN 0 AND 5),
    PRIMARY KEY (id_client),
    FOREIGN KEY (id_client) REFERENCES CLIENT(id_client)
);

-- Hiboux des sorciers (normalisation)
CREATE TABLE OWL_CLIENT (
    id_owl BIGINT NOT NULL AUTO_INCREMENT,
    id_client BIGINT NOT NULL,
    owl_number VARCHAR(20) NOT NULL,
    PRIMARY KEY (id_owl),
    FOREIGN KEY (id_client) REFERENCES SORCIER(id_client)
);

-- Table COMMANDE (parent)
CREATE TABLE COMMANDE (
    id_commande BIGINT NOT NULL AUTO_INCREMENT,
    type_commande ENUM('vente', 'location') NOT NULL,
    id_employee BIGINT NOT NULL,
    id_client BIGINT NOT NULL,
    command_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_commande),
    FOREIGN KEY (id_employee) REFERENCES EMPLOYEE(id_employee),
    FOREIGN KEY (id_client) REFERENCES CLIENT(id_client)
);

-- Table VENTE (sous-type)
CREATE TABLE VENTE (
    id_commande BIGINT NOT NULL,
    sale_date DATE NOT NULL,
    PRIMARY KEY (id_commande),
    FOREIGN KEY (id_commande) REFERENCES COMMANDE(id_commande)
);

-- Table LOCATION (sous-type)
CREATE TABLE LOCATION (
    id_commande BIGINT NOT NULL,
    begin_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actual_end_date DATE NULL,
    status ENUM('in progress', 'finished', 'pending') NOT NULL DEFAULT 'pending',
    PRIMARY KEY (id_commande),
    FOREIGN KEY (id_commande) REFERENCES COMMANDE(id_commande)
);

-- Table COMMANDE_FOURNISSEUR (achat stock)
CREATE TABLE COMMANDE_FOURNISSEUR (
    id_commande BIGINT NOT NULL AUTO_INCREMENT,
    status ENUM('Pending Approval', 'Pending', 'Processing', 'In transit', 'Cancelled') NOT NULL DEFAULT 'Pending',
    command_date DATE NOT NULL,
    expected_delivery_date DATE NOT NULL,
    actual_delivery_date DATE NULL,
    id_vendeur BIGINT NOT NULL,
    id_patron BIGINT NOT NULL,
    PRIMARY KEY (id_commande),
    FOREIGN KEY (id_vendeur) REFERENCES EMPLOYEE(id_employee),
    FOREIGN KEY (id_patron) REFERENCES EMPLOYEE(id_employee)
);

-- Tables de liaison DETAIL avec chaque type de commande
CREATE TABLE detail_fournisseur (
    id_detail BIGINT NOT NULL,
    id_commande_fournisseur BIGINT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_detail, id_commande_fournisseur),
    FOREIGN KEY (id_detail) REFERENCES DETAIL(id_detail),
    FOREIGN KEY (id_commande_fournisseur) REFERENCES COMMANDE_FOURNISSEUR(id_commande)
);

CREATE TABLE detail_vente (
    id_detail BIGINT NOT NULL,
    id_commande_vente BIGINT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_detail, id_commande_vente),
    FOREIGN KEY (id_detail) REFERENCES DETAIL(id_detail),
    FOREIGN KEY (id_commande_vente) REFERENCES VENTE(id_commande)
);

CREATE TABLE detail_location (
    id_detail BIGINT NOT NULL,
    id_commande_location BIGINT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_detail, id_commande_location),
    FOREIGN KEY (id_detail) REFERENCES DETAIL(id_detail),
    FOREIGN KEY (id_commande_location) REFERENCES LOCATION(id_commande)
);

-- =============================================
-- DONNÉES DE TEST
-- =============================================

-- FABRICANTS
INSERT INTO FABRICANT (name, Mail) VALUES
('Nimbus Racing Broom Co.', 'contact@nimbus.com'),
('Comet Trading Company', 'info@comet.com'),
('Firebolt Industries', 'sales@firebolt.com'),
('Cleansweep Broom Company', 'support@cleansweep.com');

-- DETAILS (prix unitaires)
INSERT INTO DETAIL (price) VALUES
(149.99), (299.99), (499.99), (89.99), (199.99), (59.99);

-- BALAIS
INSERT INTO BALAI (Libelle, description, img, uses_number, sale_price, location_price, wear, status, id_detail, id_fabricant) VALUES
('Nimbus 2000', 'Le classique des apprentis sorciers', '/img/nimbus2000.jpg', 120, 149.99, 15.99, 15, 'in stock', 1, 1),
('Nimbus 2001', 'Version améliorée, plus rapide', '/img/nimbus2001.jpg', 85, 299.99, 29.99, 8, 'in stock', 2, 1),
('Firebolt Supreme', 'Le plus rapide du marché', '/img/firebolt.jpg', 45, 499.99, 49.99, 5, 'in location', 3, 3),
('Comet 260', 'Idéal pour les compétitions', '/img/comet260.jpg', 200, 199.99, 19.99, 40, 'in stock', 5, 2),
('Cleansweep Seven', 'Bon rapport qualité/prix', '/img/cleansweep7.jpg', 310, 89.99, 9.99, 70, 'arriving', 4, 4),
('Nimbus Pro', 'Édition limitée', '/img/nimbuspro.jpg', 12, 399.99, 39.99, 2, 'in stock', 6, 1);

-- BALAIS MAGIQUES (extension)
INSERT INTO BALAI_MAGIQUE (id_balai, Flight_licence_required, speed, magic_component) VALUES
(1, 2, 180, 'Plume de phénix, bois de houx'),
(2, 3, 210, 'Plume de phénix, bois de chêne'),
(3, 5, 300, 'Queue de licorne, bois de sureau'),
(4, 2, 165, 'Crin de sirène, bois de frêne'),
(6, 4, 260, 'Cœur de dragon, bois d''ébène');

-- EMPLOYES
INSERT INTO EMPLOYEE (login, password, actif, name, surname, mail_pro, is_patron, id_patron) VALUES
('olivier_gerard', 'hash123', TRUE, 'Olivier', 'Gerard', 'olivier@magicbroom.com', TRUE, NULL),
('sophie_dupuis', 'hash456', TRUE, 'Sophie', 'Dupuis', 'sophie@magicbroom.com', FALSE, 1),
('thomas_leroy', 'hash789', TRUE, 'Thomas', 'Leroy', 'thomas@magicbroom.com', FALSE, 1),
('marie_caron', 'hashabc', FALSE, 'Marie', 'Caron', 'marie@magicbroom.com', FALSE, 1);

-- CLIENTS
INSERT INTO CLIENT (name, surname, birth_date, money, type_client, id_employee) VALUES
('Harry', 'Potter', '1980-07-31', 1250.00, 'sorcier', 2),
('Hermione', 'Granger', '1979-09-19', 2500.00, 'sorcier', 2),
('Ron', 'Weasley', '1980-03-01', 350.00, 'sorcier', 3),
('Drago', 'Malefoy', '1980-06-05', 5000.00, 'sorcier', 3),
('Dudley', 'Dursley', '1980-06-23', 120.00, 'moldu', 2),
('Vernon', 'Dursley', '1954-04-29', 800.00, 'moldu', 4);

-- TELEPHONES CLIENTS
INSERT INTO TELEPHONE_CLIENT (id_client, numero) VALUES
(5, '+32 471 12 34 56'),
(5, '+32 475 98 76 54'),
(6, '+44 20 7946 0123');

-- MOLDU
INSERT INTO MOLDU (id_client, National_register_number, Mail, Add_Street, Add_City, Add_House_number, Add_Country) VALUES
(5, 80062312345, 'dudley.dursley@privetdrive.com', 'Privet Drive', 'Little Whinging', '4', 'UK'),
(6, 54042998765, 'vernon.dursley@grunnings.com', 'Privet Drive', 'Little Whinging', '4', 'UK');

-- SORCIER
INSERT INTO SORCIER (id_client, Wizard_registry_number, Chimney, Add_School_name, Add_House, Add_Country, Flight_licence) VALUES
(1, 1234567, 'Cheminée de Poudlard', 'Hogwarts', 'Gryffindor', 'UK', 4),
(2, 7654321, 'Cheminée de Poudlard', 'Hogwarts', 'Gryffindor', 'UK', 5),
(3, 1122334, 'Cheminée du Terrier', 'Hogwarts', 'Gryffindor', 'UK', 2),
(4, 4433221, 'Cheminée de Malefoy', 'Hogwarts', 'Slytherin', 'UK', 5);

-- OWLS (hiboux)
INSERT INTO OWL_CLIENT (id_client, owl_number) VALUES
(1, 'Hedwige#001'),
(1, 'Hedwige#002'),
(2, 'Hermes#001'),
(3, 'Errol#001'),
(4, 'Ulysse#001');

-- COMMANDES
INSERT INTO COMMANDE (type_commande, id_employee, id_client, command_date) VALUES
('vente', 2, 1, '2025-01-10 14:30:00'),
('location', 3, 2, '2025-01-15 09:15:00'),
('vente', 2, 3, '2025-02-01 11:45:00'),
('location', 2, 4, '2025-02-10 16:20:00'),
('vente', 4, 5, '2025-03-01 10:00:00');

-- VENTES
INSERT INTO VENTE (id_commande, sale_date) VALUES
(1, '2025-01-10'),
(3, '2025-02-01'),
(5, '2025-03-01');

-- LOCATIONS
INSERT INTO LOCATION (id_commande, begin_date, end_date, actual_end_date, status) VALUES
(2, '2025-01-15', '2025-01-30', '2025-01-28', 'finished'),
(4, '2025-02-10', '2025-02-25', NULL, 'in progress');

-- COMMANDES FOURNISSEURS
INSERT INTO COMMANDE_FOURNISSEUR (status, command_date, expected_delivery_date, actual_delivery_date, id_vendeur, id_patron) VALUES
('Finished', '2025-01-05', '2025-01-20', '2025-01-18', 2, 1),
('In transit', '2025-02-10', '2025-02-25', NULL, 3, 1),
('Pending Approval', '2025-03-01', '2025-03-15', NULL, 2, 1);

-- DETAILS liés aux commandes
INSERT INTO detail_fournisseur (id_detail, id_commande_fournisseur, quantite) VALUES
(1, 1, 10),
(2, 1, 5),
(3, 2, 3);

INSERT INTO detail_vente (id_detail, id_commande_vente, quantite) VALUES
(1, 1, 1),
(3, 3, 1),
(5, 5, 2);

INSERT INTO detail_location (id_detail, id_commande_location, quantite) VALUES
(2, 2, 1),
(4, 4, 1);

-- =============================================
-- FIN
-- =============================================