
const map = L.map('map').setView([16.85, -99.9], 10);

// Capas base
const baseLayers = {
  "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }),
  "Satélite": L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'),
  "Oscuro": L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_dark/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; Stadia Maps'
  })
};
baseLayers["OpenStreetMap"].addTo(map);

// Icono personalizado
const iconRefugio = L.icon({
  iconUrl: 'family.svg',
  iconSize: [25, 25]
});

const refugiosLayer = L.layerGroup().addTo(map);
const cipLayer = L.layerGroup().addTo(map);

const overlays = {
  "Refugios temporales": refugiosLayer,
  "Delimitación CIP Acapulco-Coyuca": cipLayer
};
L.control.layers(baseLayers, overlays).addTo(map);

let refugiosData = {};

// Cargar CSV
Papa.parse("refugios.csv", {
  download: true,
  header: true,
  complete: function(results) {
    results.data.forEach(row => {
      refugiosData[row.CLV] = row;
    });
    cargarGeojson();
  }
});

function cargarGeojson() {
  fetch("refugios.geojson")
    .then(res => res.json())
    .then(geojson => {
      L.geoJSON(geojson, {
        pointToLayer: function(feature, latlng) {
          const clave = feature.properties.CLAVE;
          const props = refugiosData[clave];
          const marker = L.marker(latlng, { icon: iconRefugio });

          if (props) {
            const popup = \`
              <strong>\${props.Nombre}</strong><br>
              <b>Dirección:</b> \${props["Dirección"]}<br>
              <b>Capacidad personas:</b> \${props["Capacidad de personas"]}<br>
              <b>Capacidad familias:</b> \${props["Capacidad de familias"]}<br>
              <b>Municipio:</b> \${props["Municipio"]}
            \`;
            marker.bindPopup(popup);
          } else {
            marker.bindPopup("CLAVE sin información: " + clave);
          }

          return marker;
        }
      }).addTo(refugiosLayer);
    });
}

// Cargar polígono CIP
fetch("cip_aca_coy.geojson")
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: "#611232",
        weight: 2,
        fillColor: "#611232",
        fillOpacity: 0.5
      }
    }).addTo(cipLayer);
  });
