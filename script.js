const refugiosLayer = L.layerGroup();

const satelliteWithLabels = L.layerGroup([
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'),
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri'
  })
]);

const map = L.map('map', {
  layers: [satelliteWithLabels, refugiosLayer]
});

// 🚫 Eliminado el control de capas (L.control.layers)
// 🚫 Eliminadas las definiciones de baseLayers y overlays

let refugiosData = {};
Papa.parse("refugios.csv", {
  download: true,
  header: true,
  complete: function(results) {
    results.data.forEach(row => {
      refugiosData[row.CLV] = row;
    });
    cargarGeojsonRefugios();
  }
});

function cargarGeojsonRefugios() {
  fetch("refugios.geojson")
    .then(res => res.json())
    .then(geojson => {
      const capaRefugios = L.geoJSON(geojson, {
        pointToLayer: function(feature, latlng) {
          const clave = feature.properties.CLAVE;
          const props = refugiosData[clave];

          if (!props) {
            return null; // ⛔ Ignora puntos sin datos CSV
          }

          const marker = L.circleMarker(latlng, {
            radius: 6,
            fillColor: "#ff6600",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          });

          const popup = "<strong>" + props.Nombre + "</strong><br>" +
                        "<b>Dirección:</b> " + props["Dirección"] + "<br>" +
                        "<b>Capacidad personas:</b> " + props["Capacidad de personas"] + "<br>" +
                        "<b>Capacidad familias:</b> " + props["Capacidad de familias"] + "<br>" +
                        "<b>Municipio:</b> " + props["Municipio"] + "<br>" +
                        '<b>Ubicación:</b> <a href="' + props["Ubicación"] + '" target="_blank">Ver en mapa</a>';
          marker.bindPopup(popup);
          return marker;
        }
      }).addTo(refugiosLayer);

      // ✅ Zoom automático a la capa de refugios
      map.fitBounds(capaRefugios.getBounds());
    });
}
