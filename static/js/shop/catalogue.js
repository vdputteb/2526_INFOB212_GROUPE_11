export async function fetchCatalogue() {
    try {
        const response = await fetch("/api/catalogue", {
            credentials: "include",
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        if (response.ok) {
            const data = await response.json();
            // Normaliser les données si nécessaire
            return data.map(normalizeBroom);
        }
    } catch (error) {
        console.error('Erreur chargement catalogue:', error);
    }
    return getFallbackCatalogue();
}

// Normalise les données pour correspondre à la structure attendue par le front
function normalizeBroom(broom) {
    return {
        id_balai: broom.id_balai,
        Libelle: broom.Libelle,
        description: broom.description,
        img: broom.img,
        uses_number: broom.uses_number,
        sale_price: broom.sale_price,
        location_price: broom.location_price,
        wear: broom.wear,
        status: broom.status,
        categorie: broom.BALAI_MAGIQUE === 1 ? 'magique' : 'non_magique',
        BALAI_MAGIQUE: broom.BALAI_MAGIQUE,
        fabricant_name: broom.fabricant_name,
        // Compatibilité avec l'ancien code
        id: broom.id_balai,
        libelle: broom.Libelle,
        prix_location: broom.location_price,
        prix_vente: broom.sale_price,
        nb_utilisation: broom.uses_number,
        etat: broom.wear > 80 ? 'use' : (broom.wear > 40 ? 'bon' : 'neuf'),
        inStock: broom.status === 'in stock'
    };
}

function getFallbackCatalogue() {
    return [
        { id_balai: 1, Libelle: "Nimbus 2000", description: "Un classique fiable et rapide", categorie: "non_magique", prix_location: 29.99, prix_vente: 299.99, nb_utilisation: 150, etat: "bon", img: "nimbus2000.jpg", inStock: true, BALAI_MAGIQUE: null, wear: 25, location_price: 29.99, sale_price: 299.99, uses_number: 150, libelle: "Nimbus 2000", id: 1 },
        { id_balai: 2, Libelle: "Nimbus 2001", description: "Version améliorée du Nimbus 2000", categorie: "non_magique", prix_location: 39.99, prix_vente: 399.99, nb_utilisation: 120, etat: "neuf", img: "nimbus2001.jpg", inStock: true, BALAI_MAGIQUE: null, wear: 15, location_price: 39.99, sale_price: 399.99, uses_number: 120, libelle: "Nimbus 2001", id: 2 },
        { id_balai: 3, Libelle: "Firebolt", description: "Le balai le plus rapide du marché", categorie: "magique", prix_location: 89.99, prix_vente: 899.99, nb_utilisation: 80, etat: "neuf", img: "firebolt.jpg", inStock: true, BALAI_MAGIQUE: 1, wear: 5, location_price: 89.99, sale_price: 899.99, uses_number: 80, libelle: "Firebolt", id: 3 }
    ];
}