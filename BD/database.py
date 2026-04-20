# BD/database_mysql.py
import mysql.connector
from mysql.connector import Error, pooling
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration de la base de données
db_config = {
    'host': os.getenv('DB_HOST'),
    'database': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
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