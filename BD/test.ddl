-- *********************************************
-- * Standard SQL generation                   
-- *--------------------------------------------
-- * DB-MAIN version: 11.0.2              
-- * Generator date: Sep 14 2021               
-- * Generation date: Fri May  1 11:16:01 2026 
-- ********************************************* 

-- Database Section
-- ________________ 

CREATE DATABASE IF NOT EXISTS bdd;
USE bdd;

-- Tables Section
-- _____________ 

CREATE TABLE IF NOT EXISTS FABRICANT (
     id_fabricant BIGINT NOT NULL AUTO_INCREMENT,
     name VARCHAR(120) NOT NULL,
     Mail VARCHAR(120) NOT NULL,
     CONSTRAINT ID_FABRICANT_ID PRIMARY KEY (id_fabricant)
);

CREATE TABLE IF NOT EXISTS EMPLOYEE (
     id_employee BIGINT NOT NULL AUTO_INCREMENT,
     login VARCHAR(120) NOT NULL,
     password VARCHAR(120) NOT NULL,
     actif CHAR(1) NOT NULL,
     name VARCHAR(120) NOT NULL,
     surname VARCHAR(120) NOT NULL,
     mail_pro VARCHAR(120) NOT NULL,
     tel1 VARCHAR(16) NOT NULL,
     tel2 VARCHAR(16),
     tel3 VARCHAR(16),
     id_patron BIGINT,
     CONSTRAINT ID_EMPLOYEE_ID PRIMARY KEY (id_employee),
     CONSTRAINT SID_EMPLOYEE_1_ID UNIQUE (login),
     CONSTRAINT SID_EMPLOYEE_ID UNIQUE (mail_pro)
);

CREATE TABLE IF NOT EXISTS CLIENT (
     id_client BIGINT NOT NULL AUTO_INCREMENT,
     name VARCHAR(120) NOT NULL,
     surname VARCHAR(120) NOT NULL,
     birth_date DATE NOT NULL,
     money DECIMAL(10,2) NOT NULL,
     id_employee BIGINT NOT NULL,
     SORCIER BIGINT,
     MOLDU BIGINT,
     CONSTRAINT ID_CLIENT_ID PRIMARY KEY (id_client)
);

CREATE TABLE IF NOT EXISTS COMMANDE_FOURNISSEUR (
     id_commande BIGINT NOT NULL AUTO_INCREMENT,
     status VARCHAR(120) NOT NULL COMMENT 'Peut prendre les valeurs :   - Pending Approuval - Pending  - Processing - In transit - Cancelled - Finished',
     command_date DATE,
     expected_delivery_date DATE,
     actual_delivery_date DATE,
     id_vendeur BIGINT NOT NULL,
     id_patron BIGINT NOT NULL,
     CONSTRAINT ID_COMMANDE_FOURNISSEUR_ID PRIMARY KEY (id_commande)
);

CREATE TABLE IF NOT EXISTS COMMANDE (
     id_commande BIGINT NOT NULL AUTO_INCREMENT,
     id_employee BIGINT NOT NULL,
     id_client BIGINT NOT NULL,
     VENTE BIGINT,
     LOCATION BIGINT,
     CONSTRAINT ID_COMMANDE_ID PRIMARY KEY (id_commande)
);

CREATE TABLE IF NOT EXISTS VENTE (
     id_commande BIGINT NOT NULL,
     sale_date DATE NOT NULL,
     CONSTRAINT ID_VENTE_COMMA_ID PRIMARY KEY (id_commande)
);

CREATE TABLE IF NOT EXISTS LOCATION (
     id_commande BIGINT NOT NULL,
     begin_date DATE NOT NULL,
     end_date DATE NOT NULL,
     actual_end_date DATE,
     status VARCHAR(120) NOT NULL COMMENT 'valeurs_possible :   - in progress - finished - Pending',
     CONSTRAINT ID_LOCAT_COMMA_ID PRIMARY KEY (id_commande)
);

CREATE TABLE IF NOT EXISTS BALAI (
     id_balai BIGINT NOT NULL AUTO_INCREMENT,
     Libelle VARCHAR(120) NOT NULL COMMENT 'Intitulé du produit ( son modèle )',
     description VARCHAR(120) NOT NULL COMMENT 'Petite description accrocheuse du produit',
     img VARCHAR(120) NOT NULL COMMENT 'chemin vers l''image du balai',
     uses_number DECIMAL(10) NOT NULL,
     sale_price DECIMAL(10,2) NOT NULL,
     location_price DECIMAL(10,2) NOT NULL,
     purchase_price DECIMAL(10,2) NOT NULL,
     wear DECIMAL(3) NOT NULL COMMENT 'usure du balai en %',
     status VARCHAR(120) NOT NULL COMMENT 'valeurs_possible :   - in location - in stock - arriving',
     id_commande_fournisseur BIGINT NOT NULL,
     id_vente BIGINT,
     id_fabricant BIGINT NOT NULL,
     BALAI_MAGIQUE BIGINT,
     CONSTRAINT ID_BALAI_ID PRIMARY KEY (id_balai)
);

CREATE TABLE IF NOT EXISTS BALAI_MAGIQUE (
     id_balai BIGINT NOT NULL,
     Flight_licence_required DECIMAL(1) NOT NULL COMMENT 'from level 1 - 5',
     speed DECIMAL(3) NOT NULL,
     magic_component VARCHAR(120) NOT NULL COMMENT 'list of the magic component of the broom',
     CONSTRAINT ID_BALAI_BALAI_ID PRIMARY KEY (id_balai)
);

CREATE TABLE IF NOT EXISTS MOLDU (
     id_client BIGINT NOT NULL,
     National_register_number DECIMAL(10) NOT NULL,
     Mail VARCHAR(120) NOT NULL,
     Add_Street VARCHAR(120) NOT NULL,
     Add_City VARCHAR(120) NOT NULL,
     Add_House_number CHAR(4) NOT NULL COMMENT 'char for the letter of the mailbox in apartment',
     Add_Country VARCHAR(120) NOT NULL,
     tel1 VARCHAR(16) NOT NULL,
     tel2 VARCHAR(16),
     tel3 VARCHAR(16),
     CONSTRAINT SID_MOLDU_ID UNIQUE (National_register_number),
     CONSTRAINT ID_MOLDU_CLIEN_ID PRIMARY KEY (id_client)
);

CREATE TABLE IF NOT EXISTS SORCIER (
     id_client BIGINT NOT NULL,
     Wizard_registry_number DECIMAL(10) NOT NULL,
     Chimney VARCHAR(120) NOT NULL COMMENT 'Represent the mail of the Moldu',
     Add_School_name VARCHAR(120) NOT NULL COMMENT 'Peut prendre les valeurs :  - Hogwarts  - Beauxbâtons  - ...',
     Add_House VARCHAR(120) NOT NULL COMMENT 'ex :  - Griffundor - Slitherin - ...',
     Add_Country VARCHAR(120) NOT NULL,
     Flight_licence DECIMAL(1) NOT NULL COMMENT '0 = no licence',
     Owls_number1 VARCHAR(16) NOT NULL COMMENT 'Equivalent au numéro de telephone mais pour les sorciers',
     Owls_number2 VARCHAR(16) COMMENT 'Equivalent au numéro de telephone mais pour les sorciers',
     Owls_number3 VARCHAR(16) COMMENT 'Equivalent au numéro de telephone mais pour les sorciers',
     CONSTRAINT SID_SORCIER_ID UNIQUE (Wizard_registry_number),
     CONSTRAINT ID_SORCI_CLIEN_ID PRIMARY KEY (id_client)
);

CREATE TABLE IF NOT EXISTS DETAIL_LOCATION (
     id_location BIGINT NOT NULL,
     id_balai BIGINT NOT NULL,
     CONSTRAINT ID_DETAIL_LOCATION_ID PRIMARY KEY (id_balai, id_location)
);

-- Constraints Section
-- ___________________ 

-- BALAI Constraints --

ALTER TABLE BALAI ADD CONSTRAINT REF_BALAI_FABRI_FK
     FOREIGN KEY (id_fabricant)
     REFERENCES FABRICANT(id_fabricant);

ALTER TABLE BALAI ADD CONSTRAINT EQU_BALAI_COMMA_FK
     FOREIGN KEY (id_commande_fournisseur)
     REFERENCES COMMANDE_FOURNISSEUR(id_commande);

ALTER TABLE BALAI ADD CONSTRAINT EQU_BALAI_VENTE_FK
     FOREIGN KEY (id_vente)
     REFERENCES VENTE(id_commande);

ALTER TABLE BALAI ADD CONSTRAINT check_balai_uses
     CHECK (uses_number >= 0);

ALTER TABLE BALAI ADD CONSTRAINT check_balai_prices
     CHECK (sale_price >= 0 AND location_price >= 0 AND purchase_price > 0 AND sale_price > purchase_price);

ALTER TABLE BALAI ADD CONSTRAINT check_balai_wear
     CHECK (wear BETWEEN 0 AND 100);

ALTER TABLE BALAI ADD CONSTRAINT check_balai_status
     CHECK (status IN ('in location', 'in stock', 'arriving', 'sold'));

-- BALAI_MAGIQUE Constraints --

ALTER TABLE BALAI_MAGIQUE ADD CONSTRAINT ID_BALAI_BALAI_FK
     FOREIGN KEY (id_balai)
     REFERENCES BALAI(id_balai);

ALTER TABLE BALAI_MAGIQUE ADD CONSTRAINT check_balai_magique_flight_licence_required
     CHECK (Flight_licence_required BETWEEN 1 AND 5);

ALTER TABLE BALAI_MAGIQUE ADD CONSTRAINT check_balai_magique_speed
     CHECK (speed > 0);

-- CLIENT Constraints --

ALTER TABLE CLIENT ADD CONSTRAINT LSTONE_CLIENT
     CHECK(SORCIER IS NOT NULL OR MOLDU IS NOT NULL); 

ALTER TABLE CLIENT ADD CONSTRAINT REF_CLIEN_EMPLO_FK
     FOREIGN KEY (id_employee)
     REFERENCES EMPLOYEE(id_employee);

ALTER TABLE CLIENT ADD CONSTRAINT check_client_money
     CHECK (money >= 0);

-- COMMANDE Constraints --

ALTER TABLE COMMANDE ADD CONSTRAINT EXTONE_COMMANDE
     CHECK((VENTE IS NOT NULL AND `LOCATION` IS NULL)
          OR (VENTE IS NULL AND `LOCATION` IS NOT NULL)); 

ALTER TABLE COMMANDE ADD CONSTRAINT REF_COMMA_EMPLO_2_FK
     FOREIGN KEY (id_employee)
     REFERENCES EMPLOYEE(id_employee);

ALTER TABLE COMMANDE ADD CONSTRAINT REF_COMMA_CLIEN_FK
     FOREIGN KEY (id_client)
     REFERENCES CLIENT(id_client);

-- COMMANDE_FOURNISSEUR Constraints --
-- Note: CHECK with subquery removed, handled by triggers instead

ALTER TABLE COMMANDE_FOURNISSEUR ADD CONSTRAINT REF_COMMA_EMPLO_1_FK
     FOREIGN KEY (id_vendeur)
     REFERENCES EMPLOYEE(id_employee);

ALTER TABLE COMMANDE_FOURNISSEUR ADD CONSTRAINT REF_COMMA_EMPLO_FK
     FOREIGN KEY (id_patron)
     REFERENCES EMPLOYEE(id_employee);

ALTER TABLE COMMANDE_FOURNISSEUR ADD CONSTRAINT check_commande_fournisseur_status
     CHECK (status IN ('Pending Approuval', 'Finished', 'Pending', 'Processing', 'In transit', 'Cancelled'));

ALTER TABLE COMMANDE_FOURNISSEUR ADD CONSTRAINT check_commande_fournisseur_correct_date
     CHECK (expected_delivery_date >= command_date AND 
          actual_delivery_date >= command_date);

ALTER TABLE COMMANDE_FOURNISSEUR ADD CONSTRAINT check_commande_fournisseur_initialize_date
     CHECK ((command_date IS NOT NULL AND expected_delivery_date IS NOT NULL)
          OR command_date IS NULL);

ALTER TABLE COMMANDE_FOURNISSEUR ADD CONSTRAINT check_commande_fournisseur_initialize_actual_date
     CHECK ((expected_delivery_date IS NOT NULL AND actual_delivery_date IS NOT NULL)
          OR actual_delivery_date IS NULL);

-- EMPLOYEE Constraints --

ALTER TABLE EMPLOYEE ADD CONSTRAINT REF_EMPLO_EMPLO_FK
     FOREIGN KEY (id_patron)
     REFERENCES EMPLOYEE(id_employee);

ALTER TABLE EMPLOYEE ADD CONSTRAINT check_employee_nb_phone
     CHECK ((tel2 IS NOT NULL AND tel3 IS NOT NULL) OR tel3 IS NULL);

-- LOCATION Constraints --
-- Note: CHECK with subquery removed, handled by triggers instead

ALTER TABLE `LOCATION` ADD CONSTRAINT ID_LOCAT_COMMA_FK
     FOREIGN KEY (id_commande)
     REFERENCES COMMANDE(id_commande);

ALTER TABLE `LOCATION` ADD CONSTRAINT check_location_begin_date
     CHECK (end_date >= begin_date);

ALTER TABLE `LOCATION` ADD CONSTRAINT check_location_actual_end
     CHECK (actual_end_date >= begin_date); 

ALTER TABLE `LOCATION` ADD CONSTRAINT check_location_status
     CHECK (status IN ('in Progress', 'Finished', 'Pending'));

-- MOLDU Constraints --

ALTER TABLE MOLDU ADD CONSTRAINT ID_MOLDU_CLIEN_FK
     FOREIGN KEY (id_client)
     REFERENCES CLIENT(id_client);

ALTER TABLE MOLDU ADD CONSTRAINT check_moldu_nb_phone
     CHECK ((tel2 IS NOT NULL AND tel3 IS NOT NULL) OR tel3 IS NULL);

-- DETAIL_LOCATION Constraints --

ALTER TABLE DETAIL_LOCATION ADD CONSTRAINT REF_DETAI_BALAI
     FOREIGN KEY (id_balai)
     REFERENCES BALAI(id_balai);

ALTER TABLE DETAIL_LOCATION ADD CONSTRAINT EQU_DETAI_LOCAT_FK
     FOREIGN KEY (id_location)
     REFERENCES `LOCATION`(id_commande);

-- SORCIER Constraints --

ALTER TABLE SORCIER ADD CONSTRAINT ID_SORCI_CLIEN_FK
     FOREIGN KEY (id_client)
     REFERENCES CLIENT(id_client);

ALTER TABLE SORCIER ADD CONSTRAINT check_sorcier_flight_license
     CHECK (Flight_licence BETWEEN 0 AND 5);

ALTER TABLE SORCIER ADD CONSTRAINT check_sorcier_nb_owl
     CHECK ((Owls_number2 IS NOT NULL AND Owls_number3 IS NOT NULL) OR Owls_number3 IS NULL);

-- VENTE Constraints --
-- Note: CHECK with subquery removed, handled by triggers instead

ALTER TABLE VENTE ADD CONSTRAINT ID_VENTE_COMMA_FK
     FOREIGN KEY (id_commande)
     REFERENCES COMMANDE(id_commande);

-- Index Section
-- _____________ 

CREATE UNIQUE INDEX ID_BALAI_IND ON BALAI (id_balai);
CREATE INDEX REF_BALAI_FABRI_IND ON BALAI (id_fabricant);
CREATE INDEX EQU_BALAI_COMMA_IND ON BALAI (id_commande_fournisseur);
CREATE INDEX EQU_BALAI_VENTE_IND ON BALAI (id_vente);
CREATE UNIQUE INDEX ID_BALAI_BALAI_IND ON BALAI_MAGIQUE (id_balai);
CREATE UNIQUE INDEX ID_CLIENT_IND ON CLIENT (id_client);
CREATE INDEX REF_CLIEN_EMPLO_IND ON CLIENT (id_employee);
CREATE UNIQUE INDEX ID_COMMANDE_IND ON COMMANDE (id_commande);
CREATE INDEX REF_COMMA_EMPLO_2_IND ON COMMANDE (id_employee);
CREATE INDEX REF_COMMA_CLIEN_IND ON COMMANDE (id_client);
CREATE UNIQUE INDEX ID_COMMANDE_FOURNISSEUR_IND ON COMMANDE_FOURNISSEUR (id_commande);
CREATE INDEX REF_COMMA_EMPLO_1_IND ON COMMANDE_FOURNISSEUR (id_vendeur);
CREATE INDEX REF_COMMA_EMPLO_IND ON COMMANDE_FOURNISSEUR (id_patron);
CREATE UNIQUE INDEX ID_EMPLOYEE_IND ON EMPLOYEE (id_employee);
CREATE UNIQUE INDEX SID_EMPLOYEE_1_IND ON EMPLOYEE (login);
CREATE UNIQUE INDEX SID_EMPLOYEE_IND ON EMPLOYEE (mail_pro);
CREATE INDEX REF_EMPLO_EMPLO_IND ON EMPLOYEE (id_patron);
CREATE UNIQUE INDEX ID_FABRICANT_IND ON FABRICANT (id_fabricant);
CREATE UNIQUE INDEX ID_LOCAT_COMMA_IND ON `LOCATION` (id_commande);
CREATE UNIQUE INDEX SID_MOLDU_IND ON MOLDU (National_register_number);
CREATE UNIQUE INDEX ID_MOLDU_CLIEN_IND ON MOLDU (id_client);
CREATE UNIQUE INDEX ID_DETAIL_LOCATION_IND ON DETAIL_LOCATION (id_balai, id_location);
CREATE INDEX EQU_DETAI_LOCAT_IND ON DETAIL_LOCATION (id_location);
CREATE UNIQUE INDEX SID_SORCIER_IND ON SORCIER (Wizard_registry_number);
CREATE UNIQUE INDEX ID_SORCI_CLIEN_IND ON SORCIER (id_client);
CREATE UNIQUE INDEX ID_VENTE_COMMA_IND ON VENTE (id_commande);

-- Trigger Section 
-- _______________ 

DELIMITER //

-- BALAI --

DROP TRIGGER IF EXISTS set_default//
CREATE TRIGGER set_default
BEFORE INSERT ON balai
FOR EACH ROW
BEGIN
     IF NEW.wear IS NULL THEN SET NEW.wear = 0; END IF;
     IF NEW.uses_number IS NULL THEN SET NEW.uses_number = 0; END IF;
     IF NEW.status IS NULL THEN SET NEW.status = 'new'; END IF;
END//

DROP TRIGGER IF EXISTS validate_broom_prices//
CREATE TRIGGER validate_broom_prices
BEFORE INSERT ON balai
FOR EACH ROW 
BEGIN
     IF NEW.sale_price < 0 OR NEW.location_price < 0 OR NEW.purchase_price < 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Prices must be positive';
     END IF;

     IF NEW.location_price > NEW.sale_price THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Location price cannot be higher than sale price';
     END IF;

     IF NEW.sale_price > NEW.purchase_price THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Sale price cannot be higher than purchase price';
     END IF;
END//

DROP TRIGGER IF EXISTS update_wear//
CREATE TRIGGER update_wear
BEFORE UPDATE ON balai
FOR EACH ROW
BEGIN
     IF NEW.uses_number > OLD.uses_number THEN
          SET NEW.wear = OLD.wear + (NEW.uses_number - OLD.uses_number);
     END IF;
END//

DROP TRIGGER IF EXISTS block_unusable_broom//
CREATE TRIGGER block_unusable_broom
BEFORE UPDATE ON balai
FOR EACH ROW
BEGIN
     IF OLD.status = "Unusable" AND NEW.uses_number > OLD.uses_number THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Cannot use an unusable broom';
     END IF;
END//

DROP TRIGGER IF EXISTS sale_price_reduction//
CREATE TRIGGER sale_price_reduction
BEFORE UPDATE ON balai
FOR EACH ROW
BEGIN
     IF NEW.wear > OLD.wear THEN
          SET NEW.sale_price = OLD.sale_price * 0.99;
     END IF;
END//

-- BALAI MAGIQUE --

DROP TRIGGER IF EXISTS base_broom_existence//
CREATE TRIGGER base_broom_existence
BEFORE INSERT ON balai_magique
FOR EACH ROW
BEGIN
     IF NOT EXISTS (
          SELECT 1 FROM balai 
          WHERE id_balai = NEW.id_balai
     ) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Base broom does not exist';
     END IF;
END//

-- FABRICANT --

DROP TRIGGER IF EXISTS normalize_data//
CREATE TRIGGER normalize_data
BEFORE INSERT ON fabricant
FOR EACH ROW
BEGIN
     SET NEW.name = UPPER(NEW.name);
     SET NEW.mail = LOWER(NEW.mail);
END//

DROP TRIGGER IF EXISTS validate_email//
CREATE TRIGGER validate_email
BEFORE INSERT ON fabricant
FOR EACH ROW
BEGIN
     IF NEW.mail NOT LIKE '%@%.%' THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Invalid email format';
     END IF;
END//

DROP TRIGGER IF EXISTS prevent_deletion_active_producer//
CREATE TRIGGER prevent_deletion_active_producer
BEFORE DELETE ON fabricant
FOR EACH ROW
BEGIN
     IF EXISTS (
          SELECT 1 FROM balai 
          WHERE id_fabricant = OLD.id_fabricant
     ) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Cannot delete a producer with active brooms';
     END IF;
END//

-- CLIENT --

DROP TRIGGER IF EXISTS trigger_check_age//
CREATE TRIGGER trigger_check_age
BEFORE INSERT ON CLIENT
FOR EACH ROW
BEGIN
     IF NEW.birth_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de naissance ne peut pas être dans le futur.';
     END IF;

     IF TIMESTAMPDIFF(YEAR, NEW.birth_date, CURDATE()) < 11 THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Client must be at least 11 years old';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_age_update//
CREATE TRIGGER trigger_check_age_update
BEFORE UPDATE ON CLIENT
FOR EACH ROW
BEGIN
     IF NEW.birth_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de naissance ne peut pas être dans le futur.';
     END IF;

     IF TIMESTAMPDIFF(YEAR, NEW.birth_date, CURDATE()) < 11 THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Client must be at least 11 years old';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_client_money_lvl//
CREATE TRIGGER trigger_check_client_money_lvl
BEFORE INSERT ON CLIENT
FOR EACH ROW
BEGIN
     IF NEW.money < 0 THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Le solde du client ne peut pas être négatif.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_client_money_lvl_update//
CREATE TRIGGER trigger_check_client_money_lvl_update
BEFORE UPDATE ON CLIENT
FOR EACH ROW
BEGIN
     IF NEW.money < 0 THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Le solde du client ne peut pas être négatif.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_moldu_and_sorcier_not_null//
CREATE TRIGGER trigger_check_moldu_and_sorcier_not_null
BEFORE INSERT ON CLIENT
FOR EACH ROW
BEGIN
     IF (NEW.SORCIER IS NULL AND NEW.MOLDU IS NULL) THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Un client doit être soit sorcier, soit moldu (ou les deux)';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_moldu_and_sorcier_not_null_update//
CREATE TRIGGER trigger_check_moldu_and_sorcier_not_null_update
BEFORE UPDATE ON CLIENT
FOR EACH ROW
BEGIN
     IF (NEW.SORCIER IS NULL AND NEW.MOLDU IS NULL) THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Un client doit être soit sorcier, soit moldu (ou les deux)';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_modify_sorcier_to_null_update//
CREATE TRIGGER trigger_check_modify_sorcier_to_null_update
BEFORE UPDATE ON CLIENT
FOR EACH ROW
BEGIN
     DECLARE has_magic_broom_orders INT;
     
     IF OLD.SORCIER IS NOT NULL AND NEW.SORCIER IS NULL THEN
          SELECT COUNT(*) INTO has_magic_broom_orders
          FROM COMMANDE c
          INNER JOIN DETAIL_LOCATION dl ON dl.id_location = c.`LOCATION`
          INNER JOIN BALAI b ON dl.id_balai = b.id_balai
          INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
          WHERE c.id_client = NEW.id_client;
          
          IF has_magic_broom_orders > 0 THEN
               SIGNAL SQLSTATE '45000' 
               SET MESSAGE_TEXT = 'Impossible de changer le type d''un client ayant des commandes de balais magiques';
          END IF;
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_client_before_delete//
CREATE TRIGGER trigger_client_before_delete
BEFORE DELETE ON CLIENT
FOR EACH ROW
BEGIN
     DECLARE command_count INT;
     
     SELECT COUNT(*) INTO command_count
     FROM COMMANDE
     WHERE id_client = OLD.id_client;
     
     IF command_count > 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Impossible de supprimer un client qui a des commandes.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_client_before_update_id//
CREATE TRIGGER trigger_client_before_update_id
BEFORE UPDATE ON CLIENT
FOR EACH ROW
BEGIN
     IF OLD.id_client != NEW.id_client THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La modification de l''identifiant client est interdite.';
     END IF;
END//

-- COMMANDE --

DROP TRIGGER IF EXISTS trigger_check_commande_type//
CREATE TRIGGER trigger_check_commande_type
BEFORE INSERT ON COMMANDE
FOR EACH ROW
BEGIN
     IF (NEW.VENTE IS NULL AND NEW.`LOCATION` IS NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Une commande doit être soit une vente, soit une location.';
     END IF;
     
     IF (NEW.VENTE IS NOT NULL AND NEW.`LOCATION` IS NOT NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Une commande ne peut pas être à la fois une vente et une location.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_commande_type_update//
CREATE TRIGGER trigger_check_commande_type_update
BEFORE UPDATE ON COMMANDE
FOR EACH ROW
BEGIN
     IF (NEW.VENTE IS NULL AND NEW.`LOCATION` IS NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Une commande doit être soit une vente, soit une location.';
     END IF;
     
     IF (NEW.VENTE IS NOT NULL AND NEW.`LOCATION` IS NOT NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Une commande ne peut pas être à la fois une vente et une location.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_commande_foreign_keys//
CREATE TRIGGER trigger_check_commande_foreign_keys
BEFORE INSERT ON COMMANDE
FOR EACH ROW
BEGIN
     DECLARE employee_exists INT;
     DECLARE client_exists INT;
     
     SELECT COUNT(*) INTO employee_exists FROM EMPLOYEE WHERE id_employee = NEW.id_employee;
     IF employee_exists = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'L''employé référencé n''existe pas.';
     END IF;
     
     SELECT COUNT(*) INTO client_exists FROM CLIENT WHERE id_client = NEW.id_client;
     IF client_exists = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le client référencé n''existe pas.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_commande_foreign_keys_update//
CREATE TRIGGER trigger_check_commande_foreign_keys_update
BEFORE UPDATE ON COMMANDE
FOR EACH ROW
BEGIN
     DECLARE employee_exists INT;
     DECLARE client_exists INT;
     
     SELECT COUNT(*) INTO employee_exists FROM EMPLOYEE WHERE id_employee = NEW.id_employee;
     IF employee_exists = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'L''employé référencé n''existe pas.';
     END IF;
     
     SELECT COUNT(*) INTO client_exists FROM CLIENT WHERE id_client = NEW.id_client;
     IF client_exists = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le client référencé n''existe pas.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_if_can_commande_magical_broom//
CREATE TRIGGER trigger_check_if_can_commande_magical_broom
BEFORE INSERT ON COMMANDE
FOR EACH ROW
BEGIN
     DECLARE client_sorcier INT;
     DECLARE has_magical_broom INT;
     
     SELECT COUNT(*) INTO client_sorcier 
     FROM CLIENT 
     WHERE id_client = NEW.id_client AND SORCIER IS NOT NULL;
     
     IF client_sorcier = 0 THEN
          IF NEW.VENTE IS NOT NULL THEN
               SELECT COUNT(*) INTO has_magical_broom
               FROM BALAI b
               INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
               WHERE b.id_vente = NEW.VENTE;
               
               IF has_magical_broom > 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Un Moldu ne peut pas acheter un balai magique. Seuls les sorciers peuvent posséder des balais magiques.';
               END IF;
          END IF;
          
          IF NEW.`LOCATION` IS NOT NULL THEN
               SELECT COUNT(*) INTO has_magical_broom
               FROM DETAIL_LOCATION dl
               INNER JOIN BALAI b ON dl.id_balai = b.id_balai
               INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
               WHERE dl.id_location = NEW.`LOCATION`;
               
               IF has_magical_broom > 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Un Moldu ne peut pas louer un balai magique. Seuls les sorciers peuvent utiliser des balais magiques.';
               END IF;
          END IF;
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_if_can_commande_magical_broom_update//
CREATE TRIGGER trigger_check_if_can_commande_magical_broom_update
BEFORE UPDATE ON COMMANDE
FOR EACH ROW
BEGIN
     DECLARE client_sorcier INT;
     DECLARE has_magical_broom INT;
     
     SELECT COUNT(*) INTO client_sorcier 
     FROM CLIENT 
     WHERE id_client = NEW.id_client AND SORCIER IS NOT NULL;
     
     IF client_sorcier = 0 THEN
          IF NEW.VENTE IS NOT NULL THEN
               SELECT COUNT(*) INTO has_magical_broom
               FROM BALAI b
               INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
               WHERE b.id_vente = NEW.VENTE;
               
               IF has_magical_broom > 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Un Moldu ne peut pas acheter un balai magique. Seuls les sorciers peuvent posséder des balais magiques.';
               END IF;
          END IF;
          
          IF NEW.`LOCATION` IS NOT NULL THEN
               SELECT COUNT(*) INTO has_magical_broom
               FROM DETAIL_LOCATION dl
               INNER JOIN BALAI b ON dl.id_balai = b.id_balai
               INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
               WHERE dl.id_location = NEW.`LOCATION`;
               
               IF has_magical_broom > 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Un Moldu ne peut pas louer un balai magique. Seuls les sorciers peuvent utiliser des balais magiques.';
               END IF;
          END IF;
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_commande_before_delete//
CREATE TRIGGER trigger_commande_before_delete
BEFORE DELETE ON COMMANDE
FOR EACH ROW
BEGIN
     DECLARE detail_count INT;
     
     IF OLD.`LOCATION` IS NOT NULL THEN
          SELECT COUNT(*) INTO detail_count
          FROM DETAIL_LOCATION
          WHERE id_location = OLD.`LOCATION`;
          
          IF detail_count > 0 THEN
               SIGNAL SQLSTATE '45000'
               SET MESSAGE_TEXT = 'Impossible de supprimer une commande de location qui a des balais associés.';
          END IF;
     END IF;
     
     IF OLD.VENTE IS NOT NULL THEN
          SELECT COUNT(*) INTO detail_count
          FROM BALAI
          WHERE id_vente = OLD.VENTE;
          
          IF detail_count > 0 THEN
               SIGNAL SQLSTATE '45000'
               SET MESSAGE_TEXT = 'Impossible de supprimer une commande de vente qui a des balais associés.';
          END IF;
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_commande_before_update_id//
CREATE TRIGGER trigger_commande_before_update_id
BEFORE UPDATE ON COMMANDE
FOR EACH ROW
BEGIN
     IF OLD.id_commande != NEW.id_commande THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La modification de l''identifiant commande est interdite.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_commande_before_update_type//
CREATE TRIGGER trigger_commande_before_update_type
BEFORE UPDATE ON COMMANDE
FOR EACH ROW
BEGIN
     IF (OLD.VENTE IS NOT NULL AND NEW.VENTE IS NULL) OR
          (OLD.VENTE IS NULL AND NEW.VENTE IS NOT NULL) OR
          (OLD.`LOCATION` IS NOT NULL AND NEW.`LOCATION` IS NULL) OR
          (OLD.`LOCATION` IS NULL AND NEW.`LOCATION` IS NOT NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Impossible de changer le type d''une commande (vente/location) après création.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_commande_after_delete//
CREATE TRIGGER trigger_commande_after_delete
AFTER DELETE ON COMMANDE
FOR EACH ROW
BEGIN
     IF OLD.VENTE IS NOT NULL THEN
          DELETE FROM VENTE WHERE id_commande = OLD.VENTE;
     END IF;
     
     IF OLD.`LOCATION` IS NOT NULL THEN
          DELETE FROM `LOCATION` WHERE id_commande = OLD.`LOCATION`;
     END IF;
END//

-- LOCATION --

DROP TRIGGER IF EXISTS trigger_check_location_dates//
CREATE TRIGGER trigger_check_location_dates
BEFORE INSERT ON `LOCATION`
FOR EACH ROW
BEGIN
     IF NEW.end_date < NEW.begin_date THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de fin doit être postérieure ou égale à la date de début.';
     END IF;
     
     IF NEW.begin_date < CURDATE() THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de début ne peut pas être dans le passé.';
     END IF;
     
     IF NEW.actual_end_date IS NOT NULL AND NEW.actual_end_date < NEW.begin_date THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de fin réelle ne peut pas être antérieure à la date de début.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_location_dates_update//
CREATE TRIGGER trigger_check_location_dates_update
BEFORE UPDATE ON `LOCATION`
FOR EACH ROW
BEGIN
     IF NEW.end_date < NEW.begin_date THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de fin doit être postérieure ou égale à la date de début.';
     END IF;
     
     IF NEW.begin_date < CURDATE() THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de début ne peut pas être dans le passé.';
     END IF;
     
     IF NEW.actual_end_date IS NOT NULL AND NEW.actual_end_date < NEW.begin_date THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de fin réelle ne peut pas être antérieure à la date de début.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_location_status//
CREATE TRIGGER trigger_check_location_status
BEFORE INSERT ON `LOCATION`
FOR EACH ROW
BEGIN
     IF NEW.status NOT IN ('in Progress', 'Finished', 'Pending') THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Statut invalide. Valeurs possibles : ''in Progress'', ''Finished'', ''Pending''.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_location_status_update//
CREATE TRIGGER trigger_check_location_status_update
BEFORE UPDATE ON `LOCATION`
FOR EACH ROW
BEGIN
    IF NEW.status NOT IN ('in Progress', 'Finished', 'Pending') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Statut invalide. Valeurs possibles : ''in Progress'', ''Finished'', ''Pending''.';
    END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_location_command_type//
CREATE TRIGGER trigger_check_location_command_type 
BEFORE INSERT ON `LOCATION`
FOR EACH ROW
BEGIN
     DECLARE command_exists INT;
     DECLARE is_location INT;

     SELECT COUNT(*), COUNT(`LOCATION`) INTO command_exists, is_location
     FROM COMMANDE 
     WHERE id_commande = NEW.id_commande;

     IF command_exists = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La commande associée n''existe pas.';
          
     ELSEIF is_location = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La commande associée n''est pas une location.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_location_command_type_update//
CREATE TRIGGER trigger_check_location_command_type_update
BEFORE UPDATE ON `LOCATION`
FOR EACH ROW
BEGIN
     DECLARE command_exists INT;
     DECLARE is_location INT;

     SELECT COUNT(*), COUNT(`LOCATION`) INTO command_exists, is_location
     FROM COMMANDE 
     WHERE id_commande = NEW.id_commande;

     IF command_exists = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La commande associée n''existe pas.';

     ELSEIF is_location = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La commande associée n''est pas une location.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_location_auto_status//
CREATE TRIGGER trigger_location_auto_status
BEFORE INSERT ON `LOCATION`
FOR EACH ROW
BEGIN
     IF NEW.begin_date > CURDATE() THEN
          SET NEW.status = 'Pending';
     END IF;
     
     IF NEW.begin_date <= CURDATE() AND NEW.actual_end_date IS NULL THEN
          SET NEW.status = 'in Progress';
     END IF;
     
     IF NEW.actual_end_date IS NOT NULL THEN
          SET NEW.status = 'Finished';
    END IF;
END//

DROP TRIGGER IF EXISTS trigger_location_auto_status_update//
CREATE TRIGGER trigger_location_auto_status_update
BEFORE UPDATE ON `LOCATION`
FOR EACH ROW
BEGIN
     IF NEW.begin_date > CURDATE() THEN
          SET NEW.status = 'Pending';
     END IF;
     
     IF NEW.begin_date <= CURDATE() AND NEW.actual_end_date IS NULL THEN
          SET NEW.status = 'in Progress';
     END IF;
     
     IF NEW.actual_end_date IS NOT NULL THEN
          SET NEW.status = 'Finished';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_location_update_broom_status//
CREATE TRIGGER trigger_location_update_broom_status
AFTER INSERT ON `LOCATION`
FOR EACH ROW
BEGIN
     UPDATE BALAI b
     INNER JOIN DETAIL_LOCATION dl ON b.id_balai = dl.id_balai
     SET b.status = 'in location'
     WHERE dl.id_location = NEW.id_commande
          AND b.status = 'in stock';
END//

DROP TRIGGER IF EXISTS trigger_location_update_broom_status_update//
CREATE TRIGGER trigger_location_update_broom_status_update
AFTER UPDATE ON `LOCATION`
FOR EACH ROW
BEGIN
    UPDATE BALAI b
    INNER JOIN DETAIL_LOCATION dl ON b.id_balai = dl.id_balai
    SET b.status = 'in location'
    WHERE dl.id_location = NEW.id_commande
        AND b.status = 'in stock';
END//

DROP TRIGGER IF EXISTS trigger_location_before_delete//
CREATE TRIGGER trigger_location_before_delete
BEFORE DELETE ON `LOCATION`
FOR EACH ROW
BEGIN
     IF OLD.status = 'in Progress' THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Impossible de supprimer une location en cours. Terminez-la d''abord.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_location_after_delete//
CREATE TRIGGER trigger_location_after_delete
AFTER DELETE ON `LOCATION`
FOR EACH ROW
BEGIN
     UPDATE BALAI b
     INNER JOIN DETAIL_LOCATION dl ON b.id_balai = dl.id_balai
     SET b.status = 'in stock'
     WHERE dl.id_location = OLD.id_commande;
END//

DROP TRIGGER IF EXISTS trigger_location_before_update_id//
CREATE TRIGGER trigger_location_before_update_id
BEFORE UPDATE ON `LOCATION`
FOR EACH ROW
BEGIN
     IF OLD.id_commande != NEW.id_commande THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La modification de la référence commande est interdite.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_location_check_overlap//
CREATE TRIGGER trigger_location_check_overlap
BEFORE INSERT ON `LOCATION`
FOR EACH ROW
BEGIN
     DECLARE overlap_count INT;
     
     SELECT COUNT(*) INTO overlap_count
     FROM DETAIL_LOCATION dl
     INNER JOIN `LOCATION` l ON l.id_commande = dl.id_location
     WHERE dl.id_balai IN (
          SELECT id_balai FROM DETAIL_LOCATION WHERE id_location = NEW.id_commande
     )
     AND l.id_commande != NEW.id_commande
     AND l.status = 'in Progress'
     AND (
          (NEW.begin_date BETWEEN l.begin_date AND l.end_date) OR
          (NEW.end_date BETWEEN l.begin_date AND l.end_date) OR
          (l.begin_date BETWEEN NEW.begin_date AND NEW.end_date)
     );
     
     IF overlap_count > 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Un ou plusieurs balais sont déjà loués pendant cette période.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_location_after_delete_cascade//
CREATE TRIGGER trigger_location_after_delete_cascade
AFTER DELETE ON `LOCATION`
FOR EACH ROW
BEGIN
     DELETE FROM DETAIL_LOCATION WHERE id_location = OLD.id_commande;
END//

-- MOLDU --

DROP TRIGGER IF EXISTS trigger_check_moldu_nb_phone//
CREATE TRIGGER trigger_check_moldu_nb_phone
BEFORE INSERT ON MOLDU
FOR EACH ROW
BEGIN
     IF (NEW.tel3 IS NOT NULL AND NEW.tel2 IS NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le numéro de téléphone 3 ne peut être renseigné sans le numéro 2';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_moldu_nb_phone_update//
CREATE TRIGGER trigger_check_moldu_nb_phone_update
BEFORE UPDATE ON MOLDU
FOR EACH ROW
BEGIN
     IF (NEW.tel3 IS NOT NULL AND NEW.tel2 IS NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le numéro de téléphone 3 ne peut être renseigné sans le numéro 2';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_moldu_before_delete//
CREATE TRIGGER trigger_moldu_before_delete
BEFORE DELETE ON MOLDU
FOR EACH ROW
BEGIN
     DECLARE magic_broom_count INT;
     
     SELECT COUNT(*) INTO magic_broom_count
     FROM COMMANDE c
     WHERE c.id_client = OLD.id_client
     AND (
          EXISTS (
               SELECT 1
               FROM DETAIL_LOCATION dl
               INNER JOIN BALAI b ON b.id_balai = dl.id_balai
               INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
               WHERE dl.id_location = c.`LOCATION`
          )
          OR
          EXISTS (
               SELECT 1
               FROM BALAI b
               INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
               WHERE b.id_vente = c.VENTE
          )
     );
     
     IF magic_broom_count > 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Impossible de supprimer un Moldu qui a des commandes de balais magiques.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_moldu_before_update_id//
CREATE TRIGGER trigger_moldu_before_update_id
BEFORE UPDATE ON MOLDU
FOR EACH ROW
BEGIN
     IF OLD.id_client != NEW.id_client THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La modification de la référence client est interdite.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_moldu_after_insert//
CREATE TRIGGER trigger_moldu_after_insert
AFTER INSERT ON MOLDU
FOR EACH ROW
BEGIN
     DECLARE client_exists INT;
     
     SELECT COUNT(*) INTO client_exists
     FROM CLIENT
     WHERE id_client = NEW.id_client;
     
     IF client_exists = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le client associé n''existe pas.';
     END IF;
     
     UPDATE CLIENT 
     SET MOLDU = NEW.id_client 
     WHERE id_client = NEW.id_client AND MOLDU IS NULL;
END//

DROP TRIGGER IF EXISTS trigger_moldu_after_delete//
CREATE TRIGGER trigger_moldu_after_delete
AFTER DELETE ON MOLDU
FOR EACH ROW
BEGIN
     UPDATE CLIENT 
     SET MOLDU = NULL 
     WHERE id_client = OLD.id_client;
END//

-- SORCIER --

DROP TRIGGER IF EXISTS trigger_check_sorcier_nb_owl//
CREATE TRIGGER trigger_check_sorcier_nb_owl
BEFORE INSERT ON SORCIER
FOR EACH ROW
BEGIN
     IF (NEW.Owls_number3 IS NOT NULL AND NEW.Owls_number2 IS NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le numéro de chouette 3 ne peut être renseigné sans le numéro 2';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_sorcier_nb_owl_update//
CREATE TRIGGER trigger_check_sorcier_nb_owl_update
BEFORE UPDATE ON SORCIER
FOR EACH ROW
BEGIN
     IF (NEW.Owls_number3 IS NOT NULL AND NEW.Owls_number2 IS NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le numéro de chouette 3 ne peut être renseigné sans le numéro 2';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_sorcier_before_delete//
CREATE TRIGGER trigger_sorcier_before_delete
BEFORE DELETE ON SORCIER
FOR EACH ROW
BEGIN
     DECLARE active_rental_count INT;
     
     SELECT COUNT(*) INTO active_rental_count
     FROM COMMANDE c
     INNER JOIN `LOCATION` l ON l.id_commande = c.`LOCATION`
     WHERE c.id_client = OLD.id_client
          AND l.status = 'in Progress';
     
     IF active_rental_count > 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Impossible de supprimer un sorcier qui a des locations en cours.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_sorcier_before_update_id//
CREATE TRIGGER trigger_sorcier_before_update_id
BEFORE UPDATE ON SORCIER
FOR EACH ROW
BEGIN
     IF OLD.id_client != NEW.id_client THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La modification de la référence client est interdite.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_sorcier_after_insert//
CREATE TRIGGER trigger_sorcier_after_insert
AFTER INSERT ON SORCIER
FOR EACH ROW
BEGIN
     DECLARE client_exists INT;
     
     SELECT COUNT(*) INTO client_exists
     FROM CLIENT
     WHERE id_client = NEW.id_client;
     
     IF client_exists = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le client associé n''existe pas.';
     END IF;
     
     UPDATE CLIENT 
     SET SORCIER = NEW.id_client 
     WHERE id_client = NEW.id_client AND SORCIER IS NULL;
END//

DROP TRIGGER IF EXISTS trigger_sorcier_after_delete//
CREATE TRIGGER trigger_sorcier_after_delete
AFTER DELETE ON SORCIER
FOR EACH ROW
BEGIN
     UPDATE CLIENT 
     SET SORCIER = NULL 
     WHERE id_client = OLD.id_client;
END//

DROP TRIGGER IF EXISTS trigger_sorcier_check_license_for_magical_broom//
CREATE TRIGGER trigger_sorcier_check_license_for_magical_broom
BEFORE INSERT ON SORCIER
FOR EACH ROW
BEGIN
     DECLARE magic_broom_required INT;
     
     SELECT MAX(bm.Flight_licence_required) INTO magic_broom_required
     FROM COMMANDE c
     WHERE c.id_client = NEW.id_client
     AND (
          EXISTS (
               SELECT 1
               FROM BALAI b
               INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
               WHERE b.id_vente = c.VENTE
          )
          OR
          EXISTS (
               SELECT 1
               FROM DETAIL_LOCATION dl
               INNER JOIN BALAI b ON b.id_balai = dl.id_balai
               INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
               WHERE dl.id_location = c.`LOCATION`
          )
     );
     
     IF magic_broom_required IS NOT NULL AND NEW.Flight_licence < magic_broom_required THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le sorcier n''a pas la licence requise pour posséder ou utiliser certains de ses balais magiques.';
     END IF;
END//

-- VENTE --

DROP TRIGGER IF EXISTS trigger_check_vente_date//
CREATE TRIGGER trigger_check_vente_date
BEFORE INSERT ON VENTE
FOR EACH ROW
BEGIN
     IF NEW.sale_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de vente ne peut pas être dans le futur.';
     END IF;
     
     IF NEW.sale_date < DATE_SUB(CURDATE(), INTERVAL 10 YEAR) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de vente est trop ancienne (plus de 10 ans).';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_vente_date_update//
CREATE TRIGGER trigger_check_vente_date_update
BEFORE UPDATE ON VENTE
FOR EACH ROW
BEGIN
     IF NEW.sale_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de vente ne peut pas être dans le futur.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_vente_command_type//
CREATE TRIGGER trigger_check_vente_command_type
BEFORE INSERT ON VENTE
FOR EACH ROW
BEGIN
     DECLARE command_type BIGINT;
     
     SELECT VENTE INTO command_type 
     FROM COMMANDE 
     WHERE id_commande = NEW.id_commande;
     
     IF command_type IS NULL THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La commande associée n''existe pas ou n''est pas une vente.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_vente_command_type_update//
CREATE TRIGGER trigger_check_vente_command_type_update
BEFORE UPDATE ON VENTE
FOR EACH ROW
BEGIN
     DECLARE command_type BIGINT;
     
     SELECT VENTE INTO command_type 
     FROM COMMANDE 
     WHERE id_commande = NEW.id_commande;
     
     IF command_type IS NULL THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La commande associée n''existe pas ou n''est pas une vente.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_vente_has_details//
CREATE TRIGGER trigger_check_vente_has_details
BEFORE INSERT ON VENTE
FOR EACH ROW
BEGIN
     DECLARE detail_count INT;
     
     SELECT COUNT(*) INTO detail_count
     FROM BALAI
     WHERE id_vente = NEW.id_commande;
     
     IF detail_count = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Une vente doit comporter au moins un balai.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_vente_has_details_update//
CREATE TRIGGER trigger_check_vente_has_details_update
BEFORE UPDATE ON VENTE
FOR EACH ROW
BEGIN
     DECLARE detail_count INT;
     
     SELECT COUNT(*) INTO detail_count
     FROM BALAI
     WHERE id_vente = NEW.id_commande;
     
     IF detail_count = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Une vente doit comporter au moins un balai.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_check_vente_client_money//
CREATE TRIGGER trigger_check_vente_client_money
BEFORE INSERT ON VENTE
FOR EACH ROW
BEGIN
     DECLARE total_amount DECIMAL(10,2);
     DECLARE client_balance DECIMAL(10,2);
     DECLARE client_id INT;
     
     SELECT id_client INTO client_id
     FROM COMMANDE
     WHERE id_commande = NEW.id_commande;
     
     SELECT SUM(b.sale_price) INTO total_amount
     FROM BALAI b
     WHERE b.id_vente = NEW.id_commande;
     
     SELECT money INTO client_balance
     FROM CLIENT
     WHERE id_client = client_id;
     
     IF client_balance < total_amount THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Solde insuffisant pour effectuer cet achat.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_vente_before_update//
CREATE TRIGGER trigger_vente_before_update
BEFORE UPDATE ON VENTE
FOR EACH ROW
BEGIN
     SIGNAL SQLSTATE '45000'
     SET MESSAGE_TEXT = 'La date de vente ne peut pas être modifiée après création.';
END//

DROP TRIGGER IF EXISTS trigger_vente_after_insert//
CREATE TRIGGER trigger_vente_after_insert
AFTER INSERT ON VENTE
FOR EACH ROW
BEGIN
     DECLARE total_amount DECIMAL(10,2);
     DECLARE client_id INT;
     
     SELECT id_client INTO client_id
     FROM COMMANDE
     WHERE id_commande = NEW.id_commande;
     
     SELECT SUM(b.sale_price) INTO total_amount
     FROM BALAI b
     WHERE b.id_vente = NEW.id_commande;
     
     UPDATE CLIENT
     SET money = money - total_amount
     WHERE id_client = client_id;
     
     UPDATE BALAI
     SET status = 'sold',
          uses_number = uses_number + 1
     WHERE id_vente = NEW.id_commande;
END//

DROP TRIGGER IF EXISTS trigger_vente_before_delete//
CREATE TRIGGER trigger_vente_before_delete
BEFORE DELETE ON VENTE
FOR EACH ROW
BEGIN
     DECLARE days_since_sale INT;
     
     SELECT DATEDIFF(CURDATE(), OLD.sale_date) INTO days_since_sale;
     
     IF days_since_sale > 30 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Impossible d''annuler une vente de plus de 30 jours.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_vente_after_delete//
CREATE TRIGGER trigger_vente_after_delete
AFTER DELETE ON VENTE
FOR EACH ROW
BEGIN
     DECLARE total_amount DECIMAL(10,2);
     DECLARE client_id INT;
     
     SELECT id_client INTO client_id
     FROM COMMANDE
     WHERE id_commande = OLD.id_commande;
     
     SELECT SUM(sale_price) INTO total_amount
     FROM BALAI
     WHERE id_vente = OLD.id_commande;
     
     UPDATE CLIENT
     SET money = money + total_amount
     WHERE id_client = client_id;
     
     UPDATE BALAI
     SET status = 'in stock',
          uses_number = uses_number - 1
     WHERE id_vente = OLD.id_commande;
END//

DROP TRIGGER IF EXISTS trigger_vente_before_update_id//
CREATE TRIGGER trigger_vente_before_update_id
BEFORE UPDATE ON VENTE
FOR EACH ROW
BEGIN
     IF OLD.id_commande != NEW.id_commande THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La modification de la référence commande est interdite.';
     END IF;
END//

-- DETAIL_LOCATION --

DROP TRIGGER IF EXISTS trigger_detail_location_before_insert//
CREATE TRIGGER trigger_detail_location_before_insert
BEFORE INSERT ON DETAIL_LOCATION
FOR EACH ROW
BEGIN
     DECLARE balai_status VARCHAR(120);
     
     SELECT status INTO balai_status
     FROM BALAI
     WHERE id_balai = NEW.id_balai;
     
     IF balai_status != 'in stock' THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Ce balai n''est pas disponible à la location.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_detail_location_before_update//
CREATE TRIGGER trigger_detail_location_before_update
BEFORE UPDATE ON DETAIL_LOCATION
FOR EACH ROW
BEGIN
     DECLARE balai_status VARCHAR(120);
     
     SELECT status INTO balai_status
     FROM BALAI
     WHERE id_balai = NEW.id_balai;
     
     IF balai_status != 'in stock' THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Ce balai n''est pas disponible à la location.';
     END IF;
END//

DROP TRIGGER IF EXISTS trigger_detail_location_after_delete//
CREATE TRIGGER trigger_detail_location_after_delete
AFTER DELETE ON DETAIL_LOCATION
FOR EACH ROW
BEGIN
     DECLARE active_rentals INT;
     
     SELECT COUNT(*) INTO active_rentals
     FROM DETAIL_LOCATION dl
     INNER JOIN `LOCATION` l ON dl.id_location = l.id_commande
     WHERE dl.id_balai = OLD.id_balai
          AND l.status = 'in Progress';
     
     IF active_rentals = 0 THEN
          UPDATE BALAI
          SET status = 'in stock'
          WHERE id_balai = OLD.id_balai;
     END IF;
END//

DELIMITER ;