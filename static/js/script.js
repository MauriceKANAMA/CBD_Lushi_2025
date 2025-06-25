document.addEventListener("DOMContentLoaded", function () {
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

  let allFeatures = []; // Pour stocker toutes les entités initiales
  let markers = L.layerGroup(); // Cluster global

  fetch(Inventaire)
    .then(response => response.json())
    .then(data => {
      allFeatures = data.features; // Stocke toutes les entités
      afficherFeaturesFiltrées(""); // Affiche tout par défaut
    })
    .catch(error => {
      console.error("Erreur lors du chargement WFS GeoJSON :", error);
    });

  // Fonction pour le filtrage des entités pour la selection par categorie et recherche par nom
  function afficherFeaturesFiltrées(categorieFiltre, termeRecherche = "") {
    markers.clearLayers();

    let dataFiltrée = allFeatures;

    // Filtrage par catégorie
    if (categorieFiltre && categorieFiltre !== "-- Choisir une catégorie --") {
      dataFiltrée = dataFiltrée.filter(f => f.properties.categories === categorieFiltre);
    }

    // Filtrage par nom, avenue, rubriques et descriptions
    if (termeRecherche) {
      const terme = termeRecherche.toLowerCase();
      dataFiltrée = dataFiltrée.filter(f => {
        const props = f.properties;
        return (
          (props.nom_etabli && props.nom_etabli.toLowerCase().includes(terme)) ||
          (props.adresses && props.adresses.toLowerCase().includes(terme)) ||
          (props.description && props.description.toLowerCase().includes(terme)) ||
          (props["sous-categorie"] && props["sous-categorie"].toLowerCase().includes(terme)) ||
          (props.types_rubr && props.types_rubr.toLowerCase().includes(terme)) ||
          (props.categories && props.categories.toLowerCase().includes(terme))
        );
      });
    }



    const coucheGeoJSON = L.geoJSON(dataFiltrée, {
      onEachFeature: function (feature, layer) {
        if (feature.properties) {
          const nom = feature.properties.nom_etabli || "Inconnu";
          const categorie = feature.properties.categories || "Non définie";
          const sousCategorie = feature.properties["sous-categorie"] || "Non définie";
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
        return L.marker(latlng, {
          icon: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            shadowSize: [41, 41]
          })
        });
      }
    });

    markers.addLayer(coucheGeoJSON);
    map.addLayer(markers);
  }

  function mettreAJourListeResultats(termeRecherche, categorieFiltre) {
    const resultList = document.getElementById("searchResults");
    resultList.innerHTML = ""; // vide la liste

    let resultats = allFeatures;

    if (categorieFiltre && categorieFiltre !== "-- Choisir une catégorie --") {
      resultats = resultats.filter(f => f.properties.categories === categorieFiltre);
    }

    if (termeRecherche) {
      const terme = termeRecherche.toLowerCase();
      resultats = resultats.filter(f => {
        const props = f.properties;
        return (
          (props.nom_etabli && props.nom_etabli.toLowerCase().includes(terme)) ||
          (props.adresses && props.adresses.toLowerCase().includes(terme)) ||
          (props.description && props.description.toLowerCase().includes(terme)) ||
          (props["sous-categorie"] && props["sous-categorie"].toLowerCase().includes(terme)) ||
          (props.types_rubr && props.types_rubr.toLowerCase().includes(terme)) ||
          (props.categories && props.categories.toLowerCase().includes(terme))
        );
      });
    }

    // Afficher les 10 premiers résultats max
    resultats.slice(0, 10).forEach(feature => {
      const li = document.createElement("li");
      li.textContent = feature.properties.nom_etabli || "Inconnu";
      li.addEventListener("click", () => {
        const coords = feature.geometry.coordinates;
        const latlng = L.latLng(coords[1], coords[0]);
        map.setView(latlng, 18); // zoom sur le point
        // Créer un marqueur temporaire (facultatif)
        L.popup()
          .setLatLng(latlng)
          .setContent(`<strong>${feature.properties.nom_etabli}</strong>`)
          .openOn(map);
      });
      resultList.appendChild(li);
    });

    // Si aucun résultat
    if (resultats.length === 0 && termeRecherche) {
      const li = document.createElement("li");
      li.textContent = "Aucun résultat trouvé.";
      li.style.fontStyle = "italic";
      li.style.color = "gray";
      resultList.appendChild(li);
    }
  }



  // EVENEMENTS POUR LA RECHERCHE ET LE FILTRAGE
  // Utilisation du select HTML pour la recherche par catégorie
  document.getElementById("categorie").addEventListener("change", function () {
    const selectedCategorie = this.value;
    const termeRecherche = document.getElementById("search").value;
    afficherFeaturesFiltrées(selectedCategorie, termeRecherche);
  });

  // Utilisation du boutton HTML pour la recherche
  document.getElementById("search").addEventListener("input", function () {
    const termeRecherche = this.value;
    const selectedCategorie = document.getElementById("categorie").value;
    afficherFeaturesFiltrées(selectedCategorie, termeRecherche);
    mettreAJourListeResultats(termeRecherche, selectedCategorie);
  });

  // Utilisation du bouton HTML pour réinitialiser les filtres
  document.getElementById("resetFilters").addEventListener("click", function () {
    // Réinitialise les champs
    document.getElementById("categorie").value = "";
    document.getElementById("search").value = "";

    // Recharge toutes les entités
    afficherFeaturesFiltrées("", "");

    document.getElementById("searchResults").innerHTML = "";
  });


});