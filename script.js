Papa.parse("https://raw.githubusercontent.com/chayvolta/Refugios-Temporales-Acapulco-Coyuca/main/refugios.csv", {
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
  fetch("https://raw.githubusercontent.com/chayvolta/Refugios-Temporales-Acapulco-Coyuca/main/refugios.geojson")
    .then(res => res.json())
    .then(geojson => {
      L.geoJSON(geojson, {
        onEachFeature: function(feature, layer) {
          const clave = feature.properties.CLAVE;
          const props = refugiosInfo[clave];

          if (!props) {
            console.warn("No se encontró información para:", clave);
            layer.bindPopup("Refugio sin información adicional. CLAVE: " + clave);
            return;
          }

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
