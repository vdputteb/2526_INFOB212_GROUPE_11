-- *********************************************
-- * Standard SQL generation                   
-- *------------------------------
-- * DB-MAIN version: 11.0.2              
-- * Generator date: Sep 14 2021              
-- * Generation date: Fri May  1 11:16:01 2026 
-- * LUN file: C:\Users\benja\Desktop\Université\cours\2025-2026\Q2\BD2\Projet\BD2 Project.lun 
-- * Schema: bdd/SQL 
-- ********************************************* 

-- Database Section
-- ________________ 

CREATE DATABASE IF NOT EXISTS bdd;
USE bdd;

-- Tables Section
-- _____________ 

create table if not exists FABRICANT (
     id_fabricant bigint not null auto_increment,
     name varchar(120) not null,
     Mail varchar(120) not null,
     constraint ID_FABRICANT_ID primary key (id_fabricant));

create table if not exists EMPLOYEE (
     id_employee bigint not null auto_increment,
     login varchar(120) not null,
     password varchar(120) not null,
     actif char not null,
     name varchar(120) not null,
     surname varchar(120) not null,
     mail_pro varchar(120) not null,
     last_login TIMESTAMP,
     tel1 varchar(16) not null,
     tel2 varchar(16),
     tel3 varchar(16),
     id_patron bigint,
     constraint ID_EMPLOYEE_ID primary key (id_employee),
     constraint SID_EMPLOYEE_1_ID unique (login),
     constraint SID_EMPLOYEE_ID unique (mail_pro));

create table if not exists CLIENT (
     id_client bigint not null auto_increment,
     name varchar(120) not null,
     surname varchar(120) not null,
     birth_date date not null,
     money numeric(10,2) not null,
     id_employee bigint not null,
     `SORCIER` bigint,
     `MOLDU` bigint,
     constraint ID_CLIENT_ID primary key (id_client));

create table if not exists COMMANDE_FOURNISSEUR (
     id_commande bigint not null auto_increment,
     status varchar(120) not null comment 'Peut prendre les valeurs :   - Pending Approuval - Pending  - Processing - In transit - Cancelled - Finished',
     command_date date,
     expected_delivery_date date,
     actual_delivery_date date,
     id_vendeur bigint not null,
     id_patron bigint not null,
     constraint ID_COMMANDE_FOURNISSEUR_ID primary key (id_commande));

create table if not exists COMMANDE (
     id_commande bigint not null auto_increment,
     id_employee bigint not null,
     id_client bigint not null,
     `VENTE` bigint,
     `LOCATION` bigint,
     constraint ID_COMMANDE_ID primary key (id_commande));

create table if not exists VENTE (
     id_commande bigint not null,
     sale_date date not null,
     constraint ID_VENTE_COMMA_ID primary key (id_commande));

create table if not exists LOCATION (
     id_commande bigint not null,
     begin_date date not null,
     end_date date not null,
     actual_end_date date,
     status varchar(120) not null comment 'valeurs_possible :   - in progress - finished - Pending',
     constraint ID_LOCAT_COMMA_ID primary key (id_commande));

create table if not exists BALAI (
     id_balai bigint not null auto_increment,
     Libelle varchar(120) not null comment 'Intitulé du produit ( son modèle )',
     description varchar(120) not null comment 'Petite description accrocheuse du produit',
     img varchar(120) not null comment 'chemin vers l''image du balai',
     uses_number numeric(10) not null,
     sale_price numeric(10,2) not null,
     location_price numeric(10,2) not null,
     purchase_price numeric(10,2) not null,
     wear numeric(3) not null comment 'usure du balai en %',
     status varchar(120) not null comment 'valeurs_possible :   - in location - in stock - arriving',
     id_commande_fournisseur bigint not null,
     id_vente bigint,
     id_fabricant bigint not null,
     `BALAI_MAGIQUE` bigint,
     constraint ID_BALAI_ID primary key (id_balai));

create table if not exists BALAI_MAGIQUE (
     id_balai bigint not null,
     Flight_licence_required numeric(1) not null comment 'from level 1 - 5',
     speed DECIMAL(3) not null,
     magic_component varchar(120) not null comment 'list of the magic component of the broom',
     constraint ID_BALAI_BALAI_ID primary key (id_balai));

create table if not exists MOLDU (
     id_client bigint not null,
     National_register_number numeric(10) not null,
     Mail varchar(120) not null,
     Add_Street varchar(120) not null,
     Add_City varchar(120) not null,
     Add_House_number char(4) not null comment 'char for the letter of the mailbox in apartment',
     Add_Country varchar(120) not null,
     tel1 varchar(16) not null,
     tel2 varchar(16),
     tel3 varchar(16),
     constraint SID_MOLDU_ID unique (National_register_number),
     constraint ID_MOLDU_CLIEN_ID primary key (id_client));

create table if not exists SORCIER (
     id_client bigint not null,
     Wizard_registry_number numeric(10) not null,
     Chimney varchar(120) not null comment 'Represent the mail of the Moldu',
     Add_School_name varchar(120) not null comment 'Peut prendre les valeurs :  - Hogwarts  - Beauxbâtons  - ...',
     Add_House varchar(120) not null comment 'ex :  - Griffundor - Slitherin - ...',
     Add_Country varchar(120) not null,
     Flight_licence numeric(1) not null comment '0 = no licence',
     Owls_number1 varchar(16) not null comment 'Equivalent au numéro de telephone mais pour les sorciers',
     Owls_number2 varchar(16) comment 'Equivalent au numéro de telephone mais pour les sorciers',
     Owls_number3 varchar(16) comment 'Equivalent au numéro de telephone mais pour les sorciers',
     constraint SID_SORCIER_ID unique (Wizard_registry_number),
     constraint ID_SORCI_CLIEN_ID primary key (id_client));

create table if not exists DETAIL_LOCATION (
     id_location bigint not null,
     id_balai bigint not null,
     constraint ID_DETAIL_LOCATION_ID primary key (id_balai, id_location));

-- Constraints Section
-- ___________________ 

-- EMPLOYEE Constraints --

alter table EMPLOYEE add constraint REF_EMPLO_EMPLO_FK
     foreign key (id_patron)
     references EMPLOYEE(id_employee);

alter table EMPLOYEE add constraint check_employee_nb_phone
     check ((tel2 is not null and tel3 is not null) or tel3 is null);


-- CLIENT Constraints --

alter table CLIENT add constraint LSTONE_CLIENT
     check(`SORCIER` is not null or `MOLDU` is not null); 

alter table CLIENT add constraint REF_CLIEN_EMPLO_FK
     foreign key (id_employee)
     references EMPLOYEE(id_employee);

alter table CLIENT add constraint check_client_money
     check (money >= 0);


-- COMMANDE_FOURNISSEUR Constraints --

alter table COMMANDE_FOURNISSEUR add constraint REF_COMMA_EMPLO_1_FK
     foreign key (id_vendeur)
     references EMPLOYEE(id_employee);

alter table COMMANDE_FOURNISSEUR add constraint REF_COMMA_EMPLO_FK
     foreign key (id_patron)
     references EMPLOYEE(id_employee);

alter table COMMANDE_FOURNISSEUR add constraint check_commande_fournisseur_status
     check (status IN ('Pending Approuval', 'Finished', 'Pending', 'Processing', 'In transit', 'Cancelled'));

alter table COMMANDE_FOURNISSEUR add constraint check_commande_fournisseur_correct_date
     check (expected_delivery_date >= command_date and 
          actual_delivery_date >= command_date);

alter table COMMANDE_FOURNISSEUR add constraint check_commande_fournisseur_initialize_date
     check ((command_date is not null and expected_delivery_date is not null)
          or command_date is null);

alter table COMMANDE_FOURNISSEUR add constraint check_commande_fournisseur_initialize_actual_date
     check ((expected_delivery_date is not null and actual_delivery_date is not null)
          or actual_delivery_date is null);


-- COMMANDE Constraints --

alter table COMMANDE add constraint EXTONE_COMMANDE
     check((`VENTE` is not null and `LOCATION` is null)
          or (`VENTE` is null and `LOCATION` is not null)); 

alter table COMMANDE add constraint REF_COMMA_EMPLO_2_FK
     foreign key (id_employee)
     references EMPLOYEE(id_employee);

alter table COMMANDE add constraint REF_COMMA_CLIEN_FK
     foreign key (id_client)
     references CLIENT(id_client);


-- VENTE Constraints --

alter table VENTE add constraint ID_VENTE_COMMA_FK
     foreign key (id_commande)
     references COMMANDE(id_commande);


-- LOCATION Constraints --

alter table LOCATION add constraint ID_LOCAT_COMMA_FK
     foreign key (id_commande)
     references COMMANDE(id_commande);

alter table LOCATION add constraint check_location_begin_date
     check (end_date >= begin_date);

alter table LOCATION add constraint check_location_actual_end
     check (actual_end_date >= begin_date); 

alter table LOCATION add constraint check_location_status
     check (status in ('in Progress', 'Finished', 'Pending'));


-- BALAI Constraints --

alter table BALAI add constraint REF_BALAI_FABRI_FK
     foreign key (id_fabricant)
     references FABRICANT(id_fabricant);

alter table BALAI add constraint EQU_BALAI_COMMA_FK
     foreign key (id_commande_fournisseur)
     references COMMANDE_FOURNISSEUR(id_commande);

alter table BALAI add constraint EQU_BALAI_VENTE_FK
     foreign key (id_vente)
     references VENTE(id_commande);

alter table BALAI add constraint check_balai_uses
     check (uses_number >= 0);

alter table BALAI add constraint check_balai_prices
     check (sale_price >= 0 and location_price >= 0 and purchase_price > 0 and sale_price > purchase_price);

alter table BALAI add constraint check_balai_wear
     check (wear between 0 and 100);

alter table BALAI add constraint check_balai_status
     check (status IN ('in location', 'in stock', 'arriving', 'sold'));

-- BALAI_MAGIQUE Constraints --

alter table BALAI_MAGIQUE add constraint ID_BALAI_BALAI_FK
     foreign key (id_balai)
     references BALAI(id_balai);

alter table BALAI_MAGIQUE add constraint check_balai_magique_flight_licence_required
     check (Flight_licence_required between 1 and 5);

alter table BALAI_MAGIQUE add constraint check_balai_magique_speed
     check (speed > 0);


-- MOLDU Constraints --

alter table MOLDU add constraint ID_MOLDU_CLIEN_FK
     foreign key (id_client)
     references CLIENT(id_client);

alter table MOLDU add constraint check_moldu_nb_phone
     check ((tel2 is not null and tel3 is not null) or tel3 is null);


-- SORCIER Constraints --

alter table SORCIER add constraint ID_SORCI_CLIEN_FK
     foreign key (id_client)
     references CLIENT(id_client);

alter table SORCIER add constraint check_sorcier_flight_license
     check (Flight_licence between 0 and 5);

alter table SORCIER add constraint check_sorcier_nb_owl
     check ((Owls_number2 is not null and Owls_number3 is not null) or Owls_number3 is null);


-- DETAIL_LOCATION Constraints --

alter table DETAIL_LOCATION add constraint REF_DETAI_BALAI
     foreign key (id_balai)
     references BALAI(id_balai);

alter table DETAIL_LOCATION add constraint EQU_DETAI_LOCAT_FK
     foreign key (id_location)
     references `LOCATION`(id_commande);


-- Index Section
-- _____________ 

create unique index ID_BALAI_IND
     on BALAI (id_balai);

create index REF_BALAI_FABRI_IND
     on BALAI (id_fabricant);

create index EQU_BALAI_COMMA_IND
     on BALAI (id_commande_fournisseur);

create index EQU_BALAI_VENTE_IND
     on BALAI (id_vente);

create unique index ID_BALAI_BALAI_IND
     on BALAI_MAGIQUE (id_balai);

create unique index ID_CLIENT_IND
     on CLIENT (id_client);

create index REF_CLIEN_EMPLO_IND
     on CLIENT (id_employee);

create unique index ID_COMMANDE_IND
     on COMMANDE (id_commande);

create index REF_COMMA_EMPLO_2_IND
     on COMMANDE (id_employee);

create index REF_COMMA_CLIEN_IND
     on COMMANDE (id_client);

create unique index ID_COMMANDE_FOURNISSEUR_IND
     on COMMANDE_FOURNISSEUR (id_commande);

create index REF_COMMA_EMPLO_1_IND
     on COMMANDE_FOURNISSEUR (id_vendeur);

create index REF_COMMA_EMPLO_IND
     on COMMANDE_FOURNISSEUR (id_patron);

create unique index ID_EMPLOYEE_IND
     on EMPLOYEE (id_employee);

create unique index SID_EMPLOYEE_1_IND
     on EMPLOYEE (login);

create unique index SID_EMPLOYEE_IND
     on EMPLOYEE (mail_pro);

create index REF_EMPLO_EMPLO_IND
     on EMPLOYEE (id_patron);

create unique index ID_FABRICANT_IND
     on FABRICANT (id_fabricant);

create unique index ID_LOCAT_COMMA_IND
     on LOCATION (id_commande);

create unique index SID_MOLDU_IND
     on MOLDU (National_register_number);

create unique index ID_MOLDU_CLIEN_IND
     on MOLDU (id_client);

create unique index ID_DETAIL_LOCATION_IND
     on DETAIL_LOCATION (id_balai, id_location);

create index EQU_DETAI_LOCAT_IND
     on DETAIL_LOCATION (id_location);

create unique index SID_SORCIER_IND
     on SORCIER (Wizard_registry_number);

create unique index ID_SORCI_CLIEN_IND
     on SORCIER (id_client);

create unique index ID_VENTE_COMMA_IND
     on VENTE (id_commande);

-- Trigger Section 
-- _______________ 

DELIMITER //

-- utils --

CREATE OR REPLACE FUNCTION check_amount(amount DECIMAL(10,2))
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
     RETURN amount >= 0;
END//

CREATE OR REPLACE FUNCTION check_nb_phone(phone3 varchar(16), phone2 varchar(16))
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
     RETURN phone3 IS NOT NULL AND phone2 IS NULL;
END//

-- BALAI --

-- set_default_data --

CREATE OR REPLACE TRIGGER set_default_value
BEFORE INSERT ON balai
FOR EACH ROW
BEGIN
     IF NEW.wear IS NULL THEN SET NEW.wear = 0; END IF;
     IF NEW.uses_number IS NULL THEN SET NEW.uses_number = 0; END IF;
     IF NEW.status IS NULL THEN SET NEW.status = 'in stock'; END IF;
END//

-- validate_broom_prices --

CREATE OR REPLACE TRIGGER validate_broom_prices
BEFORE INSERT ON balai
FOR EACH ROW 
BEGIN
     IF NEW.sale_price < 0 OR NEW.location_price < 0 OR NEW.purchase_price < 0 THEN
          SIGNAL SQLSTATE '45000'
          SET message_text = 'Prices must be positive';
     END IF;

     IF NEW.location_price > NEW.sale_price THEN
          SIGNAL SQLSTATE '45000'
          SET message_text = 'Location price cannot be higher than sale price';
     END IF;

     IF NEW.sale_price < NEW.purchase_price THEN
          SIGNAL SQLSTATE '45000'
          SET message_text = 'Sale price cannot be higher than purchase price';
     END IF;
END//

-- block_unusable_broom --

CREATE OR REPLACE TRIGGER block_unusable_broom
before update on balai
for each row
begin
     if old.status = "Unusable" and NEW.uses_number > old.uses_number then
          SIGNAL SQLSTATE '45000'
          set message_text = 'Cannot use an unusable broom';
     end if;
end//

-- sale_price_reduction --

CREATE OR REPLACE TRIGGER sale_price_reduction
before update on balai
for each row
begin
     if NEW.wear > old.wear then
          set NEW.sale_price = old.sale_price * 0.99;
     end if;
end//

-- BALAI MAGIQUE --

-- base_broom_existence --

CREATE OR REPLACE TRIGGER base_broom_existence
before insert on balai_magique
for each row
begin
     if not exists (
          select 1 from balai 
          where id_balai = NEW.id_balai
     ) then
          SIGNAL SQLSTATE '45000'
          set message_text = 'Base broom does not exist';
     end if;
end//

-- FABRICANT --

-- normalize_data --

CREATE OR REPLACE TRIGGER normalize_data
before insert on fabricant
for each row
begin
     set NEW.name = upper(NEW.name);
     set NEW.mail = lower(NEW.mail);
END//

-- validate_email --

CREATE OR REPLACE TRIGGER validate_email
before insert on fabricant
for each row
begin
     if NEW.mail not like '%@%.%' then
          SIGNAL SQLSTATE '45000'
          set message_text = 'Invalid email format';
     end if;
END//

-- prevent_deletion_active_producer --

CREATE OR REPLACE TRIGGER prevent_deletion_active_producer
before delete on fabricant
for each row
begin
     if exists (
          select 1 from balai 
          where id_fabricant = old.id_fabricant
     ) then
          SIGNAL SQLSTATE '45000'
          set message_text = 'Cannot delete a producer with active brooms';
     end if;
END//

-- CLIENT --

-- check_age --

CREATE OR REPLACE TRIGGER trigger_check_age
BEFORE INSERT ON CLIENT
FOR EACH ROW
BEGIN
     -- Vérification que la date de naissance n'est pas dans le futur
     IF NEW.birth_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de naissance ne peut pas être dans le futur.';
     END IF;

     -- Vérification que l'age > 11 ans
     IF TIMESTAMPDIFF(YEAR, NEW.birth_date, CURDATE()) < 11 THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Client must be at least 11 years old';
     END IF;
END//

CREATE OR REPLACE TRIGGER trigger_check_age_update
BEFORE UPDATE ON CLIENT
FOR EACH ROW
BEGIN
     -- Vérification que la date de naissance n'est pas dans le futur
     IF NEW.birth_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de naissance ne peut pas être dans le futur.';
     END IF;

     -- Vérification que l'age > 11 ans
     IF TIMESTAMPDIFF(YEAR, NEW.birth_date, CURDATE()) < 11 THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Client must be at least 11 years old';
     END IF;
END//

-- check_client_money_lvl --

CREATE OR REPLACE TRIGGER trigger_check_client_money_lvl
BEFORE INSERT ON CLIENT
FOR EACH ROW
BEGIN
     IF NOT check_amount(NEW.money) THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Le solde du client ne peut pas être négatif.';
     END IF;
END//

CREATE OR REPLACE TRIGGER trigger_check_client_money_lvl_update
BEFORE UPDATE ON CLIENT
FOR EACH ROW
BEGIN
     IF NOT check_amount(NEW.money) THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Le solde du client ne peut pas être négatif.';
     END IF;
END//

-- check_moldu_or_sorcier_not_null --

CREATE OR REPLACE TRIGGER trigger_check_moldu_and_sorcier_not_null
BEFORE INSERT ON CLIENT
FOR EACH ROW
BEGIN
     IF (NEW.SORCIER IS NULL AND NEW.MOLDU IS NULL) THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Un client doit être soit sorcier, soit moldu (ou les deux)';
     END IF;
END//

CREATE OR REPLACE TRIGGER trigger_check_moldu_and_sorcier_not_null_update
BEFORE UPDATE ON CLIENT
FOR EACH ROW
BEGIN
     IF (NEW.SORCIER IS NULL AND NEW.MOLDU IS NULL) THEN
          SIGNAL SQLSTATE '45000' 
          SET MESSAGE_TEXT = 'Un client doit être soit sorcier, soit moldu (ou les deux)';
     END IF;
END//

-- check_modify_sorcier_to_null --

CREATE OR REPLACE TRIGGER trigger_check_modify_sorcier_to_null_update
BEFORE UPDATE ON CLIENT
FOR EACH ROW
BEGIN
     DECLARE has_magic_broom_orders INT;
     
     IF OLD.SORCIER IS NOT NULL AND NEW.SORCIER IS NULL THEN
          SELECT COUNT(*) INTO has_magic_broom_orders
          FROM COMMANDE c
          INNER JOIN DETAIL_LOCATION dl ON dl.id_location = c.LOCATION
          INNER JOIN BALAI b ON dl.id_balai = b.id_balai
          INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
          WHERE c.id_client = NEW.id_client;
          
          IF has_magic_broom_orders > 0 THEN
               SIGNAL SQLSTATE '45000' 
               SET MESSAGE_TEXT = 'Impossible de changer le type d''un client ayant des commandes de balais magiques';
          END IF;
     END IF;
END//

-- client_before_delete --

CREATE OR REPLACE TRIGGER trigger_client_before_delete
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

-- client_before_update_id --

CREATE OR REPLACE TRIGGER trigger_client_before_update_id
BEFORE UPDATE ON CLIENT
FOR EACH ROW
BEGIN
     IF OLD.id_client != NEW.id_client THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La modification de l''identifiant client est interdite.';
     END IF;
END//

-- COMMANDE --

-- check_commande_type --

CREATE OR REPLACE TRIGGER trigger_check_commande_type
BEFORE INSERT ON COMMANDE
FOR EACH ROW
BEGIN
     IF (NEW.VENTE IS NULL AND NEW.LOCATION IS NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Une commande doit être soit une vente, soit une location.';
     END IF;
     
     IF (NEW.VENTE IS NOT NULL AND NEW.LOCATION IS NOT NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Une commande ne peut pas être à la fois une vente et une location.';
     END IF;
END//

CREATE OR REPLACE TRIGGER trigger_check_commande_type_update
BEFORE UPDATE ON COMMANDE
FOR EACH ROW
BEGIN
     IF (NEW.VENTE IS NULL AND NEW.LOCATION IS NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Une commande doit être soit une vente, soit une location.';
     END IF;
     
     IF (NEW.VENTE IS NOT NULL AND NEW.LOCATION IS NOT NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Une commande ne peut pas être à la fois une vente et une location.';
     END IF;
END//

-- check_commande_foreign_keys --

CREATE OR REPLACE TRIGGER trigger_check_commande_foreign_keys
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

CREATE OR REPLACE TRIGGER trigger_check_commande_foreign_keys_update
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

-- check_if_can_commande_magical_broom (Moldu cannot buy/rent magical brooms) --

CREATE OR REPLACE TRIGGER trigger_check_if_can_commande_magical_broom
BEFORE INSERT ON COMMANDE
FOR EACH ROW
BEGIN
     DECLARE client_sorcier INT;
     DECLARE has_magical_broom INT;
     
     SELECT COUNT(*) INTO client_sorcier 
     FROM CLIENT 
     WHERE id_client = NEW.id_client AND SORCIER IS NOT NULL;
     
     -- Si le client n'est pas sorcier (donc moldu)
     IF client_sorcier = 0 THEN
          -- Vérifier si c'est une vente avec des balais magiques
          IF NEW.VENTE IS NOT NULL THEN
               -- Vérifier si la vente contient des balais magiques
               SELECT COUNT(*) INTO has_magical_broom
               FROM BALAI b
               INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
               WHERE b.id_vente = NEW.VENTE;
               
               IF has_magical_broom > 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Un Moldu ne peut pas acheter un balai magique. Seuls les sorciers peuvent posséder des balais magiques.';
               END IF;
          END IF;
          
          -- Vérifier si c'est une location avec des balais magiques
          IF NEW.LOCATION IS NOT NULL THEN
               SELECT COUNT(*) INTO has_magical_broom
               FROM DETAIL_LOCATION dl
               INNER JOIN BALAI b ON dl.id_balai = b.id_balai
               INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
               WHERE dl.id_location = NEW.LOCATION;
               
               IF has_magical_broom > 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Un Moldu ne peut pas louer un balai magique. Seuls les sorciers peuvent utiliser des balais magiques.';
               END IF;
          END IF;
     END IF;
END//

CREATE OR REPLACE TRIGGER trigger_check_if_can_commande_magical_broom_update
BEFORE UPDATE ON COMMANDE
FOR EACH ROW
BEGIN
     DECLARE client_sorcier INT;
     DECLARE has_magical_broom INT;
     
     SELECT COUNT(*) INTO client_sorcier 
     FROM CLIENT 
     WHERE id_client = NEW.id_client AND SORCIER IS NOT NULL;
     
     -- Si le client n'est pas sorcier (donc moldu)
     IF client_sorcier = 0 THEN
          -- Vérifier si c'est une vente avec des balais magiques
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
          
          -- Vérifier si c'est une location avec des balais magiques
          IF NEW.LOCATION IS NOT NULL THEN
               SELECT COUNT(*) INTO has_magical_broom
               FROM DETAIL_LOCATION dl
               INNER JOIN BALAI b ON dl.id_balai = b.id_balai
               INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
               WHERE dl.id_location = NEW.LOCATION;
               
               IF has_magical_broom > 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Un Moldu ne peut pas louer un balai magique. Seuls les sorciers peuvent utiliser des balais magiques.';
               END IF;
          END IF;
     END IF;
END//

-- commande_before_delete --

CREATE OR REPLACE TRIGGER trigger_commande_before_delete
BEFORE DELETE ON COMMANDE
FOR EACH ROW
BEGIN
     DECLARE detail_count INT;
     
     -- Vérification pour les locations
     IF OLD.LOCATION IS NOT NULL THEN
          SELECT COUNT(*) INTO detail_count
          FROM DETAIL_LOCATION
          WHERE id_location = OLD.LOCATION;
          
          IF detail_count > 0 THEN
               SIGNAL SQLSTATE '45000'
               SET MESSAGE_TEXT = 'Impossible de supprimer une commande de location qui a des balais associés.';
          END IF;
     END IF;
     
     -- Vérification pour les ventes
     IF OLD.VENTE IS NOT NULL THEN
          SELECT COUNT(*) INTO detail_count
          FROM BALAI
          WHERE id_vente = OLD.VENTE;
          
          IF detail_count > 0 THEN
               SIGNAL SQLSTATE '45000'
               SET MESSAGE_TEXT = 'Impossible de supprimer une commande de vente qui a des balais associés. ';
          END IF;
     END IF;
END//

-- commande_before_update_id --

CREATE OR REPLACE TRIGGER trigger_commande_before_update_id
BEFORE UPDATE ON COMMANDE
FOR EACH ROW
BEGIN
     IF OLD.id_commande != NEW.id_commande THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La modification de l''identifiant commande est interdite.';
     END IF;
END//

-- commande_before_update_type --

CREATE OR REPLACE TRIGGER trigger_commande_before_update_type
BEFORE UPDATE ON COMMANDE
FOR EACH ROW
BEGIN
     IF (OLD.VENTE IS NOT NULL AND NEW.VENTE IS NULL) OR
          (OLD.VENTE IS NULL AND NEW.VENTE IS NOT NULL) OR
          (OLD.LOCATION IS NOT NULL AND NEW.LOCATION IS NULL) OR
          (OLD.LOCATION IS NULL AND NEW.LOCATION IS NOT NULL) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Impossible de changer le type d''une commande (vente/location) après création.';
     END IF;
END//

-- commande_after_delete --

CREATE OR REPLACE TRIGGER trigger_commande_after_delete
AFTER DELETE ON COMMANDE
FOR EACH ROW
BEGIN
     IF OLD.VENTE IS NOT NULL THEN
          DELETE FROM VENTE WHERE id_commande = OLD.VENTE;
     END IF;
     
     IF OLD.LOCATION IS NOT NULL THEN
          DELETE FROM LOCATION WHERE id_commande = OLD.LOCATION;
     END IF;
END//

-- LOCATION --


CREATE OR REPLACE TRIGGER trigger_check_location_dates_update
BEFORE UPDATE ON LOCATION
FOR EACH ROW
BEGIN
     IF NEW.end_date < NEW.begin_date THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de fin doit être postérieure ou égale à la date de début.';
     END IF;
     
     IF NEW.actual_end_date IS NOT NULL AND NEW.actual_end_date < NEW.begin_date THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de fin réelle ne peut pas être antérieure à la date de début.';
     END IF;
END//

-- check_location_status --

CREATE OR REPLACE TRIGGER trigger_check_location_status
BEFORE INSERT ON LOCATION
FOR EACH ROW
BEGIN
     IF NEW.status NOT IN ('in Progress', 'Finished', 'Pending') THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Statut invalide. Valeurs possibles : ''in Progress'', ''Finished'', ''Pending''.';
     END IF;
END//

CREATE OR REPLACE TRIGGER trigger_check_location_status_update
BEFORE UPDATE ON LOCATION
FOR EACH ROW
BEGIN
    IF NEW.status NOT IN ('in Progress', 'Finished', 'Pending') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Statut invalide. Valeurs possibles : ''in Progress'', ''Finished'', ''Pending''.';
    END IF;
END//

-- check_location_command_type --

CREATE OR REPLACE TRIGGER trigger_check_location_command_type 
BEFORE INSERT ON LOCATION
FOR EACH ROW
BEGIN
     DECLARE command_exists INT;
     DECLARE is_location INT;

     SELECT COUNT(*), COUNT(LOCATION) INTO command_exists, is_location
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

CREATE OR REPLACE TRIGGER trigger_check_location_command_type_update
BEFORE UPDATE ON LOCATION
FOR EACH ROW
BEGIN
     DECLARE command_exists INT;
     DECLARE is_location INT;

     SELECT COUNT(*), COUNT(LOCATION) INTO command_exists, is_location
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

-- location_auto_status --

CREATE OR REPLACE TRIGGER trigger_location_auto_status
BEFORE INSERT ON LOCATION
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

CREATE OR REPLACE TRIGGER trigger_location_auto_status_update
BEFORE UPDATE ON LOCATION
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

-- location_update_broom_status --

CREATE OR REPLACE TRIGGER trigger_location_update_broom_status
AFTER INSERT ON LOCATION
FOR EACH ROW
BEGIN
     UPDATE BALAI b
     INNER JOIN DETAIL_LOCATION dl ON b.id_balai = dl.id_balai
     SET b.status = 'in location'
     WHERE dl.id_location = NEW.id_commande
          AND b.status = 'in stock';
END//

CREATE OR REPLACE TRIGGER trigger_location_update_broom_status_update
AFTER UPDATE ON LOCATION
FOR EACH ROW
BEGIN
    UPDATE BALAI b
    INNER JOIN DETAIL_LOCATION dl ON b.id_balai = dl.id_balai
    SET b.status = 'in location'
    WHERE dl.id_location = NEW.id_commande
        AND b.status = 'in stock';
END//

-- location_before_delete --

CREATE OR REPLACE TRIGGER trigger_location_before_delete
BEFORE DELETE ON LOCATION
FOR EACH ROW
BEGIN
     IF OLD.status = 'in Progress' THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Impossible de supprimer une location en cours. Terminez-la d''abord.';
     END IF;
END//

-- location_after_delete --

CREATE OR REPLACE TRIGGER trigger_location_after_delete
AFTER DELETE ON LOCATION
FOR EACH ROW
BEGIN
     UPDATE BALAI b
     INNER JOIN DETAIL_LOCATION dl ON b.id_balai = dl.id_balai
     SET b.status = 'in stock'
     WHERE dl.id_location = OLD.id_commande;
END//

-- location_before_update_id --

CREATE OR REPLACE TRIGGER trigger_location_before_update_id
BEFORE UPDATE ON LOCATION
FOR EACH ROW
BEGIN
     IF OLD.id_commande != NEW.id_commande THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La modification de la référence commande est interdite.';
     END IF;
END//


-- location_check_overlap --

CREATE OR REPLACE TRIGGER trigger_location_check_overlap
BEFORE INSERT ON LOCATION
FOR EACH ROW
BEGIN
     DECLARE overlap_count INT;
     
     -- Vérifier les chevauchements de location pour chaque balai de cette commande
     SELECT COUNT(*) INTO overlap_count
     FROM DETAIL_LOCATION dl
     INNER JOIN LOCATION l ON l.id_commande = dl.id_location
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

-- location_after_delete_cascade --

CREATE OR REPLACE TRIGGER trigger_location_after_delete_cascade
AFTER DELETE ON LOCATION
FOR EACH ROW
BEGIN
     DELETE FROM DETAIL_LOCATION WHERE id_location = OLD.id_commande;
END//

-- MOLDU --

-- check_moldu_nb_phone --

CREATE OR REPLACE TRIGGER trigger_check_moldu_nb_phone
BEFORE INSERT ON MOLDU
FOR EACH ROW
BEGIN
     IF check_nb_phone(NEW.tel3, NEW.tel2) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le numéro de téléphone 3 ne peut être renseigné sans le numéro 2';
     END IF;
END//

CREATE OR REPLACE TRIGGER trigger_check_moldu_nb_phone_update
BEFORE UPDATE ON MOLDU
FOR EACH ROW
BEGIN
     IF check_nb_phone(NEW.tel3, NEW.tel2) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le numéro de téléphone 3 ne peut être renseigné sans le numéro 2';
     END IF;
END//

-- moldu_before_delete --

CREATE OR REPLACE TRIGGER trigger_moldu_before_delete
BEFORE DELETE ON MOLDU
FOR EACH ROW
BEGIN
     DECLARE magic_broom_count INT;
     
     SELECT COUNT(*) INTO magic_broom_count
     FROM COMMANDE c
     WHERE c.id_client = OLD.id_client
     AND (
          -- Vérification pour les locations avec balais magiques
          EXISTS (
               SELECT 1
               FROM DETAIL_LOCATION dl
               INNER JOIN BALAI b ON b.id_balai = dl.id_balai
               INNER JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
               WHERE dl.id_location = c.LOCATION
          )
          OR
          -- Vérification pour les ventes avec balais magiques
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

-- moldu_before_update_id --

CREATE OR REPLACE TRIGGER trigger_moldu_before_update_id
BEFORE UPDATE ON MOLDU
FOR EACH ROW
BEGIN
     IF OLD.id_client != NEW.id_client THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La modification de la référence client est interdite.';
     END IF;
END//

-- moldu_after_insert --

CREATE OR REPLACE TRIGGER trigger_moldu_after_insert
AFTER INSERT ON MOLDU
FOR EACH ROW
BEGIN
     DECLARE client_exists INT;
     DECLARE is_moldu INT;
     
     SELECT COUNT(*) INTO client_exists
     FROM CLIENT
     WHERE id_client = NEW.id_client;
     
     IF client_exists = 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le client associé n''existe pas.';
     END IF;
     
     -- Vérifier que le client est bien marqué comme Moldu
     UPDATE CLIENT 
     SET MOLDU = NEW.id_client 
     WHERE id_client = NEW.id_client AND MOLDU IS NULL;
END//

-- moldu_after_delete --
CREATE OR REPLACE TRIGGER trigger_moldu_after_delete
AFTER DELETE ON MOLDU
FOR EACH ROW
BEGIN
     UPDATE CLIENT 
     SET MOLDU = NULL 
     WHERE id_client = OLD.id_client;
END//

-- SORCIER --

-- check_sorcier_nb_owl --

CREATE OR REPLACE TRIGGER trigger_check_sorcier_nb_owl
BEFORE INSERT ON SORCIER
FOR EACH ROW
BEGIN
     IF check_nb_phone(NEW.Owls_number3, NEW.Owls_number2) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le numéro de chouette 3 ne peut être renseigné sans le numéro 2';
     END IF;
END//

CREATE OR REPLACE TRIGGER trigger_check_sorcier_nb_owl_update
BEFORE UPDATE ON SORCIER
FOR EACH ROW
BEGIN
     IF check_nb_phone(NEW.Owls_number3, NEW.Owls_number2) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Le numéro de chouette 3 ne peut être renseigné sans le numéro 2';
     END IF;
END//

-- sorcier_before_delete --

CREATE OR REPLACE TRIGGER trigger_sorcier_before_delete
BEFORE DELETE ON SORCIER
FOR EACH ROW
BEGIN
     DECLARE active_rental_count INT;
     
     SELECT COUNT(*) INTO active_rental_count
     FROM COMMANDE c
     INNER JOIN LOCATION l ON l.id_commande = c.LOCATION
     WHERE c.id_client = OLD.id_client
          AND l.status = 'in Progress';
     
     IF active_rental_count > 0 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Impossible de supprimer un sorcier qui a des locations en cours.';
     END IF;
END//

-- sorcier_before_update_id --

CREATE OR REPLACE TRIGGER trigger_sorcier_before_update_id
BEFORE UPDATE ON SORCIER
FOR EACH ROW
BEGIN
     IF OLD.id_client != NEW.id_client THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La modification de la référence client est interdite.';
     END IF;
END//

-- sorcier_after_insert --

CREATE OR REPLACE TRIGGER trigger_sorcier_after_insert
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

-- sorcier_after_delete --

CREATE OR REPLACE TRIGGER trigger_sorcier_after_delete
AFTER DELETE ON SORCIER
FOR EACH ROW
BEGIN
     UPDATE CLIENT 
     SET SORCIER = NULL 
     WHERE id_client = OLD.id_client;
END//

-- sorcier_check_license_for_magical_broom --

CREATE OR REPLACE TRIGGER trigger_sorcier_check_license_for_magical_broom
BEFORE UPDATE ON SORCIER
FOR EACH ROW
BEGIN
     DECLARE magic_broom_required INT;
     DECLARE has_orders INT;

     -- Vérifier s'il existe des commandes pour ce client
     SELECT COUNT(*) INTO has_orders
     FROM COMMANDE c 
     WHERE c.id_client = NEW.id_client;
     
     IF has_orders > 0 THEN 
          -- Vérifier le niveau de licence requis maximum
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
                    WHERE dl.id_location = c.LOCATION
               )
          );
          
          IF magic_broom_required IS NOT NULL AND NEW.Flight_licence < magic_broom_required THEN
               SIGNAL SQLSTATE '45000'
               SET MESSAGE_TEXT = 'Le sorcier n''a pas la licence requise pour posséder ou utiliser certains de ses balais magiques.';
          END IF;
     END IF;
END//


-- VENTE --

-- check_vente_date --

CREATE OR REPLACE TRIGGER trigger_check_vente_date
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

CREATE OR REPLACE TRIGGER trigger_check_vente_date_update
BEFORE UPDATE ON VENTE
FOR EACH ROW
BEGIN
     IF NEW.sale_date > CURDATE() THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La date de vente ne peut pas être dans le futur.';
     END IF;
END//

-- check_vente_command_type --

CREATE OR REPLACE TRIGGER trigger_check_vente_command_type
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

CREATE OR REPLACE TRIGGER trigger_check_vente_command_type_update
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

-- check_vente_has_details --

CREATE OR REPLACE TRIGGER trigger_check_vente_has_details_update
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

-- check_vente_client_money --

CREATE OR REPLACE TRIGGER trigger_check_vente_client_money
BEFORE INSERT ON VENTE
FOR EACH ROW
BEGIN
     DECLARE total_amount DECIMAL(10,2);
     DECLARE client_balance DECIMAL(10,2);
     DECLARE client_id INT;
     
     SELECT id_client INTO client_id
     FROM COMMANDE
     WHERE id_commande = NEW.id_commande;
     
     -- Calculer le montant total de la vente en utilisant sale_price des balais
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

-- can't modify vente --

CREATE OR REPLACE TRIGGER trigger_vente_before_update
BEFORE UPDATE ON VENTE
FOR EACH ROW
BEGIN
     SIGNAL SQLSTATE '45000'
     SET MESSAGE_TEXT = 'La date de vente ne peut pas être modifiée après création.';
END//


-- vente_before_delete --

CREATE OR REPLACE TRIGGER trigger_vente_before_delete
BEFORE DELETE ON VENTE
FOR EACH ROW
BEGIN
     DECLARE days_since_sale INT;
     
     SELECT DATEDIFF(CURDATE(), OLD.sale_date) INTO days_since_sale;
     
     -- On ne peut annuler une vente que dans les 30 jours
     IF days_since_sale > 30 THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Impossible d''annuler une vente de plus de 30 jours.';
     END IF;
END//


-- vente_before_update_id --

CREATE OR REPLACE TRIGGER trigger_vente_before_update_id
BEFORE UPDATE ON VENTE
FOR EACH ROW
BEGIN
     IF OLD.id_commande != NEW.id_commande THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'La modification de la référence commande est interdite.';
     END IF;
END//


-- DETAIL_LOCATION --

-- detail_location_after_delete --

CREATE OR REPLACE TRIGGER trigger_detail_location_after_delete
AFTER DELETE ON DETAIL_LOCATION
FOR EACH ROW
BEGIN
     DECLARE active_rentals INT;
     
     SELECT COUNT(*) INTO active_rentals
     FROM DETAIL_LOCATION dl
     INNER JOIN LOCATION l ON dl.id_location = l.id_commande
     WHERE dl.id_balai = OLD.id_balai
          AND l.status = 'in Progress';
     
     IF active_rentals = 0 THEN
          UPDATE BALAI
          SET status = 'in stock'
          WHERE id_balai = OLD.id_balai;
     END IF;
END//

DELIMITER ;


-- Vue Section 
-- _______________ 

-- Chiffre d'affaire des ventes
CREATE VIEW ca_ventes_detail AS
SELECT 
     v.sale_date as date,
     COALESCE(SUM(b.sale_price), 0) as total_ca_ventes
FROM BALAI b
JOIN VENTE v ON b.id_vente = v.id_commande
GROUP BY v.sale_date;

-- Chiffre d'affaire des locations
CREATE VIEW ca_locations_detail AS
SELECT 
     l.begin_date as date,
     l.id_commande,
     COALESCE(SUM(
          b.location_price * 
          CASE 
               WHEN l.actual_end_date IS NOT NULL 
               THEN DATEDIFF(l.actual_end_date, l.begin_date)
               ELSE DATEDIFF(l.end_date, l.begin_date)
          END
     ), 0) as ca_location
FROM LOCATION l
JOIN DETAIL_LOCATION dl ON dl.id_location = l.id_commande
JOIN BALAI b ON b.id_balai = dl.id_balai
WHERE l.status IN ('in Progress', 'Finished')
GROUP BY l.begin_date, l.id_commande;

-- Dépenses fournisseurs
CREATE VIEW depenses_fournisseurs AS
SELECT 
     cf.command_date as date,
     cf.id_commande,
     COALESCE(SUM(b.purchase_price), 0) as total_depenses
FROM COMMANDE_FOURNISSEUR cf
JOIN BALAI b ON b.id_commande_fournisseur = cf.id_commande
WHERE cf.status NOT LIKE '%Pending%'
GROUP BY cf.command_date, cf.id_commande;

-- Statistiques mensuelles
CREATE VIEW stats_mensuelles AS
WITH RECURSIVE months AS (
     SELECT MIN(date) as month_date FROM (
          SELECT sale_date as date FROM VENTE
          UNION
          SELECT command_date FROM COMMANDE_FOURNISSEUR
          UNION
          SELECT begin_date FROM LOCATION
     ) all_dates
     
     UNION ALL
     
     SELECT DATE_ADD(month_date, INTERVAL 1 MONTH)
     FROM months
     WHERE month_date < (SELECT MAX(date) FROM (
          SELECT sale_date as date FROM VENTE
          UNION
          SELECT command_date FROM COMMANDE_FOURNISSEUR
          UNION
          SELECT end_date FROM LOCATION
     ) max_dates)
)
SELECT 
     DATE_FORMAT(m.month_date, '%Y-%m') as month,
     COALESCE((
          SELECT SUM(total_ca_ventes)
          FROM ca_ventes_detail 
          WHERE DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(m.month_date, '%Y-%m')
     ), 0) as ca_ventes,
     COALESCE((
          SELECT SUM(ca_location)
          FROM ca_locations_detail
          WHERE DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(m.month_date, '%Y-%m')
     ), 0) as ca_locations,
     COALESCE((
          SELECT SUM(total_depenses)
          FROM depenses_fournisseurs
          WHERE DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(m.month_date, '%Y-%m')
     ), 0) as depenses
FROM months m;

-- dépenses fournisseurs
CREATE VIEW depenses_par_fournisseur AS
SELECT 
     f.name as fournisseur_name,
     f.id_fabricant,
     DATE(cf.command_date) as command_date,
     COALESCE(SUM(b.purchase_price), 0) as total_depenses
FROM FABRICANT f
JOIN BALAI b ON b.id_fabricant = f.id_fabricant
JOIN COMMANDE_FOURNISSEUR cf ON b.id_commande_fournisseur = cf.id_commande
WHERE cf.status NOT LIKE '%Pending%'
GROUP BY f.id_fabricant, f.name, DATE(cf.command_date);

-- stats par vendeur
CREATE VIEW stats_par_vendeur AS
SELECT 
     e.id_employee,
     e.name,
     e.surname,
     CASE WHEN e.id_patron IS NULL THEN 1 ELSE 0 END as is_patron,
     v.sale_date,
     l.begin_date,
     v.id_commande as vente_id,
     l.id_commande as location_id,
     b_vente.sale_price
FROM EMPLOYEE e
LEFT JOIN COMMANDE c ON e.id_employee = c.id_employee
LEFT JOIN VENTE v ON c.id_commande = v.id_commande
LEFT JOIN BALAI b_vente ON b_vente.id_vente = v.id_commande
LEFT JOIN LOCATION l ON c.id_commande = l.id_commande;

-- stats balai plus vendu
CREATE VIEW top_balais_vendus AS
SELECT 
     b.Libelle as broom_name,
     COUNT(*) as quantity,
     DATE(v.sale_date) as sale_date
FROM VENTE v
JOIN COMMANDE c ON v.id_commande = c.id_commande
JOIN BALAI b ON b.id_vente = c.id_commande
GROUP BY b.Libelle, DATE(v.sale_date);


-- Insertion de données 
-- _______________ 

-- Insertion des FABRICANT

INSERT INTO FABRICANT (id_fabricant, name, Mail) VALUES
(1, 'Nimbus Racing Broom Company', 'contact@nimbus.com'),
(2, 'Comet Trading Company', 'info@comet.com'),
(3, 'Firebolt Industries', 'sales@firebolt.com'),
(4, 'Cleansweep Broom Company', 'support@cleansweep.com'),
(5, 'Moontrimmer Manufacturing', 'hello@moontrimmer.com');

-- Insertion des EMPLOYEE

INSERT INTO EMPLOYEE (id_employee, login, password, actif, name, surname, mail_pro, tel1, tel2, tel3, id_patron) VALUES
(1, 'albus.dumbledore', '$2b$12$g9x9A4l0uph5vDxbQDeH0uqagyoMhK6XR/Gc/SNWIuUJNBJ6hNgyK', '0', 'Albus', 'Dumbledore', 'albus.dumbledore@magic.com', '+44 20 1234 5678', NULL, NULL, NULL),
(2, 'minerva.mcgonagall', '$2b$12$udtwvXift3PQzMSARV57k.XPMuPdXEB390XU2YPY4/XSDPnP1y6By', '0', 'Minerva', 'McGonagall', 'minerva.mcgonagall@magic.com', '+44 20 1234 5679', '+44 20 1234 5680', NULL, 1),
(3, 'severus.snape', '$2b$12$dYlX1JBavpvtfxBC3bHTgehHA3VBeyFJSVlFEyvDLGVLfJbr5/KTO', '0', 'Severus', 'Snape', 'severus.snape@magic.com', '+44 20 1234 5681', NULL, NULL, 1),
(4, 'filius.flitwick', '$2b$12$lHWjskHwpNK78aZDlGk//ujO94Hpd6DsLnPQXqB7K2wBbw7dS57IC', '0', 'Filius', 'Flitwick', 'filius.flitwick@magic.com', '+44 20 1234 5682', '+44 20 1234 5683', '+44 20 1234 5684', 1),
(5, 'pomona.spout', '$2b$12$5GdeL8ODg0ykCvZplwkw1u9xRvRdsqUXifOIh2JE..Y5DJdSk6djq', '0', 'Pomona', 'Spout', 'pomona.spout@magic.com', '+44 20 1234 5685', NULL, NULL, 1),
(6, 'zd1', '$2b$12$cYRwpvqw2ZXL0n4ZByuLVOssZGRufXojx4vDgqyxB9WXFvxurs.Iu', '0', 'zd', 'zdt', 'zd@gmail.com', '+32475351091', NULL, NULL, 1);

-- Insertion des CLIENT

INSERT INTO CLIENT (id_client, name, surname, birth_date, money, id_employee, SORCIER, MOLDU) VALUES
(1, 'Harry', 'Potter', '1980-07-31', 15000.00, 2, 1, NULL),
(2, 'Hermione', 'Granger', '1979-09-19', 12000.00, 2, 1, NULL),
(3, 'Ron', 'Weasley', '1980-03-01', 8000.00, 3, 1, NULL),
(4, 'Draco', 'Malfoy', '1980-06-05', 25000.00, 4, 1, NULL),
(5, 'Luna', 'Lovegood', '1981-02-13', 5000.00, 5, 1, NULL),
(6, 'Neville', 'Longbottom', '1980-07-30', 7000.00, 2, 1, NULL),
(7, 'John', 'Smith', '1990-05-15', 3000.00, 3, NULL, 7),
(8, 'Emma', 'Johnson', '1992-08-22', 4500.00, 4, NULL, 8),
(9, 'Michael', 'Brown', '1988-11-30', 6200.00, 5, NULL, 9),
(10, 'Sarah', 'Wilson', '1995-03-10', 2800.00, 2, NULL, 10);

-- Insertion des COMMANDE_FOURNISSEUR

INSERT INTO COMMANDE_FOURNISSEUR (id_commande, status, command_date, expected_delivery_date, actual_delivery_date, id_vendeur, id_patron) VALUES
(1, 'Finished', '2026-01-01', '2026-01-10', '2026-01-08', 2, 1),
(2, 'Finished', '2026-01-15', '2026-01-25', '2026-01-22', 3, 1),
(3, 'In transit', '2026-03-01', '2026-03-15', NULL, 4, 1),
(4, 'Processing', '2026-04-10', '2026-04-20', NULL, 5, 1),
(5, 'Processing', '2026-05-01', '2026-05-10', NULL, 2, 6),
(8, 'Pending Approuval', '2026-04-27', '2026-05-11', NULL, 1, 1),
(9, 'Processing', '2026-04-29', '2026-05-13', NULL, 1, 1);

-- Insertion des COMMANDE

INSERT INTO COMMANDE (id_commande, id_employee, id_client, VENTE, `LOCATION`) VALUES
(1, 2, 1, 1, NULL),
(2, 3, 2, 2, NULL),
(3, 4, 4, 3, NULL),
(4, 2, 3, NULL, 4),
(5, 5, 5, 5, NULL),
(6, 3, 7, 6, NULL),
(7, 4, 6, NULL, 7),
(8, 2, 8, NULL, 8),
(9, 5, 1, 9, NULL),
(10, 3, 9, NULL, 10),
(16, 1, 6, NULL, 16),
(17, 1, 1, 17, NULL),
(18, 1, 1, 18, NULL),
(19, 1, 1, NULL, 19);

-- Insertion des VENTE

INSERT INTO VENTE (id_commande, sale_date) VALUES
(1, '2026-01-15'),
(2, '2026-02-20'),
(3, '2026-03-10'),
(5, '2026-04-05'),
(6, '2025-05-12'),
(9, '2025-05-18'),
(17, '2026-04-29'),
(18, '2026-05-01');


-- Insertion des BALAI

INSERT INTO BALAI (id_balai, Libelle, description, img, uses_number, sale_price, location_price, purchase_price, wear, status, id_commande_fournisseur, id_vente, id_fabricant, BALAI_MAGIQUE) VALUES
(1, 'Nimbus 2000', 'Le classique de Quidditch', '/images/nimbus2000.jpg', 25, 149.99, 29.99, 119.99, 15, 'sold', 1, 1, 1, 1),
(2, 'Comet 260', 'Excellent rapport qualité-prix', '/images/comet260.jpg', 11, 89.50, 19.99, 71.60, 5, 'sold', 2, 2, 2, 1),
(3, 'Firebolt Supreme', 'La vitesse incarnée', '/images/firebolt.jpg', 6, 299.99, 49.99, 239.99, 0, 'sold', 2, 1, 3, 1),
(4, 'Cleansweep Seven', 'Fiable et robuste', '/images/cleansweep7.jpg', 41, 199.00, 34.99, 159.20, 45, 'sold', 1, 3, 4, 1),
(5, 'Moontrimmer Starter', 'Idéal pour débutants', '/images/moontrimmer.jpg', 4, 59.90, 12.99, 47.92, 2, 'sold', 2, 5, 5, 0),
(6, 'Nimbus 2001', 'Version améliorée du 2000', '/images/nimbus2001.jpg', 13, 449.99, 69.99, 359.99, 8, 'sold', 2, 6, 1, 1),
(7, 'Comet 180', 'Modèle économique', '/images/comet180.jpg', 56, 124.50, 24.99, 99.60, 65, 'sold', 2, 5, 2, 0),
(8, 'Silver Arrow', 'Modèle vintage', '/images/silverarrow.jpg', 9, 79.90, 15.99, 63.92, 10, 'in location', 1, NULL, 3, 0),
(9, 'Firebolt Classic', 'Le légendaire', '/images/fireboltclassic.jpg', 3, 349.99, 59.99, 279.99, 0, 'arriving', 3, NULL, 3, 1),
(10, 'Cleansweep Five', 'Collection limitée', '/images/cleansweep5.jpg', 31, 99.00, 19.99, 79.20, 30, 'in location', 2, NULL, 4, 0),
(11, 'Nimbus 1500', 'Historique, pour collectionneurs', '/images/nimbus1500.jpg', 120, 159.99, 14.99, 127.99, 85, 'arriving', 4, NULL, 1, 0),
(12, 'Tinderblast', 'Pour jeunes sorciers', '/images/tinderblast.jpg', 2, 49.90, 9.99, 39.92, 0, 'sold', 2, 5, 5, 0),
(13, 'Starsweeper XXI', 'Luxe et performance', '/images/starsweeper.jpg', 5, 399.99, 74.99, 319.99, 5, 'arriving', 5, NULL, 4, 1),
(14, 'Moontrimmer Pro', 'Pour professionnels', '/images/moontrimmerpro.jpg', 8, 179.50, 29.99, 143.60, 12, 'in location', 2, NULL, 5, 0),
(15, 'Shooting Star', 'Entrée de gamme', '/images/shootingstar.jpg', 89, 79.99, 9.99, 63.99, 90, 'sold', 2, 5, 2, 0),
(16, 'Swiftstick', 'Nouveau modèle 2024', '/images/swiftstick.jpg', 1, 129.99, 24.99, 103.99, 0, 'in location', 2, NULL, 1, 1),
(17, 'Thunderbolt', 'Puissance extrême', '/images/thunderbolt.jpg', 0, 219.99, 39.99, 175.99, 0, 'arriving', 3, NULL, 3, 1),
(18, 'Whirlwind', 'Pour vol acrobatique', '/images/whirlwind.jpg', 0, 89.99, 17.99, 71.99, 0, 'in stock', 2, NULL, 4, 0),
(19, 'Starlight', 'Élégant et rapide', '/images/starlight.jpg', 1, 159.90, 29.90, 127.92, 0, 'in location', 2, NULL, 2, 1),
(20, 'Breeze', 'Pour promenades tranquilles', '/images/breeze.jpg', 0, 59.99, 9.99, 47.99, 0, 'sold', 2, 17, 5, 0),
(21, 'Phoenix Fire', 'Balai légendaire', '/images/phoenixfire.jpg', 0, 299.00, 59.99, 239.20, 0, 'sold', 2, 17, 3, 1),
(22, 'Shadow Chaser', 'Rapide et discret', '/images/shadowchaser.jpg', 0, 199.99, 39.99, 159.99, 0, 'in location', 2, NULL, 4, 0),
(23, 'Golden Snitch', 'Vitesse éclair', '/images/goldensnitch.jpg', 0, 499.99, 99.99, 399.99, 0, 'in stock', 2, NULL, 1, 1),
(24, 'Misty Dawn', 'Vol matinal paisible', '/images/mistydawn.jpg', 0, 79.99, 14.99, 63.99, 0, 'in stock', 2, NULL, 5, 0),
(25, 'Crystal Breeze', 'Élégant et raffiné', '/images/crystalbreeze.jpg', 0, 149.90, 29.90, 119.92, 0, 'sold', 2, 18, 2, 1),
(26, 'Firebolt Classic', 'Le légendaire', '/images/fireboltclassic.jpg', 0, 349.99, 59.99, 279.99, 0, 'arriving', 4, NULL, 3, NULL),
(27, 'Firebolt Classic', 'Le légendaire', '/images/fireboltclassic.jpg', 0, 349.99, 59.99, 279.99, 0, 'arriving', 8, NULL, 3, NULL),
(28, 'Nimbus 1500', 'Historique, pour collectionneurs', '/images/nimbus1500.jpg', 0, 159.99, 14.99, 127.99, 0, 'arriving', 3, NULL, 1, NULL),
(29, 'Swiftstick', 'Nouveau modèle 2024', '/images/swiftstick.jpg', 0, 129.99, 24.99, 103.99, 0, 'arriving', 9, NULL, 1, NULL);

-- Insertion des `LOCATION`

INSERT INTO `LOCATION` (id_commande, begin_date, end_date, actual_end_date, status) VALUES
(4, '2026-06-01', '2026-06-15', '2026-06-14', 'Finished'),
(7, '2026-07-01', '2026-07-10', NULL, 'in Progress'),
(8, '2026-07-15', '2026-07-25', NULL, 'Pending'),
(10, '2026-08-01', '2026-08-08', NULL, 'Pending'),
(16, '2026-04-27', '2026-04-30', '2026-04-27', 'Finished'),
(19, '2026-05-02', '2026-05-14', NULL, 'Pending');

-- Insertion des BALAI_MAGIQUE

INSERT INTO BALAI_MAGIQUE (id_balai, Flight_licence_required, speed, magic_component) VALUES
(1, 2, 120, 'Phoenix feather core'),
(2, 1, 95, 'Unicorn hair'),
(3, 5, 200, 'Dragon heartstring, Thestral tail hair'),
(4, 2, 110, 'Phoenix feather'),
(6, 3, 150, 'Thunderbird feather'),
(9, 5, 185, 'Dragon heartstring, Basilisk fang powder'),
(13, 4, 170, 'Kelpie mane, Phoenix feather'),
(16, 3, 140, 'Griffin claw powder'),
(17, 5, 210, 'Dragon heartstring, Thunderbird feather'),
(19, 3, 130, 'Unicorn hair, Phoenix feather'),
(21, 5, 195, 'Phoenix feather, Basilisk fang'),
(23, 5, 225, 'Dragon heartstring, Thunderbird tail'),
(25, 4, 160, 'Kelpie mane, Unicorn hair'),
(26, 5, 185, 'Dragon heartstring, Basilisk fang powder'),
(27, 5, 185, 'Dragon heartstring, Basilisk fang powder'),
(29, 3, 140, 'Griffin claw powder');

-- Insertion des SORCIER

INSERT INTO SORCIER (id_client, Wizard_registry_number, Chimney, Add_School_name, Add_House, Add_Country, Flight_licence, Owls_number1, Owls_number2, Owls_number3) VALUES
(1, 1001, '4 Privet Drive', 'Hogwarts', 'Gryffindor', 'United Kingdom', 5, 'OWL-1001', 'OWL-1001-2', NULL),
(2, 1002, '12 Grimmauld Place', 'Hogwarts', 'Gryffindor', 'United Kingdom', 5, 'OWL-1002', NULL, NULL),
(3, 1003, 'The Burrow', 'Hogwarts', 'Gryffindor', 'United Kingdom', 4, 'OWL-1003', 'OWL-1003-2', 'OWL-1003-3'),
(4, 1004, 'Malfoy Manor', 'Hogwarts', 'Slytherin', 'United Kingdom', 5, 'OWL-1004', 'OWL-1004-2', NULL),
(5, 1005, 'Rookery', 'Hogwarts', 'Ravenclaw', 'United Kingdom', 3, 'OWL-1005', NULL, NULL),
(6, 1006, 'Longbottom Manor', 'Hogwarts', 'Gryffindor', 'United Kingdom', 4, 'OWL-1006', 'OWL-1006-2', NULL);

-- Insertion des MOLDU

INSERT INTO MOLDU (id_client, National_register_number, Mail, Add_Street, Add_City, Add_House_number, Add_Country, tel1, tel2, tel3) VALUES
(7, 9001, 'john.smith@example.com', '123 Muggle Street', 'London', '45A', 'United Kingdom', '+44 20 1111 2222', NULL, NULL),
(8, 9002, 'emma.johnson@example.com', '456 Non-magic Road', 'Manchester', '12B', 'United Kingdom', '+44 20 3333 4444', '+44 20 3333 4445', NULL),
(9, 9003, 'michael.brown@example.com', '789 Ordinary Avenue', 'Birmingham', '78C', 'United Kingdom', '+44 20 5555 6666', NULL, NULL),
(10, 9004, 'sarah.wilson@example.com', '321 Normal Boulevard', 'Liverpool', '9D', 'United Kingdom', '+44 20 7777 8888', '+44 20 7777 8889', '+44 20 7777 8890');


-- Insertion des DETAIL_LOCATION

INSERT INTO DETAIL_LOCATION (id_location, id_balai) VALUES
(4, 14),
(7, 8),
(7, 18),
(8, 10),
(10, 16),
(10, 19),
(16, 24),
(19, 22);

-- Role Section 
-- _______________ 

-- Patron --
CREATE ROLE  IF NOT EXISTS 'patron';
GRANT ALL PRIVILEGES ON bdd.* TO 'patron' WITH GRANT OPTION;



-- Vendeur --
CREATE ROLE  IF NOT EXISTS 'vendeur';

GRANT SELECT, INSERT, UPDATE, DELETE ON bdd.CLIENT TO 'vendeur';
GRANT SELECT, INSERT, UPDATE, DELETE ON bdd.MOLDU TO 'vendeur';
GRANT SELECT, INSERT, UPDATE, DELETE ON bdd.SORCIER TO 'vendeur';
GRANT SELECT, INSERT, UPDATE, DELETE ON bdd.COMMANDE TO 'vendeur';
GRANT SELECT, INSERT, UPDATE, DELETE ON bdd.VENTE TO 'vendeur';
GRANT SELECT, INSERT, UPDATE, DELETE ON bdd.LOCATION TO 'vendeur';
GRANT SELECT, INSERT, UPDATE, DELETE ON bdd.DETAIL_LOCATION TO 'vendeur';

GRANT SELECT, INSERT, UPDATE ON bdd.BALAI TO 'vendeur';
GRANT SELECT, INSERT, UPDATE ON bdd.BALAI_MAGIQUE TO 'vendeur';
GRANT SELECT, INSERT ON bdd.COMMANDE_FOURNISSEUR TO 'vendeur';
GRANT SELECT ON bdd.EMPLOYEE TO 'vendeur';
GRANT SELECT ON bdd.FABRICANT TO 'vendeur';

-- Comptable / statisticien --
CREATE ROLE  IF NOT EXISTS 'comptable';

GRANT SELECT ON bdd.* TO 'comptable'; 


-- USER Section 
-- _______________ 

CREATE USER IF NOT EXISTS 'albus.dumbledore'@'localhost'
     IDENTIFIED BY '$2b$12$g9x9A4l0uph5vDxbQDeH0uqagyoMhK6XR/Gc/SNWIuUJNBJ6hNgyK';


CREATE USER IF NOT EXISTS  'minerva.mcgonagall'@'localhost'
     IDENTIFIED BY '$2b$12$udtwvXift3PQzMSARV57k.XPMuPdXEB390XU2YPY4/XSDPnP1y6By';


CREATE USER IF NOT EXISTS  'severus.snape'@'localhost'
     IDENTIFIED BY '$2b$12$dYlX1JBavpvtfxBC3bHTgehHA3VBeyFJSVlFEyvDLGVLfJbr5/KTO';


CREATE USER IF NOT EXISTS 'filius.flitwick'@'localhost'
     IDENTIFIED BY '$2b$12$lHWjskHwpNK78aZDlGk//ujO94Hpd6DsLnPQXqB7K2wBbw7dS57IC';


CREATE USER IF NOT EXISTS 'pomona.spout'@'localhost'
     IDENTIFIED BY '$2b$12$5GdeL8ODg0ykCvZplwkw1u9xRvRdsqUXifOIh2JE..Y5DJdSk6djq';


CREATE USER IF NOT EXISTS 'zd1'@'localhost'
     IDENTIFIED BY '$2b$12$cYRwpvqw2ZXL0n4ZByuLVOssZGRufXojx4vDgqyxB9WXFvxurs.Iu' ;


GRANT 'patron' TO 'albus.dumbledore'@'localhost';
GRANT 'vendeur' TO 'minerva.mcgonagall'@'localhost';
GRANT 'vendeur' TO 'severus.snape'@'localhost';
GRANT 'vendeur' TO 'filius.flitwick'@'localhost';
GRANT 'comptable' TO 'pomona.spout'@'localhost';
GRANT 'comptable' TO 'zd1'@'localhost';


SET DEFAULT ROLE 'patron' FOR 'albus.dumbledore'@'localhost';
SET DEFAULT ROLE 'vendeur' FOR 'minerva.mcgonagall'@'localhost';
SET DEFAULT ROLE 'vendeur' FOR 'severus.snape'@'localhost';
SET DEFAULT ROLE 'vendeur' FOR 'filius.flitwick'@'localhost';
SET DEFAULT ROLE 'comptable' FOR 'pomona.spout'@'localhost';
SET DEFAULT ROLE 'comptable' FOR 'zd1'@'localhost';

-- Trigger bloquant insertion
-- ___________________________

-- check_location_dates --
DELIMITER //

CREATE OR REPLACE TRIGGER trigger_check_location_dates
BEFORE INSERT ON LOCATION
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

-- detail_location_before_insert --

CREATE OR REPLACE TRIGGER trigger_detail_location_before_insert
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

CREATE OR REPLACE TRIGGER trigger_detail_location_before_update
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

DELIMITER ;
