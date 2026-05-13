from os import getenv
from decimal import Decimal
import re
import pymysql
from pymysql import Error
from typing import Any, Optional, Dict, List
from datetime import date, datetime
from BD.models import Employee, Client, Reservation

class DAOMySQL:

    def __init__(self, host: str , port: int,
                 user: str , password: str ,
                 database: str ):
        """Initialise la connexion à la base de données MySQL"""
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.database = database


    def _get_connection(self, identifiant : Optional[tuple[str,str]]):
        """Établit une connexion à la base de données MySQL"""
        try:
            user = self.user
            password = self.password
            if identifiant :
                user = identifiant[0]
                password = identifiant[1]

            conn = pymysql.connect(
                host=self.host,
                port=self.port,
                user= user,
                password= password,
                database=self.database,
                autocommit=False,
                connect_timeout=10
            )
            return conn
        except pymysql.Error as e:
            print(f"Erreur de connexion MySQL: {e}")
            print(f"Tentative de connexion à {self.host}:{self.port} avec l'utilisateur {user}")
            raise


    def iso_format(self, row : dict[str, Any]):
        for key, value in row.items():
            if isinstance(value, date):
                row[key] = value.isoformat()
            elif isinstance(value, Decimal):
                row[key] = float(value)
        return row


    def is_patron(self, identifiant : tuple[str,str] , id_employee: int) -> bool:
        """Vérifie si un employé est un patron"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("""
            SELECT id_patron IS NULL as is_patron
            FROM EMPLOYEE WHERE id_employee = %s
        """, (id_employee,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result['is_patron'] == 1 if result else False


    def login(self, id_employee: int) -> bool:
        """Connecte un employé"""
        conn = self._get_connection(None)
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT id_employee FROM EMPLOYEE WHERE id_employee = %s", (id_employee,))
            if not cursor.fetchone():
                return False
            
            cursor.execute("""
                UPDATE EMPLOYEE
                SET actif = 1 , last_login = %s
                WHERE id_employee = %s
            """, (datetime.now().isoformat(), id_employee,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            print(f"Login error for employee {id_employee}: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    def connected(self , id_employee : Optional[int]):
        """ Mets à jour la dernière connexion. Si dernière connexion > 30 min mets actif à 0"""
        conn = self._get_connection(None)
        cursor = conn.cursor()
        try:
            if id_employee :
                cursor.execute("""
                    UPDATE EMPLOYEE
                    SET last_login = %s
                    WHERE id_employee = %s
                """, (datetime.now().isoformat(), id_employee,))
            else :
                cursor.execute("""
                    UPDATE EMPLOYEE 
                    SET actif = 0 
                    WHERE TIMESTAMPDIFF(MINUTE, last_login, NOW()) > %s;
                    """,(getenv("ACCESS_TOKEN_EXPIRE_MINUTES")))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            print(f"Connected error for employee {id_employee}: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    def logout(self, id_employee: int) -> bool:
        """Déconnecte un employé"""
        conn = self._get_connection(None)
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT id_employee FROM EMPLOYEE WHERE id_employee = %s", (id_employee,))
            if not cursor.fetchone():
                return False
            
            cursor.execute("""
                UPDATE EMPLOYEE
                SET actif = 0 , last_login = %s
                WHERE id_employee = %s
            """, (date.today().isoformat(), id_employee,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            print(f"Logout error for employee {id_employee}: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    def grant(self, username : str , password : str, role : str):
        conn = self._get_connection(None)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE USER IF NOT EXISTS %s@'localhost'
                IDENTIFIED BY %s 
        """,(username, password ,))

        cursor.execute("""
            GRANT %s TO %s@'localhost'
        """,(role, username,))

        cursor.execute("""
            SET DEFAULT ROLE %s FOR %s@'localhost'
        """,(role, username,))

        cursor.close()
        conn.close()
        return


    def revoke(self, username: str, role : str):
        conn = self._get_connection(None)
        cursor = conn.cursor()

        cursor.execute("""
            REVOKE %s FROM %s@'localhost'
            """,(role, username,))

        cursor.close()
        conn.close()
        return


    def get_role(self, username : str) -> str:
        """ Recupère le Role dans la bdd de l'employee """
        conn = self._get_connection(None)
        cursor = conn.cursor()

        cursor.execute("SHOW GRANTS FOR %s@localhost ;",(username,))

        grants = cursor.fetchall()
        roles = []
        for grant in grants:
            grant_text = grant[0]
            match = re.search(r"GRANT\s+`(\w+)`\s+TO", grant_text)
            if match:
                roles.append(match.group(1))

        role = roles[0] if roles else None

        cursor.close()
        conn.close()
        return role


    # --- Méthodes pour les EMPLOYES ---

    def get_employee_by_email(self, identifiant : tuple[str,str] , email: str) -> Optional[Dict]:
        """Récupère un employé par son email"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("""
            SELECT id_employee, login, password, actif, name, surname, 
                    mail_pro, tel1, tel2, tel3, id_patron
            FROM EMPLOYEE WHERE mail_pro = %s
        """, (email,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result if result else None


    def get_employee_by_login(self, identifiant : tuple[str,str] , login: str) -> Optional[Dict]:
        """Récupère un employé par son login"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("""
            SELECT id_employee, login, password, actif, name, surname, 
                   mail_pro, tel1, tel2, tel3, id_patron
            FROM EMPLOYEE WHERE login = %s
        """, (login,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result if result else None


    def get_employee_identification(self, identifiant : tuple[str,str] , email: str) -> Optional[tuple]:
        """Récupère les identifiants pour l'authentification"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT login, mail_pro, password, id_patron
            FROM EMPLOYEE WHERE mail_pro = %s
        """, (email,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result if result else None


    def create_employee(self, identifiant : tuple[str,str] , employee: Employee) -> bool:
        """Crée un nouvel employé"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        try:
            # Vérifier si l'email existe déjà
            if self.get_employee_by_email(identifiant, employee.mail):
                return False

            cursor.execute("""
                INSERT INTO EMPLOYEE (login, password, actif, name, surname, 
                                    mail_pro, tel1, tel2, tel3, id_patron)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                employee.username, employee.password,
                0,
                employee.name, employee.surname, employee.mail,
                employee.phone[0] if len(employee.phone) > 0 else None,
                employee.phone[1] if len(employee.phone) > 1 else None,
                employee.phone[2] if len(employee.phone) > 2 else None,
                employee.id_patron if employee.role != "patron" else None
            ))

            self.grant(employee.username, employee.password, employee.role)

            conn.commit()
            return True
        except Error as e:
            print(f"Erreur création employé: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    def get_all_vendeurs(self, identifiant : tuple[str,str]) -> List[Dict]:
        """Récupère tous les vendeurs (employés non patrons)"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("""
                SELECT id_employee, login, name, surname, mail_pro, tel1, tel2, tel3, actif,
                    (CASE WHEN id_patron IS NULL THEN 'patron' ELSE 'vendeur' END) as role
                FROM EMPLOYEE 
                """,)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return results


    def get_vendeur_by_id(self, identifiant : tuple[str,str] , vendeur_id: int) -> Optional[Dict]:
        """Récupère un vendeur par son ID"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("""
            SELECT id_employee, login, name, surname, mail_pro, tel1, tel2, tel3, actif, id_patron
            FROM EMPLOYEE WHERE id_employee = %s
        """, (vendeur_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result if result else None


    def modify_vendeur_partial(self, identifiant : tuple[str,str] , vendeur_id: int, update_data: dict) -> bool:
        """Modifie partiellement un vendeur"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        if not update_data:
            return True

        set_clause = ", ".join([f"{key} = %s" for key in update_data.keys()])
        values = list(update_data.values()) + [vendeur_id]

        query = f"UPDATE EMPLOYEE SET {set_clause} WHERE id_employee = %s"

        try:
            cursor.execute(query, values)

            # Gestion des roles
            if "role" in update_data and  update_data["role"] :

                employee = self.get_vendeur_by_id(identifiant, vendeur_id)

                current_role = self.get_role(employee.username)

                if current_role != update_data['role'] :

                    if update_data['role'] == "patron" :
                        cursor.execute("""
                        UPDATE EMPLOYEE
                               SET id_patron = NULL
                               WHERE id_employee = %s
                        """, (vendeur_id,))

                    self.revoke(employee.username, update_data['role'])

                    self.grant(employee.username, employee.password, update_data["role"])

            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            print(f"Erreur modification vendeur: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    def delete_vendeur_by_id(self, identifiant : tuple[str,str] , vendeur_id: int) -> bool:
        """Supprime un vendeur"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        try:
            current_role = self.get_role(identifiant[0])
            cursor.execute("""
            REVOKE %s FROM %s@'localhost'
            """,(current_role, identifiant[0],))

            if current_role == "patron":
                cursor.execute("""
                REVOKE GRANT OPTION FROM %s@'localhost'
                """,(identifiant[0],))

            cursor.execute("DELETE FROM EMPLOYEE WHERE id_employee = %s AND id_patron IS NOT NULL", (vendeur_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            print(f"Erreur suppression vendeur: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    def update_employee_phones(self, identifiant : tuple[str,str] , employee_id: int, phones: list) -> bool:
        """Met à jour les téléphones d'un employé"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE EMPLOYEE 
                SET tel1 = %s, tel2 = %s, tel3 = %s
                WHERE id_employee = %s
            """, (
                phones[0] if len(phones) > 0 else None,
                phones[1] if len(phones) > 1 else None,
                phones[2] if len(phones) > 2 else None,
                employee_id
            ))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            print(f"Erreur mise à jour téléphones: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    # --- Méthodes pour les CLIENTS ---

    def get_all_clients(self, identifiant : tuple[str,str]) -> List[Dict]:
        """Récupère tous les clients avec leurs détails (sorciers ou moldus)"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT id_client, name, surname, birth_date, money, id_employee, SORCIER, MOLDU
            FROM CLIENT
        """)
        clients = []
        
        for client_row in cursor.fetchall():
            client = dict(self.iso_format(client_row))
            client['telephones'] = []
            
            if client['SORCIER'] == 1:
                cursor2 = conn.cursor(pymysql.cursors.DictCursor)
                cursor2.execute("""
                    SELECT Wizard_registry_number, Chimney, Add_School_name, Add_House, 
                           Add_Country, Flight_licence, Owls_number1, Owls_number2, Owls_number3
                    FROM SORCIER WHERE id_client = %s
                """, (client['id_client'],))
                sorcier = self.iso_format(cursor2.fetchone())
                if sorcier:
                    client['sorcier'] = {
                        'wizard_registry_number': sorcier['Wizard_registry_number'],
                        'chimney': sorcier['Chimney'],
                        'add_school_name': sorcier['Add_School_name'],
                        'add_house': sorcier['Add_House'],
                        'add_country': sorcier['Add_Country'],
                        'flight_licence': sorcier['Flight_licence'],
                        'owls': [owls for owls in [sorcier['Owls_number1'], sorcier['Owls_number2'], sorcier['Owls_number3']] if owls]
                    }
                cursor2.close()
            
            elif client['MOLDU'] == 1:
                cursor2 = conn.cursor(pymysql.cursors.DictCursor)
                cursor2.execute("""
                    SELECT National_register_number, Mail, Add_Street, Add_City, 
                           Add_House_number, Add_Country, tel1, tel2, tel3
                    FROM MOLDU WHERE id_client = %s
                """, (client['id_client'],))
                moldu = self.iso_format(cursor2.fetchone())
                if moldu:
                    client['moldu'] = {
                        'national_register_number': moldu['National_register_number'],
                        'mail': moldu['Mail'],
                        'address': {
                            'street': moldu['Add_Street'],
                            'city': moldu['Add_City'],
                            'house_number': moldu['Add_House_number'],
                            'country': moldu['Add_Country']
                        }
                    }
                    client['telephones'] = [tel for tel in [moldu['tel1'], moldu['tel2'], moldu['tel3']] if tel]
                cursor2.close()
            clients.append(client)

            

        cursor.close()
        conn.close()
        return clients


    def get_client_by_id(self, identifiant : tuple[str,str] , client_id: int) -> Optional[Dict]:
        """Récupère un client par son ID"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT id_client, name, surname, birth_date, money, id_employee, SORCIER, MOLDU
            FROM CLIENT WHERE id_client = %s
        """, (client_id,))
        client = self.iso_format(cursor.fetchone())
        
        if client:
            client = dict(client)
            client['telephones'] = []
            
            if client['SORCIER'] == 1 :
                cursor2 = conn.cursor(pymysql.cursors.DictCursor)
                cursor2.execute("""
                    SELECT Wizard_registry_number, Chimney, Add_School_name, Add_House,
                           Add_Country, Flight_licence, Owls_number1, Owls_number2, Owls_number3
                    FROM SORCIER WHERE id_client = %s
                """, (client_id,))
                sorcier = self.iso_format(cursor2.fetchone())
                if sorcier:
                    client['sorcier'] = dict(sorcier)
                    client['owls'] = [sorcier['Owls_number1'], sorcier['Owls_number2'], sorcier['Owls_number3']]
                    client['owls'] = [owl for owl in client['owls'] if owl]
                cursor2.close()
            
            if client['MOLDU'] == 1:
                cursor2 = conn.cursor(pymysql.cursors.DictCursor)
                cursor2.execute("""
                    SELECT National_register_number, Mail, Add_Street, Add_City,
                           Add_House_number, Add_Country, tel1, tel2, tel3
                    FROM MOLDU WHERE id_client = %s
                """, (client_id,))
                moldu = self.iso_format(cursor2.fetchone())
                if moldu:
                    client['moldu'] = dict(moldu)
                    client['telephones'] = [tel for tel in [moldu['tel1'], moldu['tel2'], moldu['tel3']] if tel]
                cursor2.close()
        
        cursor.close()
        conn.close()
        return client if client else None


    def add_client(self, identifiant : tuple[str,str] , client: Client) -> bool:
        """Ajoute un nouveau client (sorcier ou moldu)"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO CLIENT (name, surname, birth_date, money, id_employee, SORCIER, MOLDU)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                client.name, client.surname, client.birth_date, client.money,
                client.id_employee,
                1 if client.sorcier  else 0,
                1 if client.moldu else 0,
            ))
            client_id = cursor.lastrowid
            
            if client.sorcier:
                cursor.execute("""
                    INSERT INTO SORCIER (id_client, Wizard_registry_number, Chimney, 
                                       Add_School_name, Add_House, Add_Country, 
                                       Flight_licence, Owls_number1, Owls_number2, Owls_number3)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    client_id, client.sorcier.wizard_registry_number, client.sorcier.chimney,
                    client.sorcier.add_school_name, client.sorcier.add_house, client.sorcier.add_country,
                    client.sorcier.flight_licence,
                    client.sorcier.owls[0] if len(client.sorcier.owls) > 0 else None,
                    client.sorcier.owls[1] if len(client.sorcier.owls) > 1 else None,
                    client.sorcier.owls[2] if len(client.sorcier.owls) > 2 else None
                ))
            
            if client.moldu:
                cursor.execute("""
                    INSERT INTO MOLDU (id_client, National_register_number, Mail,
                                     Add_Street, Add_City, Add_House_number, Add_Country,
                                     tel1, tel2, tel3)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    client_id, client.moldu.national_register_number, client.moldu.mail,
                    client.moldu.address.street, client.moldu.address.city,
                    client.moldu.address.house_number, client.moldu.address.country,
                    client.moldu.telephones[0] if len(client.moldu.telephones) > 0 else None,
                    client.moldu.telephones[1] if len(client.moldu.telephones) > 1 else None,
                    client.moldu.telephones[2] if len(client.moldu.telephones) > 2 else None
                ))
            
            conn.commit()
            return True
        except Error as e:
            print(f"Erreur ajout client: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    def modify_client(self, identifiant : tuple[str,str] , client: Client) -> bool:
        """Modifie un client existant"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        try:
            # Mise à jour du client principal avec les flags sorcier et moldu
            cursor.execute("""
                UPDATE CLIENT 
                SET name = %s, surname = %s, birth_date = %s, money = %s, id_employee = %s,
                    SORCIER = %s, MOLDU = %s
                WHERE id_client = %s
            """, (client.name, client.surname, client.birth_date, client.money, 
                client.id_employee, 
                1 if client.sorcier else 0,
                1 if client.moldu else 0,
                client.id_client))
            
            # Gestion du sorcier
            if client.sorcier:
                # Vérifier si le client est déjà un sorcier
                cursor.execute("SELECT 1 FROM SORCIER WHERE id_client = %s", (client.id_client,))
                exists = cursor.fetchone()
                
                if exists:
                    # Mise à jour
                    cursor.execute("""
                        UPDATE SORCIER 
                        SET Wizard_registry_number = %s, Chimney = %s, Add_School_name = %s,
                            Add_House = %s, Add_Country = %s, Flight_licence = %s,
                            Owls_number1 = %s, Owls_number2 = %s, Owls_number3 = %s
                        WHERE id_client = %s
                    """, (
                        client.sorcier.wizard_registry_number, client.sorcier.chimney,
                        client.sorcier.add_school_name, client.sorcier.add_house,
                        client.sorcier.add_country, client.sorcier.flight_licence,
                        client.sorcier.owls[0] if len(client.sorcier.owls) > 0 else None,
                        client.sorcier.owls[1] if len(client.sorcier.owls) > 1 else None,
                        client.sorcier.owls[2] if len(client.sorcier.owls) > 2 else None,
                        client.id_client
                    ))
                else:
                    # Insertion d'un nouveau sorcier
                    cursor.execute("""
                        INSERT INTO SORCIER (id_client, Wizard_registry_number, Chimney, Add_School_name,
                                            Add_House, Add_Country, Flight_licence, Owls_number1,
                                            Owls_number2, Owls_number3)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        client.id_client, client.sorcier.wizard_registry_number, client.sorcier.chimney,
                        client.sorcier.add_school_name, client.sorcier.add_house,
                        client.sorcier.add_country, client.sorcier.flight_licence,
                        client.sorcier.owls[0] if len(client.sorcier.owls) > 0 else None,
                        client.sorcier.owls[1] if len(client.sorcier.owls) > 1 else None,
                        client.sorcier.owls[2] if len(client.sorcier.owls) > 2 else None
                    ))
            else:
                # Si le client n'est plus sorcier, supprimer l'entrée SORCIER
                cursor.execute("DELETE FROM SORCIER WHERE id_client = %s", (client.id_client,))
            
            # Gestion du moldu
            if client.moldu:
                # Vérifier si le client est déjà un moldu
                cursor.execute("SELECT 1 FROM MOLDU WHERE id_client = %s", (client.id_client,))
                exists = cursor.fetchone()
                if exists:
                    # Mise à jour
                    cursor.execute("""
                        UPDATE MOLDU 
                        SET National_register_number = %s, Mail = %s, Add_Street = %s,
                            Add_City = %s, Add_House_number = %s, Add_Country = %s,
                            tel1 = %s, tel2 = %s, tel3 = %s
                        WHERE id_client = %s
                    """, (
                        client.moldu.national_register_number, client.moldu.mail,
                        client.moldu.address.street, client.moldu.address.city,
                        client.moldu.address.house_number, client.moldu.address.country,
                        client.moldu.telephones[0] if len(client.moldu.telephones) > 0 else None,
                        client.moldu.telephones[1] if len(client.moldu.telephones) > 1 else None,
                        client.moldu.telephones[2] if len(client.moldu.telephones) > 2 else None,
                        client.id_client
                    ))
                else:
                    # Insertion d'un nouveau moldu
                    cursor.execute("""
                        INSERT INTO MOLDU (id_client, National_register_number, Mail, Add_Street,
                                        Add_City, Add_House_number, Add_Country, tel1, tel2, tel3)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        client.id_client, client.moldu.national_register_number, client.moldu.mail,
                        client.moldu.address.street, client.moldu.address.city,
                        client.moldu.address.house_number, client.moldu.address.country,
                        client.moldu.telephones[0] if len(client.moldu.telephones) > 0 else None,
                        client.moldu.telephones[1] if len(client.moldu.telephones) > 1 else None,
                        client.moldu.telephones[2] if len(client.moldu.telephones) > 2 else None
                    ))
            else:
                # Si le client n'est plus moldu, supprimer l'entrée MOLDU
                cursor.execute("DELETE FROM MOLDU WHERE id_client = %s", (client.id_client,))
            
            conn.commit()
            return True
        except Error as e:
            print(f"Erreur modification client: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    def delete_client_by_id(self, identifiant : tuple[str,str] , client_id: int) -> bool:
        """Supprime un client"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM SORCIER WHERE id_client = %s", (client_id,))
            cursor.execute("DELETE FROM MOLDU WHERE id_client = %s", (client_id,))
            cursor.execute("DELETE FROM CLIENT WHERE id_client = %s", (client_id,))
            conn.commit()
            return True
        except Error as e:
            print(f"Erreur suppression client: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    # --- Méthodes pour les BALAIS ---

    def get_all_brooms(self, identifiant : tuple[str,str]) -> List[Dict]:
        """Récupère tous les balais"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("""
            SELECT b.*, f.name as fabricant_name, 
                   bm.Flight_licence_required, bm.speed, bm.magic_component
            FROM BALAI b
            JOIN FABRICANT f ON b.id_fabricant = f.id_fabricant
            LEFT JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
        """)
        results = cursor.fetchall()
        for i, row in enumerate(results):
            results[i] = self.iso_format(row)

        cursor.close()
        conn.close()
        return results


    def get_broom_by_id(self, identifiant : tuple[str,str] , broom_id: int) -> Optional[Dict]:
        """Récupère un balai par son ID"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("""
            SELECT b.*, f.name as fabricant_name,
                   bm.Flight_licence_required, bm.speed, bm.magic_component
            FROM BALAI b
            JOIN FABRICANT f ON b.id_fabricant = f.id_fabricant
            LEFT JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
            WHERE b.id_balai = %s
        """, (broom_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        if result :
            
            return self.iso_format(result)
        return None


    def get_client_visible_brooms(self, identifiant : tuple[str,str] , client_id: int) -> List[Dict]:
        """Récupère les balais visibles par un client selon son type"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("SELECT SORCIER FROM CLIENT WHERE id_client = %s", (client_id,))
        client = cursor.fetchone()
        is_sorcier = client and client['SORCIER'] is not None
        
        if is_sorcier:
            cursor.execute("""
                SELECT DISTINCT b.*, f.name as fabricant_name,
                       bm.Flight_licence_required, bm.speed, bm.magic_component
                FROM BALAI b
                JOIN FABRICANT f ON b.id_fabricant = f.id_fabricant
                LEFT JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
                WHERE b.status = 'in stock'
            """)
        else:
            cursor.execute("""
                SELECT DISTINCT b.*, f.name as fabricant_name
                FROM BALAI b
                JOIN FABRICANT f ON b.id_fabricant = f.id_fabricant
                LEFT JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
                WHERE b.status = 'in stock' AND bm.id_balai IS NULL
            """)
        
        results = cursor.fetchall()
        for i, row in enumerate(results):
            results[i] = self.iso_format(row)
        cursor.close()
        conn.close()
        return results


    def get_available_brooms(self, identifiant : tuple[str,str]) -> List[Dict]:
        """Récupère tous les balais disponibles (in stock)"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT b.*, f.name as fabricant_name,
                   bm.Flight_licence_required, bm.speed, bm.magic_component
            FROM BALAI b
            JOIN FABRICANT f ON b.id_fabricant = f.id_fabricant
            LEFT JOIN BALAI_MAGIQUE bm ON b.id_balai = bm.id_balai
            WHERE b.status = 'in stock'
        """)
        results = cursor.fetchall()
        for i, row in enumerate(results):
            results[i] = self.iso_format(row)
        cursor.close()
        conn.close()
        return results

    # --- Méthodes pour les locations (LOCATIONS) ---

    def get_all_locations(self, identifiant : tuple[str,str]) -> List[Dict]:
        """Récupère toutes les locations avec calcul du montant"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT 
                l.id_commande, 
                l.begin_date, 
                l.end_date, 
                l.actual_end_date, 
                l.status,
                c.id_client,
                cl.name as client_name, 
                cl.surname as client_surname,
                e.name as employee_name, 
                e.surname as employee_surname
            FROM LOCATION l
            JOIN COMMANDE c ON l.id_commande = c.id_commande
            JOIN CLIENT cl ON c.id_client = cl.id_client
            JOIN EMPLOYEE e ON c.id_employee = e.id_employee
            ORDER BY l.begin_date DESC
        """)
        
        results = cursor.fetchall()
        for i, row in enumerate(results):
            row = self.iso_format(row)
            
            # Récupérer les balais de la location
            cursor2 = conn.cursor(pymysql.cursors.DictCursor)
            cursor2.execute("""
                SELECT b.id_balai, b.Libelle as broom_name, b.location_price
                FROM DETAIL_LOCATION dl
                JOIN BALAI b ON dl.id_balai = b.id_balai
                WHERE dl.id_location = %s
            """, (row['id_commande'],))
            row['brooms'] = [dict(self.iso_format(item)) for item in cursor2.fetchall()]
            cursor2.close()
            
            # Calculer le montant total
            total_amount = 0
            
            if row['begin_date'] and row['brooms']:
                # Convertir les dates en objets date si ce sont des chaînes
                from datetime import date
                
                begin_date = row['begin_date']
                if isinstance(begin_date, str):
                    begin_date = date.fromisoformat(begin_date)
                
                # Déterminer la date de fin (réelle ou prévue)
                end_date = row['actual_end_date'] if row['actual_end_date'] else row['end_date']
                if isinstance(end_date, str):
                    end_date = date.fromisoformat(end_date)
                
                # Calculer le nombre de jours
                if end_date:
                    days = (end_date - begin_date).days
                    if days > 0:
                        for broom in row['brooms']:
                            daily_price = broom['location_price']
                            total_amount += daily_price * days
            
            row['total_amount'] = round(total_amount, 2)
            results[i] = row
        
        cursor.close()
        conn.close()
        return results


    def get_client_locations(self, identifiant : tuple[str,str] , client_id: int) -> List[Dict]:
        """Récupère les locations d'un client"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("""
            SELECT l.*, b.Libelle as broom_name, b.id_balai
            FROM LOCATION l
            JOIN COMMANDE c ON l.id_commande = c.id_commande
            JOIN DETAIL_LOCATION dl ON l.id_commande = dl.id_location
            JOIN BALAI b ON dl.id_balai = b.id_balai
            WHERE c.id_client = %s
        """, (client_id,))
        results = cursor.fetchall()
        for i, row in enumerate(results):
            results[i] = self.iso_format(row)
        cursor.close()
        conn.close()
        return results


    def get_vendeur_locations(self, identifiant : tuple[str,str] , vendeur_id: int) -> List[Dict]:
        """Récupère les locations gérées par un vendeur"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("""
            SELECT l.*, c.id_client, cl.name as client_name, cl.surname as client_surname,
                   b.Libelle as broom_name
            FROM LOCATION l
            JOIN COMMANDE c ON l.id_commande = c.id_commande
            JOIN CLIENT cl ON c.id_client = cl.id_client
            JOIN DETAIL_LOCATION dl ON l.id_commande = dl.id_location
            JOIN BALAI b ON dl.id_balai = b.id_balai
            WHERE c.id_employee = %s
        """, (vendeur_id,))
        results = cursor.fetchall()
        for i, row in enumerate(results):
            results[i] = self.iso_format(row)
        cursor.close()
        conn.close()
        return results


    def check_broom_availability(self, identifiant : tuple[str,str] , broom_id: int, start_date: str, end_date: str) -> tuple:
        """Vérifie la disponibilité d'un balai pour une période donnée"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT l.begin_date, l.end_date, l.status
            FROM LOCATION l
            JOIN DETAIL_LOCATION dl ON l.id_commande = dl.id_location
            WHERE dl.id_balai = %s 
            AND l.status != 'Finished'
            AND l.begin_date <= %s AND l.end_date >= %s
        """, (broom_id, end_date, start_date))
        
        conflict = cursor.fetchone()

        cursor.close()
        conn.close()
        
        if conflict:
            return False, {"startDate": conflict['begin_date'].isoformat(), "endDate": conflict['end_date'].isoformat()}
        return True, None


    def add_location(self, identifiant : tuple[str,str] , client_id: int, employee_id: int, location: Reservation) -> bool:
        """Ajoute une nouvelle location"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        try:
            # Créer la COMMANDE
            cursor.execute("""
                INSERT INTO COMMANDE (id_employee, id_client, VENTE, LOCATION)
                VALUES (%s, %s, NULL, 1)
            """, (employee_id, client_id))
            commande_id = cursor.lastrowid
            
            # Créer la LOCATION
            cursor.execute("""
                INSERT INTO LOCATION (id_commande, begin_date, end_date, status)
                VALUES (%s, %s, %s, 'Pending')
            """, (commande_id, location.startDate, location.endDate))
            
            # Lier le balai à la location via DETAIL_LOCATION
            cursor.execute("""
                INSERT INTO DETAIL_LOCATION (id_location, id_balai)
                VALUES (%s, %s)
            """, (commande_id, location.broomId))

            conn.commit()
            return True
        except Error as e:
            print(f"Erreur ajout réservation: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    # --- Méthodes pour les retours de location ---

    def validate_location_return(self, identifiant : tuple[str,str] , commande_id: int, actual_end_date: str) -> bool:
        """Valide le retour d'un balai en location et débite le client"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        try:
            # Vérifier que la location existe et récupérer les infos
            cursor.execute("""
                SELECT c.id_commande, l.begin_date, l.end_date, c.id_client, cl.money
                FROM COMMANDE c
                JOIN LOCATION l ON c.id_commande = l.id_commande
                JOIN CLIENT cl ON c.id_client = cl.id_client
                WHERE c.id_commande = %s AND c.LOCATION IS NOT NULL AND l.status != 'Finished'
            """, (commande_id,))
            location = cursor.fetchone()
            
            if not location:
                print("Location non trouvée ou déjà terminée")
                return False

            begin_date = location[1]
            expected_end_date = location[2]
            client_id = location[3]
            client_money = location[4]

            # Calculer le nombre de jours réel (arrondi au supérieur)
            cursor.execute("""
                SELECT CEIL(DATEDIFF(%s, %s)) as rental_days
            """, (actual_end_date, begin_date))
            rental_days = cursor.fetchone()[0]

            if rental_days <= 0:
                print("Durée de location invalide")
                return False

            # Calculer le nombre de jours de retard (si applicable)
            cursor.execute("""
                SELECT CEIL(DATEDIFF(%s, %s)) as late_days
            """, (actual_end_date, expected_end_date))
            late_days = cursor.fetchone()[0]
            late_days = max(0, late_days)  # Si négatif, pas de retard

            # Récupérer les balais de la location
            cursor.execute("""
                SELECT b.location_price, b.id_balai
                FROM DETAIL_LOCATION dl
                INNER JOIN BALAI b ON dl.id_balai = b.id_balai
                WHERE dl.id_location = %s
            """, (commande_id,))
            brooms = cursor.fetchall()

            if not brooms:
                print("Aucun balai trouvé pour cette location")
                return False

            # Calculer le montant total
            total_amount = 0
            for broom in brooms:
                daily_price = broom[0]
                # Prix normal pour la durée totale
                total_amount += daily_price * rental_days
                # Supplément de 50% pour les jours de retard
                if late_days > 0:
                    total_amount += daily_price * late_days * 0.5

            # Arrondir à 2 décimales
            total_amount = round(total_amount, 2)

            if total_amount <= 0:
                print("Montant de location invalide")
                return False

            # Vérifier si le client a assez d'argent
            if client_money < total_amount:
                print(f"Solde insuffisant : {client_money} < {total_amount}")
                return False

            # Débiter le client
            cursor.execute("""
                UPDATE CLIENT 
                SET money = money - %s 
                WHERE id_client = %s
            """, (total_amount, client_id))

            # Mettre à jour la location
            cursor.execute("""
                UPDATE LOCATION 
                SET actual_end_date = %s, status = 'Finished'
                WHERE id_commande = %s
            """, (actual_end_date, commande_id))

            # Mettre à jour le statut des balais
            cursor.execute("""
                UPDATE BALAI 
                SET status = 'in stock'
                WHERE id_balai IN (
                    SELECT id_balai FROM DETAIL_LOCATION 
                    WHERE id_location = %s
                )
            """, (commande_id,))

            conn.commit()

            return True

        except Error as e:
            print(f"Erreur validation retour: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    def delete_location(self, identifiant : tuple[str,str] , location_id: int) -> bool:
        """Supprime une location"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        try:
            # Récupérer le balai associé
            cursor.execute("""
                SELECT b.id_balai
                FROM LOCATION l
                JOIN DETAIL_LOCATION dl ON l.id_commande = dl.id_location
                JOIN BALAI b ON dl.id_balai = b.id_balai
                WHERE l.id_commande = %s
            """, (location_id,))
            result = cursor.fetchone()
            
            if result:
                cursor.execute("UPDATE BALAI SET status = 'in stock' WHERE id_balai = %s", (result[0],))
            
            cursor.execute("DELETE FROM DETAIL_LOCATION WHERE id_location = %s", (location_id,))
            cursor.execute("DELETE FROM LOCATION WHERE id_commande = %s", (location_id,))
            cursor.execute("DELETE FROM COMMANDE WHERE id_commande = %s", (location_id,))
            
            conn.commit()
            return True
        except Error as e:
            print(f"Erreur suppression réservation: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    # --- Méthodes pour les ventes (VENTES) ---

    def get_vente_by_id(self, identifiant : tuple[str,str] , vente_id: int) -> Optional[Dict]:
        """Récupère une vente par son ID"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT v.id_commande, v.sale_date, c.id_client
            FROM VENTE v
            JOIN COMMANDE c ON v.id_commande = c.id_commande
            WHERE v.id_commande = %s
        """, (vente_id,))

        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result if result else None


    def get_vente_detail(self, identifiant : tuple[str,str] , commande_id: int, client_id: int) -> Optional[Dict]:
        """Récupère les détails d'une commande client"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT 
                c.id_commande,
                v.sale_date,
                c.id_client,
                cl.name as client_name,
                cl.surname as client_surname,
                (SELECT COALESCE(SUM(b2.sale_price), 0) 
                FROM BALAI b2 
                WHERE b2.id_vente = c.id_commande) as total_amount
            FROM COMMANDE c
            JOIN VENTE v ON c.id_commande = v.id_commande
            JOIN CLIENT cl ON c.id_client = cl.id_client
            WHERE c.id_commande = %s AND c.id_client = %s AND c.VENTE IS NOT NULL
        """, (commande_id, client_id))
        
        result = cursor.fetchone()
        
        if result:
            result = self.iso_format(result)
            
            # Récupérer les balais
            cursor2 = conn.cursor(pymysql.cursors.DictCursor)
            cursor2.execute("""
                SELECT b.id_balai, b.Libelle as broom_name, b.sale_price
                FROM BALAI b
                WHERE b.id_vente = %s
            """, (commande_id,))
            
            result['items'] = [dict(self.iso_format(item)) for item in cursor2.fetchall()]
            cursor2.close()
        
        cursor.close()
        conn.close()
        return result if result else None


    def get_all_ventes(self, identifiant : tuple[str,str]) -> List[Dict]:
        """Récupère toutes les ventes avec calcul du montant total"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT 
                c.id_commande, 
                v.sale_date,
                c.id_client,
                cl.name as client_name, 
                cl.surname as client_surname,
                e.name as employee_name, 
                e.surname as employee_surname,
                COALESCE(SUM(b.sale_price), 0) as total_amount
            FROM COMMANDE c
            JOIN VENTE v ON c.id_commande = v.id_commande
            JOIN CLIENT cl ON c.id_client = cl.id_client
            JOIN EMPLOYEE e ON c.id_employee = e.id_employee
            LEFT JOIN BALAI b ON b.id_vente = c.id_commande
            GROUP BY c.id_commande, v.sale_date, c.id_client, cl.name, cl.surname, e.name, e.surname
            ORDER BY v.sale_date DESC
        """)
        
        results = cursor.fetchall()
        for i, row in enumerate(results):
            row = self.iso_format(row)
            
            # Récupérer les détails des balais vendus
            cursor2 = conn.cursor(pymysql.cursors.DictCursor)
            cursor2.execute("""
                SELECT b.id_balai, b.Libelle as broom_name, b.sale_price
                FROM BALAI b
                WHERE b.id_vente = %s
            """, (row['id_commande'],))
            row['items'] = [dict(self.iso_format(item)) for item in cursor2.fetchall()]
            cursor2.close()
            
            results[i] = row
        
        cursor.close()
        conn.close()
        return results


    def get_client_ventes(self, identifiant : tuple[str,str] , client_id: int) -> List[Dict]:
        """Récupère les ventes d'un client"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("""
            SELECT c.*, v.sale_date, b.Libelle as broom_name, b.sale_price
            FROM COMMANDE c
            JOIN VENTE v ON c.id_commande = v.id_commande
            JOIN BALAI b ON b.id_vente = c.id_commande
            WHERE c.id_client = %s
        """, (client_id,))
        results = cursor.fetchall()
        for i, row in enumerate(results):
            results[i] = self.iso_format(row)
        cursor.close()
        conn.close()
        return results


    def get_vendeur_ventes(self, identifiant : tuple[str,str] , vendeur_id: int) -> List[Dict]:
        """Récupère les ventes gérées par un vendeur"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("""
            SELECT v.*, c.id_client, cl.name as client_name, cl.surname as client_surname,
                b.Libelle as broom_name, b.sale_price as sale_price,
                (SELECT SUM(b2.sale_price) 
                    FROM BALAI b2 
                    WHERE b2.id_vente = v.id_commande) as total_amount
            FROM VENTE v
            JOIN COMMANDE c ON v.id_commande = c.id_commande
            JOIN CLIENT cl ON c.id_client = cl.id_client
            JOIN BALAI b ON b.id_vente = v.id_commande
            WHERE c.id_employee = %s
        """, (vendeur_id,))
        results = cursor.fetchall()
        for i, row in enumerate(results):
            results[i] = self.iso_format(row)
        cursor.close()
        conn.close()
        return results


    def add_vente(self, identifiant : tuple[str,str] , employee_id: int, client_id: int, broom_ids: int) -> bool:
        """Ajoute une nouvelle vente"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        try:
            sale_price = 0

            for broom_id in broom_ids :
                # Récupérer le prix du balai
                cursor.execute("SELECT sale_price, status FROM BALAI WHERE id_balai = %s", (broom_id,))
                broom = cursor.fetchone()
                if not broom or broom['status'] != 'in stock':
                    return False
                sale_price += broom['sale_price']

            cursor.execute("SELECT money FROM CLIENT WHERE id_client = %s", (client_id,))
            client_money = cursor.fetchone()

            remnant = client_money['money'] - sale_price

            if (remnant) < 0 :
                return False

            current_date = date.today().isoformat()

            # Créer la COMMANDE
            cursor.execute("""
                INSERT INTO COMMANDE (id_employee, id_client, VENTE, LOCATION)
                VALUES (%s, %s, 1, NULL)
            """, (employee_id, client_id))
            commande_id = cursor.lastrowid

            cursor.execute("""
                UPDATE COMMANDE SET VENTE = %s WHERE id_commande = %s
            """, (commande_id, commande_id))

            # Créer la VENTE
            cursor.execute("""
                INSERT INTO VENTE (id_commande, sale_date)
                VALUES (%s, %s)
            """, (commande_id, current_date))

            for broom_id in broom_ids :
                # Mettre à jour le balai
                cursor.execute("""
                    UPDATE BALAI 
                    SET id_vente = %s, status = 'sold'
                    WHERE id_balai = %s
                """, (commande_id, broom_id))
            
            # Débiter le client
            cursor.execute("""
                UPDATE CLIENT
                SET money = %s
                WHERE id_client = %s
            """, (remnant, client_id))
            
            conn.commit()
            return True
        except Error as e:
            print(f"Erreur ajout vente: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    def delete_vente(self, identifiant : tuple[str,str] , vente_id: int) -> bool:
        """Supprime une vente et restaure les balais associés"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        try:

            # Récupérer la commande associée à la vente
            cursor.execute("""
                SELECT id_commande, sale_date 
                FROM VENTE 
                WHERE id_commande = %s
            """, (vente_id,))
            vente = cursor.fetchone()

            if not vente:
                print(f"Vente {vente_id} non trouvée")
                return False

            # Récupérer tous les balais associés à cette vente
            cursor.execute("""
                SELECT id_balai, sale_price 
                FROM BALAI 
                WHERE id_vente = %s
            """, (vente_id,))
            brooms = cursor.fetchall()

            if not brooms:
                print(f"Aucun balai trouvé pour la vente {vente_id}")
                return False

            # Calculer le montant total à rembourser
            total_refund = 0
            for broom in brooms:
                total_refund += broom['sale_price']

            # Récupérer l'id_client depuis la commande
            cursor.execute("""
                SELECT id_client 
                FROM COMMANDE 
                WHERE id_commande = %s
            """, (vente_id,))
            commande = cursor.fetchone()

            if not commande:
                print(f"Commande {vente_id} non trouvée")
                return False

            client_id = commande['id_client']

            # Rembourser le client
            cursor.execute("SELECT money FROM CLIENT WHERE id_client = %s", (client_id,))
            client_money = cursor.fetchone()

            new_money = client_money['money'] + total_refund

            cursor.execute("""
                UPDATE CLIENT
                SET money = %s
                WHERE id_client = %s
            """, (new_money, client_id))

            # Restaurer les balais
            for broom in brooms:
                cursor.execute("""
                    UPDATE BALAI 
                    SET id_vente = NULL, status = 'in stock'
                    WHERE id_balai = %s
                """, (broom['id_balai'],))

            # Supprimer la vente
            cursor.execute("DELETE FROM VENTE WHERE id_commande = %s", (vente_id,))

            # Supprimer la commande
            cursor.execute("DELETE FROM COMMANDE WHERE id_commande = %s", (vente_id,))

            conn.commit()
            return True

        except Error as e:
            print(f"Erreur suppression vente: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    # --- Méthodes pour les Fabricants ---

    def get_all_fabricants(self, identifiant : tuple[str,str]) -> List[Dict]:
        """Récupère tous les fabricants/fournisseurs"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("SELECT id_fabricant, name, Mail FROM FABRICANT")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return results


    def get_fabricant_by_id(self, identifiant : tuple[str,str] , fabricant_id: int) -> Optional[Dict]:
        """Récupère un fabricant par son ID"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("SELECT id_fabricant, name, Mail FROM FABRICANT WHERE id_fabricant = %s", (fabricant_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result if result else None

    # --- Méthodes pour les COMMANDES FOURNISSEUR ---

    def create_commande_fournisseur(self, identifiant : tuple[str,str] , commande_data: dict) -> bool:
        """Crée une commande fournisseur"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        try:
            # Récupérer l'ID d'un patron
            cursor.execute("SELECT id_employee FROM EMPLOYEE WHERE id_patron IS NULL LIMIT 1")
            patron = cursor.fetchone()
            patron_id = patron[0] if patron else None
            
            # Insérer la commande fournisseur
            cursor.execute("""
                INSERT INTO COMMANDE_FOURNISSEUR 
                (id_vendeur, id_patron, status, command_date, expected_delivery_date)
                VALUES (%s, %s, 'Pending Approuval', %s, %s)
            """, (
                commande_data['vendeur_id'],
                patron_id,
                commande_data['command_date'],
                commande_data['expected_delivery_date']
            ))
            commande_id = cursor.lastrowid
            
            # Pour chaque balai commandé
            for item in commande_data['items']:
                template_id = item['broom_template_id']
                quantity = item['quantity']
                
                cursor2 = conn.cursor(pymysql.cursors.DictCursor)
                cursor2.execute("""
                    SELECT Libelle, description, img, sale_price, location_price, purchase_price, id_fabricant
                    FROM BALAI WHERE id_balai = %s
                """, (template_id,))
                source_broom = cursor2.fetchone()
                cursor2.close()
                
                if not source_broom:
                    continue
                
                for _ in range(quantity):
                    # Créer un NOUVEAU BALAI
                    cursor.execute("""
                        INSERT INTO BALAI 
                        (Libelle, description, img, uses_number, sale_price, 
                         location_price, purchase_price, wear, status, id_commande_fournisseur, id_fabricant)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        source_broom['Libelle'],
                        source_broom['description'],
                        source_broom['img'],
                        0,
                        source_broom['sale_price'],
                        source_broom['location_price'],
                        source_broom['purchase_price'],
                        0,
                        'arriving',
                        commande_id,
                        source_broom['id_fabricant']
                    ))
                    new_broom_id = cursor.lastrowid
                    
                    # Copier les attributs magiques si nécessaire
                    cursor3 = conn.cursor(pymysql.cursors.DictCursor)
                    cursor3.execute("""
                        SELECT Flight_licence_required, speed, magic_component
                        FROM BALAI_MAGIQUE WHERE id_balai = %s
                    """, (template_id,))
                    magic_broom = cursor3.fetchone()
                    cursor3.close()
                    
                    if magic_broom:
                        cursor.execute("""
                            INSERT INTO BALAI_MAGIQUE 
                            (id_balai, Flight_licence_required, speed, magic_component)
                            VALUES (%s, %s, %s, %s)
                        """, (
                            new_broom_id,
                            magic_broom['Flight_licence_required'],
                            magic_broom['speed'],
                            magic_broom['magic_component']
                        ))
            
            conn.commit()
            return True
        except Error as e:
            print(f"Erreur création commande fournisseur: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    def get_commande_fournisseur_by_id(self, identifiant: tuple[str, str], commande_id: int) -> Optional[Dict]:
        """Récupère une commande fournisseur par son ID"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT id_commande, status, command_date, expected_delivery_date, actual_delivery_date
            FROM COMMANDE_FOURNISSEUR
            WHERE id_commande = %s
        """, (commande_id,))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result:
            result = self.iso_format(result)
        return result


    def get_vendeur_commandes_fournisseur(self, identifiant : tuple[str,str] , vendeur_id: int) -> List[Dict]:
        """Récupère les commandes fournisseur d'un vendeur"""
        if self.get_role(identifiant[0]) == 'patron':
            return self.get_all_commandes_fournisseur(identifiant)
        
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT cf.id_commande, cf.status, cf.command_date, cf.expected_delivery_date, 
                   cf.actual_delivery_date,
                   e.name as vendeur_name, e.surname as vendeur_surname
            FROM COMMANDE_FOURNISSEUR cf
            JOIN EMPLOYEE e ON cf.id_vendeur = e.id_employee
            WHERE cf.id_vendeur = %s
            ORDER BY cf.command_date DESC
        """, (vendeur_id,))
        
        commandes = []
        for row in cursor.fetchall():

            commande = dict(self.iso_format(row))
            
            cursor2 = conn.cursor(pymysql.cursors.DictCursor)
            cursor2.execute("""
                SELECT b.Libelle as broom_name, COUNT(*) as quantity,
                       f.name as fournisseur_name, b.purchase_price
                FROM BALAI b
                JOIN FABRICANT f ON b.id_fabricant = f.id_fabricant
                WHERE b.id_commande_fournisseur = %s
                GROUP BY b.Libelle, f.name
            """, (commande['id_commande'],))
            
            commande['items'] = [dict(self.iso_format(item)) for item in cursor2.fetchall()]
            cursor2.close()
            
            if commande['items']:
                commande['fournisseur_name'] = commande['items'][0]['fournisseur_name']
            else:
                commande['fournisseur_name'] = 'Inconnu'
            
            commandes.append(commande)
        
        cursor.close()
        conn.close()
        return commandes


    def get_all_commandes_fournisseur(self , identifiant : tuple[str,str]) -> List[Dict]:
        """Récupère toutes les commandes fournisseurs avec calcul des dépenses"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        try:
            cursor.execute("""
                SELECT 
                    cf.id_commande, 
                    cf.status, 
                    cf.command_date, 
                    cf.expected_delivery_date, 
                    cf.actual_delivery_date,
                    e.name as vendeur_name, 
                    e.surname as vendeur_surname
                FROM COMMANDE_FOURNISSEUR cf
                JOIN EMPLOYEE e ON cf.id_vendeur = e.id_employee
                ORDER BY cf.command_date DESC
            """)
            
            commandes = []
            for row in cursor.fetchall():
                commande = dict(self.iso_format(row))
                
                cursor2 = conn.cursor(pymysql.cursors.DictCursor)
                cursor2.execute("""
                    SELECT 
                        b.id_balai,
                        b.Libelle as broom_name, 
                        COUNT(*) as quantity,
                        f.name as fournisseur_name, 
                        b.purchase_price,
                        (b.purchase_price * COUNT(*)) as total_price
                    FROM BALAI b
                    JOIN FABRICANT f ON b.id_fabricant = f.id_fabricant
                    WHERE b.id_commande_fournisseur = %s
                    GROUP BY b.id_balai, b.Libelle, f.name, b.purchase_price
                """, (commande['id_commande'],))
                
                items = []
                total_depense = 0
                total_articles = 0
                
                for item in cursor2.fetchall():
                    formatted_item = self.iso_format(item)
                    items.append(formatted_item)
                    total_depense += formatted_item['total_price']
                    total_articles += formatted_item['quantity']
                
                cursor2.close()
                
                commande['items'] = items
                commande['total_depense'] = round(total_depense, 2)
                commande['total_articles'] = total_articles
                
                commandes.append(commande)
            
            return commandes
            
        except Error as e:
            print(f"Erreur: {e}")
            return []
        finally:
            cursor.close()
            conn.close()


    def get_pending_approvals(self, identifiant : tuple[str,str]) -> List[Dict]:
        """Récupère les commandes fournisseur en attente d'approbation"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT cf.id_commande, cf.status, cf.command_date, cf.expected_delivery_date,
                   e.name as vendeur_name, e.surname as vendeur_surname
            FROM COMMANDE_FOURNISSEUR cf
            JOIN EMPLOYEE e ON cf.id_vendeur = e.id_employee
            WHERE cf.status = 'Pending Approuval'
            ORDER BY cf.command_date ASC
        """)
        
        commandes = []
        for row in cursor.fetchall():
            commande = dict(self.iso_format(row))
            
            cursor2 = conn.cursor(pymysql.cursors.DictCursor)
            cursor2.execute("""
                SELECT b.Libelle as broom_name, COUNT(*) as quantity,
                       f.name as fournisseur_name, b.purchase_price
                FROM BALAI b
                JOIN FABRICANT f ON b.id_fabricant = f.id_fabricant
                WHERE b.id_commande_fournisseur = %s
                GROUP BY b.Libelle, f.name
            """, (commande['id_commande'],))
            
            commande['items'] = [dict(self.iso_format(item)) for item in cursor2.fetchall()]
            cursor2.close()
            
            if commande['items']:
                commande['fournisseur_name'] = commande['items'][0]['fournisseur_name']
            else:
                commande['fournisseur_name'] = 'Inconnu'
            
            commandes.append(commande)
        
        cursor.close()
        conn.close()
        return commandes


    def approve_commande_fournisseur(self, identifiant : tuple[str,str] , commande_id: int) -> bool:
        """Approuve une commande fournisseur"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE COMMANDE_FOURNISSEUR 
                SET status = 'Pending'
                WHERE id_commande = %s AND status = 'Pending Approuval'
            """, (commande_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            print(f"Erreur approbation commande: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    def update_commande_fournisseur_status(self, identifiant : tuple[str,str] , commande_id: int, status: str) -> bool:
        """Met à jour le statut d'une commande fournisseur"""
        allowed_statuses = ['Pending', 'Processing', 'In transit', 'Cancelled', 'Finished']
        if status not in allowed_statuses:
            return False
        
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE COMMANDE_FOURNISSEUR 
                SET status = %s
                WHERE id_commande = %s
            """, (status, commande_id))
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            print(f"Erreur mise à jour statut: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()


    def update_commande_fournisseur_delivery(self, identifiant : tuple[str,str] , commande_id: int, ) -> bool:
        """Met à jour la date de livraison réelle et le statut"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE COMMANDE_FOURNISSEUR 
                SET actual_delivery_date = %s, status = 'Finished'
                WHERE id_commande = %s
            """, (datetime.now().isoformat(), commande_id))
            
            # Mettre à jour le statut des balais concernés
            cursor.execute("""
                UPDATE BALAI 
                SET status = 'in stock'
                WHERE id_commande_fournisseur = %s
            """, (commande_id,))
            
            conn.commit()
            return cursor.rowcount > 0
        except Error as e:
            print(f"Erreur mise à jour livraison: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    # --- Méthodes pour les statistiques ---

    def get_vendeur_stats(self, identifiant : tuple[str,str] , vendeur_id: int) -> Dict:
        """Récupère les statistiques d'un vendeur"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        stats = {}
        
        # CA total des ventes
        cursor.execute("""
            SELECT COALESCE(SUM(b.sale_price), 0) as total_ca
            FROM COMMANDE c
            JOIN VENTE v ON c.id_commande = v.id_commande
            JOIN BALAI b ON b.id_vente = c.id_commande
            WHERE c.id_employee = %s
        """, (vendeur_id,))
        stats['total_ca'] = cursor.fetchone()['total_ca']
        
        # Nombre de ventes
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM COMMANDE c
            JOIN VENTE v ON c.id_commande = v.id_commande
            WHERE c.id_employee = %s
        """, (vendeur_id,))
        stats['ventes_count'] = cursor.fetchone()['count']
        
        # Nombre de locations gérées
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM COMMANDE c
            JOIN LOCATION l ON c.id_commande = l.id_commande
            WHERE c.id_employee = %s
        """, (vendeur_id,))
        stats['locations_count'] = cursor.fetchone()['count']
        
        # Nombre de clients servis
        cursor.execute("""
            SELECT COUNT(DISTINCT c.id_client) as count
            FROM COMMANDE c
            WHERE c.id_employee = %s
        """, (vendeur_id,))
        stats['clients_count'] = cursor.fetchone()['count']
        
        # Ventes par mois
        cursor.execute("""
            SELECT DATE_FORMAT(v.sale_date, '%%Y-%%m') as month,
                COUNT(*) as ventes_count,
                COALESCE(SUM(b.sale_price), 0) as ca
            FROM VENTE v
            JOIN COMMANDE c ON v.id_commande = c.id_commande
            JOIN BALAI b ON b.id_vente = v.id_commande
            WHERE c.id_employee = %s
            GROUP BY DATE_FORMAT(v.sale_date, '%%Y-%%m')
            ORDER BY month DESC
            LIMIT 12
        """, (vendeur_id,))
        stats['ventes_par_mois'] = [dict(row) for row in cursor.fetchall()]
        
        # Top balais vendus
        cursor.execute("""
            SELECT b.Libelle as broom_name, COUNT(*) as quantity
            FROM VENTE v
            JOIN COMMANDE c ON v.id_commande = c.id_commande
            JOIN BALAI b ON b.id_vente = v.id_commande
            WHERE c.id_employee = %s
            GROUP BY b.id_balai, b.Libelle
            ORDER BY quantity DESC
            LIMIT 5
        """, (vendeur_id,))
        stats['top_balais'] = [dict(row) for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        return stats


    def get_ventes_by_period(self, identifiant : tuple[str,str] , vendeur_id: int, start_date: str, end_date: str) -> List[Dict]:
        """Récupère les ventes sur une période donnée"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT v.id_commande, v.sale_date,
                cl.name as client_name, cl.surname as client_surname,
                COALESCE(SUM(b.sale_price), 0) as total_amount
            FROM VENTE v
            JOIN COMMANDE c ON v.id_commande = c.id_commande
            JOIN CLIENT cl ON c.id_client = cl.id_client
            JOIN BALAI b ON b.id_vente = v.id_commande
            WHERE c.id_employee = %s AND v.sale_date BETWEEN %s AND %s
            GROUP BY v.id_commande, v.sale_date, cl.name, cl.surname
            ORDER BY v.sale_date DESC
        """, (vendeur_id, start_date, end_date))
        
        ventes = []
        for row in cursor.fetchall():
            vente = dict(self.iso_format(row))
            
            cursor2 = conn.cursor(pymysql.cursors.DictCursor)
            cursor2.execute("""
                SELECT b.Libelle as broom_name, COUNT(*) as quantity, b.sale_price
                FROM BALAI b
                WHERE b.id_vente = %s
                GROUP BY b.id_balai, b.Libelle, b.sale_price
            """, (vente['id_commande'],))
            
            vente['items'] = [dict(item) for item in cursor2.fetchall()]
            cursor2.close()
            ventes.append(vente)
        
        cursor.close()
        conn.close()
        return ventes


    def get_locations_by_status(self, identifiant : tuple[str,str] , vendeur_id: int, status: str = None) -> List[Dict]:
        """Récupère les locations d'un vendeur, optionnellement filtrées par statut"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        query = """
            SELECT l.id_commande, l.begin_date, l.end_date, l.actual_end_date, l.status,
                cl.name as client_name, cl.surname as client_surname,
                b.Libelle as broom_name
            FROM LOCATION l
            JOIN COMMANDE c ON l.id_commande = c.id_commande
            JOIN CLIENT cl ON c.id_client = cl.id_client
            JOIN DETAIL_LOCATION dl ON l.id_commande = dl.id_location
            JOIN BALAI b ON dl.id_balai = b.id_balai
            WHERE c.id_employee = %s
        """
        params = [vendeur_id]
        
        if status:
            query += " AND l.status = %s"
            params.append(status)
        
        query += " ORDER BY l.begin_date DESC"
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        for i, row in enumerate(results):
            results[i] = self.iso_format(row)
        cursor.close()
        conn.close()
        return results


    def search_ventes(self, identifiant : tuple[str,str] , vendeur_id: int, search_term: str) -> List[Dict]:
        """Recherche des ventes par nom de client ou nom de balai"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT DISTINCT v.id_commande, v.sale_date,
                cl.name as client_name, cl.surname as client_surname,
                COALESCE(SUM(b.sale_price), 0) as total_amount
            FROM VENTE v
            JOIN COMMANDE c ON v.id_commande = c.id_commande
            JOIN CLIENT cl ON c.id_client = cl.id_client
            JOIN BALAI b ON b.id_vente = v.id_commande
            WHERE c.id_employee = %s 
            AND (cl.name LIKE %s OR cl.surname LIKE %s OR b.Libelle LIKE %s)
            GROUP BY v.id_commande, v.sale_date, cl.name, cl.surname
            ORDER BY v.sale_date DESC
        """, (vendeur_id, f'%{search_term}%', f'%{search_term}%', f'%{search_term}%'))
        
        results = cursor.fetchall()
        for i, row in enumerate(results):
            results[i] = self.iso_format(row)
        cursor.close()
        conn.close()
        return results


    def search_locations(self, identifiant : tuple[str,str] , vendeur_id: int, search_term: str) -> List[Dict]:
        """Recherche des locations par nom de client ou nom de balai"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT l.id_commande, l.begin_date, l.end_date, l.actual_end_date, l.status,
                cl.name as client_name, cl.surname as client_surname,
                b.Libelle as broom_name
            FROM LOCATION l
            JOIN COMMANDE c ON l.id_commande = c.id_commande
            JOIN CLIENT cl ON c.id_client = cl.id_client
            JOIN DETAIL_LOCATION dl ON l.id_commande = dl.id_location
            JOIN BALAI b ON dl.id_balai = b.id_balai
            WHERE c.id_employee = %s
            AND (cl.name LIKE %s OR cl.surname LIKE %s OR b.Libelle LIKE %s)
            ORDER BY l.begin_date DESC
        """, (vendeur_id, f'%{search_term}%', f'%{search_term}%', f'%{search_term}%'))
        
        results = cursor.fetchall()
        for i, row in enumerate(results):
            results[i] = self.iso_format(row)
        cursor.close()
        conn.close()
        return results


    def get_stats(self , identifiant : tuple[str, str] ) -> Dict:
        """Récupère les statistiques globales pour les administrateurs (depuis la première date disponible)"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        # Trouver la première date disponible dans le système
        cursor.execute("""
            SELECT MIN(date_min) as first_date FROM (
                SELECT MIN(sale_date) as date_min FROM VENTE WHERE sale_date IS NOT NULL
                UNION
                SELECT MIN(command_date) as date_min FROM COMMANDE_FOURNISSEUR WHERE command_date IS NOT NULL
                UNION
                SELECT MIN(begin_date) as date_min FROM LOCATION WHERE begin_date IS NOT NULL
            ) as all_dates
        """)

        result = cursor.fetchone()
        first_date = result['first_date'] if result['first_date'] else datetime.now().date()

        cursor.close()
        conn.close()

        # Obtenir la date actuelle
        current_date = datetime.now().date()

        # Appeler get_stats_by_period avec la période complète
        return self.get_stats_by_period(identifiant, str(first_date), str(current_date))


    def get_stats_by_period(self, identifiant : tuple[str,str] , start_date: str, end_date: str) -> Dict:
        """Récupère les statistiques globales sur une période donnée"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        stats = {}

        # CA des ventes
        cursor.execute("""
            SELECT COALESCE(SUM(total_ca_ventes), 0) as total_ca_ventes
            FROM ca_ventes_detail
            WHERE date BETWEEN %s AND %s
        """, (start_date, end_date,),)
        stats['total_ca_ventes'] = self.iso_format(cursor.fetchone())['total_ca_ventes']

        # CA des locations
        cursor.execute("""
            SELECT COALESCE(SUM(ca_location), 0) as total_ca_locations
            FROM ca_locations_detail
            WHERE date BETWEEN %s AND %s
        """, (start_date, end_date,),)
        stats['total_ca_locations'] = self.iso_format(cursor.fetchone())['total_ca_locations']

        # CA Total
        stats['total_ca'] = stats['total_ca_ventes'] + stats['total_ca_locations']

        # Dépenses
        cursor.execute("""
            SELECT COALESCE(SUM(total_depenses), 0) as total_depenses
            FROM depenses_fournisseurs
            WHERE date BETWEEN %s AND %s
        """, (start_date, end_date,),)
        stats['total_depenses'] = self.iso_format(cursor.fetchone())['total_depenses']

        # CA Net
        stats['net_ca'] = stats['total_ca'] - stats['total_depenses']

        # Nombre de ventes
        cursor.execute("""
            SELECT COUNT(DISTINCT id_commande) as count
            FROM VENTE
            WHERE sale_date BETWEEN %s AND %s
        """, (start_date, end_date,),)
        stats['ventes_count'] = self.iso_format(cursor.fetchone())['count']

        # Nombre de locations
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM LOCATION l
            WHERE l.begin_date BETWEEN %s AND %s
        """, (start_date, end_date))
        stats['locations_count'] = self.iso_format(cursor.fetchone())['count']

        # Statuts des locations sur la période
        cursor.execute("""
            SELECT status, COUNT(*) as count 
            FROM LOCATION 
            WHERE status = 'Pending' OR begin_date BETWEEN %s AND %s
            GROUP BY status
        """, (start_date, end_date))
        stats['location_status'] = {}
        for row in cursor.fetchall():
            stats['location_status'][row['status']] = row['count']

        # Données par mois
        cursor.execute("""
            SELECT 
                month,
                ca_ventes,
                ca_locations,
                (ca_ventes + ca_locations) as ca_total,
                depenses,
                ((ca_ventes + ca_locations) - depenses) as net
            FROM stats_mensuelles
            WHERE month BETWEEN DATE_FORMAT(%s, '%%Y-%%m') AND DATE_FORMAT(%s, '%%Y-%%m')
            ORDER BY month ASC
        """, (start_date, end_date,),)
        stats['data_par_mois'] = [dict(self.iso_format(row)) for row in cursor.fetchall()]

        # Top balais
        cursor.execute("""
            SELECT broom_name, SUM(quantity) as quantity
            FROM top_balais_vendus
            WHERE sale_date BETWEEN %s AND %s
            GROUP BY broom_name
            ORDER BY quantity DESC
            LIMIT 5
        """, (start_date, end_date))
        stats['top_balais'] = [dict(self.iso_format(row)) for row in cursor.fetchall()]

        # Dépenses par fournisseur
        cursor.execute("""
            SELECT fournisseur_name, SUM(total_depenses) as total_depenses
            FROM depenses_par_fournisseur
            WHERE command_date BETWEEN %s AND %s
            GROUP BY fournisseur_name, id_fabricant
            ORDER BY total_depenses DESC
        """, (start_date, end_date))
        stats['depenses_par_fournisseur'] = [dict(self.iso_format(row)) for row in cursor.fetchall()]

        # Stats par vendeur
        cursor.execute("""
            SELECT 
                id_employee,
                name,
                surname,
                is_patron,
                COUNT(DISTINCT CASE WHEN sale_date BETWEEN %s AND %s THEN vente_id END) as nb_ventes,
                COALESCE(SUM(CASE WHEN sale_date BETWEEN %s AND %s THEN sale_price END), 0) as ca_ventes,
                COUNT(DISTINCT CASE WHEN begin_date BETWEEN %s AND %s THEN location_id END) as nb_locations
            FROM stats_par_vendeur
            GROUP BY id_employee, name, surname, is_patron
            ORDER BY ca_ventes DESC
        """, (start_date, end_date, start_date, end_date, start_date, end_date))
        stats['stats_par_vendeur'] = [dict(self.iso_format(row)) for row in cursor.fetchall()]

        # Nombre de clients uniques sur la période
        cursor.execute("""
            SELECT COUNT(DISTINCT c.id_client) as count
            FROM COMMANDE c
            LEFT JOIN VENTE v ON c.VENTE = v.id_commande
            LEFT JOIN LOCATION l ON c.LOCATION = l.id_commande
            WHERE (v.sale_date BETWEEN %s AND %s) OR (l.begin_date BETWEEN %s AND %s)
        """, (start_date, end_date, start_date, end_date))
        stats['clients_count'] = self.iso_format(cursor.fetchone())['count']

        cursor.close()
        conn.close()
        return stats


    def get_ventes_by_date_range(self, identifiant : tuple[str,str] , start_date: str, end_date: str) -> List[Dict]:
        """Récupère les ventes sur une période donnée - utiliser la vue"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        # Utiliser directement la vue
        cursor.execute("""
            SELECT * FROM ca_ventes_detail
            WHERE date BETWEEN %s AND %s
            ORDER BY date DESC
        """, (start_date, end_date))
        
        results = cursor.fetchall()
        for i, row in enumerate(results):
            results[i] = self.iso_format(row)
        
        cursor.close()
        conn.close()
        return results


    def get_locations_by_date_range(self, identifiant : tuple[str,str] , start_date: str, end_date: str) -> List[Dict]:
        """Récupère les locations sur une période donnée - utiliser la vue"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT 
                l.begin_date as date,
                l.id_commande,
                l.end_date,
                l.actual_end_date,
                l.status,
                c.id_client,
                cl.name as client_name,
                cl.surname as client_surname,
                e.name as employee_name,
                e.surname as employee_surname,
                v.ca_location
            FROM ca_locations_detail v
            JOIN LOCATION l ON v.id_commande = l.id_commande
            JOIN COMMANDE c ON l.id_commande = c.id_commande
            JOIN CLIENT cl ON c.id_client = cl.id_client
            JOIN EMPLOYEE e ON c.id_employee = e.id_employee
            WHERE v.date BETWEEN %s AND %s
            ORDER BY v.date DESC
        """, (start_date, end_date))
        
        results = cursor.fetchall()
        for i, row in enumerate(results):
            results[i] = self.iso_format(row)
        
        cursor.close()
        conn.close()
        return results


    def get_commandes_fournisseur_by_date_range(self, identifiant : tuple[str,str] , start_date: str, end_date: str) -> List[Dict]:
        """Récupère les commandes fournisseur - utiliser la vue"""
        conn = self._get_connection(identifiant)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("""
            SELECT 
                cf.id_commande,
                cf.status,
                cf.command_date,
                cf.expected_delivery_date,
                cf.actual_delivery_date,
                e.name as vendeur_name,
                e.surname as vendeur_surname,
                d.total_depenses
            FROM depenses_fournisseurs d
            JOIN COMMANDE_FOURNISSEUR cf ON d.id_commande = cf.id_commande
            JOIN EMPLOYEE e ON cf.id_vendeur = e.id_employee
            WHERE d.date BETWEEN %s AND %s
            ORDER BY cf.command_date DESC
        """, (start_date, end_date))

        commandes = []
        for row in cursor.fetchall():
            commande = dict(self.iso_format(row))

            # Récupérer les détails des balais
            cursor2 = conn.cursor(pymysql.cursors.DictCursor)
            cursor2.execute("""
                SELECT b.Libelle as broom_name, COUNT(*) as quantity,
                    f.name as fournisseur_name, b.purchase_price
                FROM BALAI b
                JOIN FABRICANT f ON b.id_fabricant = f.id_fabricant
                WHERE b.id_commande_fournisseur = %s
                GROUP BY b.Libelle, f.name, b.purchase_price
            """, (commande['id_commande'],))

            commande['items'] = []
            for item in cursor2.fetchall():
                formatted_item = self.iso_format(item)
                formatted_item['total_price'] = formatted_item['purchase_price'] * formatted_item['quantity']
                commande['items'].append(formatted_item)

            cursor2.close()
            commandes.append(commande)

        cursor.close()
        conn.close()
        return commandes
