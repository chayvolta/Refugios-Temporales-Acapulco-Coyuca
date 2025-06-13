
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

// Control de capas (visibilidad)
const overlays = {};
const refugiosLayerGroup = L.layerGroup().addTo(map);
const cipLayer = L.layerGroup().addTo(map);
overlays["Refugios temporales"] = refugiosLayerGroup;
overlays["Delimitación CIP Acapulco-Coyuca"] = cipLayer;
L.control.layers(baseLayers, overlays).addTo(map);

// Icono personalizado
const iconRefugio = L.icon({
  iconUrl: 'family.svg',
  iconSize: [25, 25]
});

let refugiosData = {};
let markers = [];

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

// Cargar GeoJSON puntos
function cargarGeojson() {
  fetch("refugios.geojson")
    .then(res => res.json())
    .then(geojson => {
      refugiosLayerGroup.clearLayers();
      markers = [];

      L.geoJSON(geojson, {
        pointToLayer: function(feature, latlng) {
          const clave = feature.properties.CLAVE;
          const props = refugiosData[clave];
          let marker = L.marker(latlng, { icon: iconRefugio });

          if (props) {
            const popup = \`
              <strong>\${props.Nombre}</strong><br>
              <b>Dirección:</b> \${props["Dirección"]}<br>
              <b>Capacidad personas:</b> \${props["Capacidad de personas"]}<br>
              <b>Capacidad familias:</b> \${props["Capacidad de familias"]}<br>
              <b>Municipio:</b> \${props["Municipio"]}
            \`;
            marker.bindPopup(popup);
            marker.feature = { properties: props };  // guardar referencia
            markers.push(marker);
          }
          return marker;
        }
      }).addTo(refugiosLayerGroup);

      llenarMunicipios();
      actualizarListado();
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

// Filtros y búsqueda
document.getElementById("searchBox").addEventListener("input", actualizarListado);
document.getElementById("municipioFilter").addEventListener("change", actualizarListado);
document.getElementById("capMin").addEventListener("input", actualizarListado);
document.getElementById("capMax").addEventListener("input", actualizarListado);

function llenarMunicipios() {
  const select = document.getElementById("municipioFilter");
  const municipios = [...new Set(Object.values(refugiosData).map(d => d.Municipio))];
  select.innerHTML = '<option value="">Todos</option>';
  municipios.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  });
}

function actualizarListado() {
  const lista = document.getElementById("refugioList");
  const busqueda = document.getElementById("searchBox").value.toLowerCase();
  const muni = document.getElementById("municipioFilter").value;
  const capMin = parseInt(document.getElementById("capMin").value) || 0;
  const capMax = parseInt(document.getElementById("capMax").value) || Infinity;

  lista.innerHTML = "";

  markers.forEach(marker => {
    const p = marker.feature.properties;
    if (!p) return;

    const nombre = p.Nombre.toLowerCase();
    const muniOK = !muni || p.Municipio === muni;
    const cap = parseInt(p["Capacidad de personas"]) || 0;
    const capOK = cap >= capMin && cap <= capMax;
    const match = nombre.includes(busqueda) && muniOK && capOK;

    marker.setOpacity(match ? 1 : 0);
    if (match) {
      const li = document.createElement("li");
      li.textContent = p.Nombre;
      li.style.cursor = "pointer";
      li.onclick = () => {
        map.setView(marker.getLatLng(), 14);
        marker.openPopup();
      };
      lista.appendChild(li);
    }
  });
}
