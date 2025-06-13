
const cipLayer = L.layerGroup();
const refugiosLayer = L.layerGroup();

const satelliteWithLabels = L.layerGroup([
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'),
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri'
  })
]);

const map = L.map('map', {
  layers: [satelliteWithLabels, refugiosLayer, cipLayer]
});

const baseLayers = {
  "Satelital": satelliteWithLabels,
  "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
  "Oscuro": L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB'
  })
};

const overlays = {
  "Refugios temporales": refugiosLayer,
  "Delimitación CIP Acapulco-Coyuca": cipLayer
};

L.control.layers(baseLayers, overlays, { position: 'topleft', collapsed: false }).addTo(map);

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
      L.geoJSON(geojson, {
        pointToLayer: function(feature, latlng) {
          const clave = feature.properties.CLAVE;
          const props = refugiosData[clave];
          const marker = L.circleMarker(latlng, {
            radius: 6,
            fillColor: "#ff6600",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          });

          if (props) {
            const popup = "<strong>" + props.Nombre + "</strong><br>" +
                          "<b>Dirección:</b> " + props["Dirección"] + "<br>" +
                          "<b>Capacidad personas:</b> " + props["Capacidad de personas"] + "<br>" +
                          "<b>Capacidad familias:</b> " + props["Capacidad de familias"] + "<br>" +
                          "<b>Municipio:</b> " + props["Municipio"] + "<br>" +
                          "<b>Ubicación:</b> " + props["Ubicación"];
            marker.bindPopup(popup);
          } else {
            marker.bindPopup("Refugio sin datos CSV: " + clave);
          }

          return marker;
        }
      }).addTo(refugiosLayer);
    });
}

fetch("cip_aca_coy.geojson")
  .then(res => res.json())
  .then(data => {
    const capa = L.geoJSON(data, {
      style: {
        color: "#611232",
        weight: 2,
        fillColor: "#611232",
        fillOpacity: 0.5
      }
    }).addTo(cipLayer);
    map.fitBounds(capa.getBounds());
  });
