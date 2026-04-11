export async function fetchCatalogue() {
    try {
        const response = await fetch('/api/catalogue');
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.error('Erreur chargement catalogue:', error);
    }
    return getFallbackCatalogue();
}

function getFallbackCatalogue() {
    return [
        { id: 1, libelle: "Balai traditionnel", description: "Balai classique", categorie: "non_magique", prix_location: 3.50, prix_vente: 15.00, nb_utilisation: 100, etat: "neuf", img: "🧹", inStock: true },
        { id: 2, libelle: "Balai mécanique", description: "Balai à franges", categorie: "non_magique", prix_location: 7.90, prix_vente: 25.00, nb_utilisation: 75, etat: "bon", img: "🧹🧹", inStock: true },
        { id: 3, libelle: "Balai Volant Éclairs", description: "Balai magique ultra-rapide", categorie: "magique", prix_location: 50.00, prix_vente: 350.00, nb_utilisation: 500, etat: "neuf", img: "⚡🧹", niveau_magique: 5, inStock: true }
    ];
}