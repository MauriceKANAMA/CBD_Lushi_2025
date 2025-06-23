var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = L.Control.Draw({
  edit: {
    featureGroup: drawnItems
  }
});
map.addControl(drawControl);

map.on('draw:created', function (e) {
  var layer = e.layer;
  drawnItems.addLayer(layer);

  // Envoyer la géométrie au backend Flask (exemple en GeoJSON)
  var geojson = layer.toGeoJSON();
  fetch('/api/inventaire', {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(geojson)
  });
});

// Pour l’édition et la suppression, utiliser draw:edited et draw:deleted