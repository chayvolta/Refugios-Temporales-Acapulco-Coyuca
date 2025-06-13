const map = L.map('map').setView([16.85, -99.9], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let refugiosInfo = {};

Papa.parse("refugios.csv", {
  download: true,
  header: true,
  complete: function(results) {
    results.data.forEach(row => {
      refugiosInfo[row.CLV] = row;
    });
    cargarGeojson();
  }
});

function cargarGeojson() {
  fetch("refugios.geojson")
    .then(res => res.json())
    .then(geojson => {
      L.geoJSON(geojson, {
        onEachFeature: function(feature, layer) {
          const props = refugiosInfo[feature.properties.CLAVE];
          let popupContent = `<strong>${props.Nombre}</strong><br>`;
          popupContent += `<b>Dirección:</b> ${props["Dirección"]}<br>`;
          popupContent += `<b>Capacidad personas:</b> ${props["Capacidad de personas"]}<br>`;
          popupContent += `<b>Capacidad familias:</b> ${props["Capacidad de familias"]}<br>`;
          popupContent += `<b>Municipio:</b> ${props["Municipio"]}`;
          layer.bindPopup(popupContent);
        },
        pointToLayer: function(feature, latlng) {
          return L.circleMarker(latlng, {
            radius: 6,
            fillColor: "#FF4136",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          });
        }
      }).addTo(map);
    });
}
