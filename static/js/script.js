// Ajout de la position de notre carte sur notre page (GetMap)
const map = L.map('map', {
    editable: true,
    zoomControl: false // Désactive les boutons par défaut
}).setView([-11.668, 27.482], 16);

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

// Ajout de nos couches sous forme des services WMS (GetCapabilities) depuis Geoserver
var BlocCBD = L.Geoserver.wms("http://localhost:8080/geoserver/LushiCBD1979/wms", {
    layers: "LushiCBD1979:Bloc_CBD",
}).addTo(map);

// Ajout de nos couches sous forme des services WMS (GetCapabilities) depuis Geoserver
var Limite1979 = L.Geoserver.wms("http://localhost:8080/geoserver/wms", {
    layers: "LushiCBD1979:Inventaire_1979",
    transparent: true,
    format:"image/png"
}).addTo(map);

const Inventaire1979 = L.Geoserver.wms("http://localhost:8080/geoserver/LushiCBD1979/wms", {
    layers: "Lushi_CBD:cbdlushi2024",
}).addTo(map);

//Groupe des donnees (cartes)
const mapGroup = {
  "Ilot du centre": BlocCBD,
  "Limite du centre": Limite1979,
  "Commerces du centre": Inventaire1979
}

//Union des deux groupes
const layers = L.control.layers(baseMap, mapGroup, {collapsed: true}).addTo(map);

document.getElementById("categorie").addEventListener("change", function() {
  const selected = this.value;
    console.log("Catégorie choisie :", selected);
});
