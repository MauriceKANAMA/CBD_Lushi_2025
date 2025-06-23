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


//Union des deux groupes
// const layers = L.control.layers(baseMap, mapGroup, {collapsed: true}).addTo(map);

document.getElementById("categorie").addEventListener("change", function() {
  const selected = this.value;
    console.log("Catégorie choisie :", selected);
});

//Paarametres du toggle-sidebar
// const toggle = document.querySelector('.toggle-sidebar').addEventListener('click', function () {
//       const sidebar = document.querySelector('.sidebar');
//       sidebar.classList.toggle('hidden');
//     });

document.addEventListener('click', function () {
    const toggleButton = document.querySelector('.toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');

    // Cacher la sidebar au chargement
    sidebar.classList.add('hidden');

    // Gérer l'affichage lors du clic
    toggleButton.addEventListener('click', function () {
      sidebar.classList.toggle('hidden');
    });
  });