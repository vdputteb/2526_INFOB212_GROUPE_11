import { showNotification } from './shop_utils.js';

export const fallbackBrooms = [
    {
        id: 1,
        libelle: "Balai traditionnel en paille",
        description: "Balai classique en paille de riz, idéal pour un usage domestique quotidien.",
        categorie: "non_magique",
        prix_location: 3.50,
        prix_vente: 15.00,
        nb_utilisation: 100,
        etat: "neuf",
        img: "🧹",
        inStock: true
    },
    {
        id: 2,
        libelle: "Balai mécanique à franges",
        description: "Balai mécanique avec franges en microfibre, parfait pour les sols lisses.",
        categorie: "non_magique",
        prix_location: 7.90,
        prix_vente: 25.00,
        nb_utilisation: 75,
        etat: "bon",
        img: "🧹🧹",
        inStock: true
    },
    {
        id: 3,
        libelle: "Balai Volant Éclairs",
        description: "Balai magique ultra-rapide avec éclairs lumineux",
        categorie: "magique",
        prix_location: 50.00,
        prix_vente: 350.00,
        nb_utilisation: 500,
        etat: "neuf",
        img: "⚡🧹",
        niveau_magique: 5,
        vitesse: 150,
        permis_magique_requis: 4,
        composants_magiques: ["Ecaille de dragon", "Queue de licorne", "Poudre d'étoile"],
        inStock: true
    },
    {
        id: 4,
        libelle: "Balai des Brumes",
        description: "Balai capable de créer un brouillard protecteur",
        categorie: "magique",
        prix_location: 35.00,
        prix_vente: 280.00,
        nb_utilisation: 300,
        etat: "use",
        img: "🌫️🧹",
        niveau_magique: 3,
        vitesse: 90,
        permis_magique_requis: 2,
        composants_magiques: ["Feuille d'Yggdrasil", "Bave de limace magique"],
        inStock: true
    },
    {
        id: 5,
        libelle: "Balai à gazon extérieur",
        description: "Balai robuste pour feuilles et débris sur pelouse ou terrasse.",
        categorie: "non_magique",
        prix_location: 8.50,
        prix_vente: 28.00,
        nb_utilisation: 50,
        etat: "use",
        img: "🌿🧹",
        inStock: true
    },
    {
        id: 6,
        libelle: "Balai Phénix",
        description: "Balai légendaire du Phénix, résiste au feu",
        categorie: "magique",
        prix_location: 75.00,
        prix_vente: 600.00,
        nb_utilisation: 1000,
        etat: "neuf",
        img: "🔥🧹",
        niveau_magique: 5,
        vitesse: 200,
        permis_magique_requis: 5,
        composants_magiques: ["Plume de Phénix", "Cendre volcanique", "Sang de dragon"],
        inStock: true
    }
];

let masterBrooms = [...fallbackBrooms];
let currentBrooms = [...fallbackBrooms];
let hasMagicalBrooms = true;

export async function fetchBroomsFromAPI() {
    try {
        console.log("Tentative de récupération des balais depuis l'API...");
        
        const response = await fetch('/shop/balai_moldu/');
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
            console.log("Données récupérées avec succès depuis l'API");
            masterBrooms = [...data];
            hasMagicalBrooms = data.some(broom => broom.categorie === "magique");
            currentBrooms = [...data];
            showNotification("Données mises à jour depuis le serveur", "success");
            return data;
        } else {
            throw new Error("Format de données invalide reçu de l'API");
        }
        
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des balais:", error);
        showNotification("Impossible de récupérer les balais du serveur. Affichage de la liste locale.", "error");
        return null;
    }
}

export function getMasterBrooms() { return masterBrooms; }
export function getCurrentBrooms() { return currentBrooms; }
export function setCurrentBrooms(data) { currentBrooms = data; }
export function getHasMagicalBrooms() { return hasMagicalBrooms; }