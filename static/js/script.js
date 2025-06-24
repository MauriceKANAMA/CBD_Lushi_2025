// Ajout de la position de notre carte sur notre page (GetMap)
const map = L.map('map', {
    editable: true,
    zoomControl: false // Désactive les boutons par défaut
}).setView([-11.665, 27.486], 15.4);

// Déplacement des boutons de zoom à droite
L.control.zoom({ 
    position: 'topright'
}).addTo(map);

// Fond de carte OSM et ESRI
const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', 
    {foo: 'bar', 
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// Creation d'un groupe (Layer control)
const baseMap = L.control.layers({
    'OpenStreetMap':osm,
    'Esri Satellite':Esri_WorldImagery
}).addTo(map);

// Parametre de la recherche par categories
const categorie = document.getElementById("categorie").addEventListener("change", function() {
  const selected = this.value;
    console.log("Catégorie choisie :", selected);
});

//Parametres du toggle-sidebar
const toogle = document.addEventListener('DOMContentLoaded', function () {
  const toggleButton = document.querySelector('.toggle-sidebar');
  const sidebar = document.querySelector('.sidebar');

  // Cacher la sidebar au chargement
  sidebar.classList.add('hidden');

  // Gérer l'affichage lors du clic
  toggleButton.addEventListener('click', function () {
    sidebar.classList.toggle('hidden');
  });
});

//AJOUT DE NOS COUCHES 

// Chargement des données WFS GeoJSON pour l'inventaire
const Inventaire = "http://localhost:8080/geoserver/CBD_2025/ows?" +
  "service=WFS&version=1.0.0&request=GetFeature" +
  "&typeName=CBD_2025:Inventaire" +
  "&maxFeatures=2560&outputFormat=application/json";

fetch(Inventaire)
  .then(response => response.json())
  .then(data => {
    const inventaireLayer = L.geoJSON(data, {
      onEachFeature: function (feature, layer) {
        if (feature.properties) {
          const nom = feature.properties.nom_etabli || "Inconnu";
          const categorie = feature.properties.categories || "Non définie";
          const sousCategorie = feature.properties.sous-categorie || "Non définie";
          const Rubrique = feature.properties.types_rubr || "Non définie";
          const description = feature.properties.descriptio || "Aucune description disponible";
          const adresse = feature.properties.adresses || "Aucune adresse disponible";
          layer.bindPopup(
            `<strong>Nom</strong> : ${nom}` +  
            `<br><strong>Catégorie</strong> : ${categorie}` +
            `<br><strong>Sous-catégorie</strong> : ${sousCategorie}` +
            `<br><strong>Rubrique</strong> : ${Rubrique}` +
            `<br><strong>Description</strong> : ${description}` +
            `<br><strong>Adresse</strong> : Avenue ${adresse}` +
            `<br><strong>Coordonnées</strong> : ${feature.geometry.coordinates}`
          );
        }
      },
      pointToLayer: function (feature, latlng) {
        const customIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', // ou ton propre fichier
          iconSize: [5, 5],       // ← 🎯 change la taille ici
          iconAnchor: [20, 60],     // ← le point d'accroche (bas du pic)
          popupAnchor: [0, -60]     // ← où apparaît le popup par rapport à l'icône
        });

        return L.marker(latlng);
      }
    }).addTo(map);
  })
  .catch(error => {
    console.error("Erreur lors du chargement WFS GeoJSON :", error);
  });