# BD/database_mysql.py
import mysql.connector
from mysql.connector import Error, pooling
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration de la base de données
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'your_database'),
    'user': os.getenv('DB_USER', 'your_username'),
    'password': os.getenv('DB_PASSWORD', 'your_password'),
    'pool_name': 'mypool',
    'pool_size': 10,
    'pool_reset_session': True
}

# Créer un pool de connexions
connection_pool = None

def init_connection_pool():
    """Initialise le pool de connexions MySQL"""
    global connection_pool
    try:
        connection_pool = mysql.connector.pooling.MySQLConnectionPool(**db_config)
        print("Pool de connexions MySQL initialisé")
        return connection_pool
    except Error as e:
        print(f"Erreur lors de l'initialisation du pool: {e}")
        return None

def get_connection():
    """Récupère une connexion du pool"""
    global connection_pool
    if connection_pool is None:
        init_connection_pool()
    try:
        return connection_pool.get_connection()
    except Error as e:
        print(f"Erreur de connexion: {e}")
        return None

def init_database():
    """Initialise la base de données et les tables"""
    connection = get_connection()
    cursor = connection.cursor()
    
    try:
        # Créer la table players avec la colonne role
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS players (
                pseudo VARCHAR(50) PRIMARY KEY,
                mail VARCHAR(100) UNIQUE NOT NULL,
                mot_de_passe VARCHAR(255) NOT NULL,
                cookies INT DEFAULT 0,
                clicks INT DEFAULT 0,
                multiplicateur FLOAT DEFAULT 1.0,
                game_style VARCHAR(50) DEFAULT 'cookie',
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_role (role),
                INDEX idx_mail (mail)
            )
        """)
        
        # Créer la table farm_descriptions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS farm_descriptions (
                game_style VARCHAR(50) PRIMARY KEY,
                description TEXT,
                image_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        connection.commit()
        print("Base de données initialisée avec succès")
        
        # Vérifier si la colonne role existe (pour les bases existantes)
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'players' AND COLUMN_NAME = 'role'
        """)
        
        if not cursor.fetchone():
            print("⚠️ Ajout de la colonne 'role' à la table existante...")
            cursor.execute("ALTER TABLE players ADD COLUMN role VARCHAR(20) DEFAULT 'user'")
            cursor.execute("CREATE INDEX idx_role ON players(role)")
            connection.commit()
            print("Colonne 'role' ajoutée")
            
    except Error as e:
        print(f"Erreur lors de l'initialisation: {e}")
        connection.rollback()
    finally:
        cursor.close()
        connection.close()

def init_style():
    """Initialise les styles de ferme par défaut"""
    connection = get_connection()
    cursor = connection.cursor()
    
    try:
        # Vérifier si la table est vide
        cursor.execute("SELECT COUNT(*) FROM farm_descriptions")
        count = cursor.fetchone()[0]
        
        if count == 0:
            farms = [
                ("cookie", "Ferme à cookies classique", "/static/images/cookie_farm.jpg"),
                ("pumpkin", "Ferme à citrouilles", "/static/images/pumpkin_farm.jpg"),
                ("wheat", "Ferme de blé", "/static/images/wheat_farm.jpg"),
                ("cow", "Ferme à vaches", "/static/images/cow_farm.jpg")
            ]
            
            cursor.executemany(
                "INSERT INTO farm_descriptions (game_style, description, image_url) VALUES (%s, %s, %s)",
                farms
            )
            connection.commit()
            print("Styles de ferme initialisés")
    except Error as e:
        print(f"Erreur lors de l'initialisation des styles: {e}")
        connection.rollback()
    finally:
        cursor.close()
        connection.close()