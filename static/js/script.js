// Ajout de la position de notre carte sur notre page (GetMap)
const map = L.map('map', {
    editable: true,
    zoomControl: false // Désactive les boutons par défaut
}).setView([-11.666, 27.482], 15.4);

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
const wfsUrl = "http://localhost:8080/geoserver/CBD_2025/ows?" +
  "service=WFS&version=1.0.0&request=GetFeature" +
  "&typeName=CBD_2025:Inventaire" +
  "&maxFeatures=50&outputFormat=application/json";

fetch(wfsUrl)
  .then(response => response.json())
  .then(data => {
    const inventaireLayer = L.geoJSON(data, {
      onEachFeature: function (feature, layer) {
        if (feature.properties) {
          const nom = feature.properties.nom || "Inconnu";
          const categorie = feature.properties.categorie || "Non définie";
          layer.bindPopup(`<strong>${nom}</strong><br>Catégorie : ${categorie}`);
        }
      },
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 6,
          fillColor: "#2c7bb6",
          color: "#fff",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        });
      }
    });

    inventaireLayer.addTo(map);
  })
  .catch(error => {
    console.error("Erreur lors du chargement WFS GeoJSON :", error);
  });

