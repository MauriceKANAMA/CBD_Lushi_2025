document.addEventListener("DOMContentLoaded", function () {
  // Ajout de la position de notre carte sur notre page (GetMap)
  const map = L.map('map', {
      editable: true,
      zoomControl: false // Désactive les boutons par défaut
  }).setView([-11.665, 27.486], 15.4);

  // GESTION DE LA BARRE GAUCHE
  const toggleButton = document.querySelector('.toggle-sidebar');
  const sidebar = document.querySelector('.sidebar');

  // Cacher la sidebar au chargement
  sidebar.classList.add('hidden');

  // Gérer l'affichage lors du clic
  toggleButton.addEventListener('click', function () {
    sidebar.classList.toggle('hidden');
  });

  // Fond de carte OSM et ESRI
  const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', 
      {foo: 'bar', 
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });

  //AJOUT DE NOS COUCHES 
  //Chargement des données WFS GeoJSON pour l'inventaire
  const Inventaire = "http://localhost:8080/geoserver/CBD_2025/ows?" +
    "service=WFS&version=1.0.0&request=GetFeature" +
    "&typeName=CBD_2025:Inventaire" +
    "&maxFeatures=25&outputFormat=application/json";

  // Appel de la donnee par API Rest GET declarer dans le code flask python
  // const Inventaire = "/api/inventaire/geojson";

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

  document.getElementById("zoomExtentBtn").addEventListener("click", function () {
    if (markers.getLayers().length > 0) {
      map.fitBounds(markers.getBounds(), { padding: [30, 30] });
    } else {
      alert("Aucun point à afficher.");
    }
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

    // Appliquer un zoom étendu sur tous les points affichés
    setTimeout(() => {
      if (markers.getLayers().length > 0) {
        map.fitBounds(markers.getBounds());
      }
    }, 300); // délai pour attendre le rendu
  });

  const baseLayerBtn = document.getElementById("baseLayerBtn");
  const basemapMenu = document.getElementById("basemapMenu");

  // Toggle du menu fond de carte
  baseLayerBtn.addEventListener("click", function () {
    basemapMenu.classList.toggle("hidden");
  });

  // Sélection du fond de carte
  basemapMenu.addEventListener("click", function (e) {
    if (e.target.tagName === 'LI') {
      const selectedLayer = e.target.getAttribute("data-layer");
      console.log("Changer de fond de carte vers :", selectedLayer);
      // TODO : logique pour changer la couche selon `selectedLayer`
      basemapMenu.classList.add("hidden");
    }
  });

  // Fermer si on clique ailleurs
  document.addEventListener("click", function (e) {
    if (!baseLayerBtn.contains(e.target) && !basemapMenu.contains(e.target)) {
      basemapMenu.classList.add("hidden");
    }
  });

  



  // SCRIPTS DE LA BARRE DE DROITE
  // Gérer les boutons zoom
  document.getElementById("zoomIn").addEventListener("click", function () {
    map.zoomIn();
  });

  document.getElementById("zoomOut").addEventListener("click", function () {
    map.zoomOut();
  });

  // Gérer le fond de carte
  document.getElementById("baseLayerSelect").addEventListener("change", function () {
    const value = this.value;
    if (value === "osm") {
      map.removeLayer(Esri_WorldImagery);
      map.addLayer(osm);
    } else if (value === "esri") {
      map.removeLayer(osm);
      map.addLayer(Esri_WorldImagery);
    }
  });

  // GESTION DU BOUTON DE LA BARRE DE DROITE
  document.getElementById("toggleRightSidebar").addEventListener("click", function () {
    const sidebar = document.getElementById("rightSidebar");
    const icon = this.querySelector("i");

    sidebar.classList.toggle("collapsed");
    icon.className = sidebar.classList.contains("collapsed") ? "fas fa-angle-right" : "fas fa-angle-left";
  });



  // SCRIPTS POUR API REST 
  // Ajout d'un point grace a l'API Rest Post
  document.getElementById("addPointBtn").addEventListener("click", function () {
    alert("Cliquez sur la carte pour ajouter un nouveau point.");
    
    map.once("click", function (e) {
      const latlng = e.latlng;

      const formHtml = `
        <form id="addForm">
          <label>Nom :</label><br>
          <input type="text" id="nom" name="nom" required><br>

          <label>Catégorie :</label><br>
          <input type="text" id="categorie" name="categorie"><br>

          <label>Sous-catégorie :</label><br>
          <input type="text" id="sous-categ" name="sous_categ"><br>

          <label>Rubriques :</label><br>
          <input type="text" id="types_rubr" name="types_rubr"><br>

          <label>Description :</label><br>
          <textarea id="descriptio" name="descriptio"></textarea><br>

          <label>Adresse (Avenue) :</label><br>
          <input type="text" id="adresses" name="adresses"><br>

          <label>Date :</label><br>
          <input type="date" id="time" name="time" required><br>

          <button type="submit">✅ Valider</button>
        </form>
      `;

      const popup = L.popup()
        .setLatLng(latlng)
        .setContent(formHtml)
        .openOn(map);

      setTimeout(() => {
        const form = document.getElementById("addForm");
        form.addEventListener("submit", function (event) {
          event.preventDefault();
          
          const newPoint = {
            geom: { lat: latlng.lat, lng: latlng.lng },
            NomEtabliss: document.getElementById("nom").value,
            Categorie: document.getElementById("categorie").value,
            Sous_categorie: document.getElementById("sous-categ").value,
            Rubriques: document.getElementById("types_rubr").value,
            Description: document.getElementById("descriptio").value,
            Avenue: document.getElementById("adresses").value,
            Date: document.getElementById("time").value,
          };

          fetch("/api/inventaire", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPoint)
          })
          .then(res => res.json())
          .then(data => {
            alert("✅ Point ajouté avec succès !");
            map.closePopup();
            location.reload();
          })
          .catch(err => {
            console.error("Erreur :", err);
            alert("❌ Erreur lors de l'ajout.");
          });
        });
      }, 100); // attend que le DOM du popup soit chargé
    });
  });


  // Ajout d'un point grace a l'API Rest Put
  document.getElementById("editPointBtn").addEventListener("click", function () {
    alert("Cliquez sur un point pour modifier.");

    map.eachLayer(layer => {
      if (layer.feature && layer.feature.properties.id) {
        layer.on("click", function () {
          const props = layer.feature.properties;
          const id = props.id;

          const nouveauNom = prompt("Nouveau nom ?", props.nom_etabli);
          if (!nouveauNom) return;

          const latlng = layer.getLatLng();

          const updatedPoint = {
            geom: { lat: latlng.lat, lng: latlng.lng },
            NomEtabliss: nouveauNom,
            Sous_categorie: nouveauNom,
            Rubriques: nouveauNom,
            Description: nouveauNom,
            Avenue: nouveauNom,
            Date: nouveauNom,
          };

          fetch(`/api/inventaire/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedPoint)
          })
          .then(res => res.json())
          .then(data => {
            alert("Point mis à jour !");
            location.reload();
          })
          .catch(err => {
            console.error("Erreur :", err);
            alert("Erreur lors de la modification.");
          });
        });
      }
    });
  });


});