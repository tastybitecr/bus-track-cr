// BUS TRACK CR
// Version 0.1.0

// AUTENTICACION DE FIREBASE

let driverUID = null;

auth.signInAnonymously()
  .then((result) => {
    driverUID = result.user.uid;

    console.log("Conductor autenticado");
    console.log("ID del conductor:", driverUID);
  })
  .catch((error) => {
    console.error("Error de autenticación:", error);
  });

const naranjo = [10.098, -84.378];

// Crear mapa
const map = L.map("map").setView(naranjo, 14);

// Cargar mapa OpenStreetMap
L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }
).addTo(map);

// Paradas ilustrativas para demostración
const stops = [
  {
    name: "Parada demostrativa A",
    position: [10.100, -84.380]
  },
  {
    name: "Parada demostrativa B",
    position: [10.095, -84.375]
  },
  {
    name: "Parada demostrativa C",
    position: [10.091, -84.382]
  }
];

// Mostrar paradas
const stopsContainer = document.getElementById("stops");

stops.forEach((stop, index) => {
  L.marker(stop.position)
    .addTo(map)
    .bindPopup(stop.name);

  const item = document.createElement("div");
  item.className = "stop";

  const name = document.createElement("strong");
  name.textContent = stop.name;

  const number = document.createElement("small");
  number.textContent = `Punto ${index + 1}`;

  item.append(name, number);
  stopsContainer.appendChild(item);
});

// Dibujar recorrido ilustrativo
const routeCoordinates = [
  naranjo,
  ...stops.map(stop => stop.position)
];

L.polyline(routeCoordinates, {
  color: "#16a6a0",
  weight: 5,
  opacity: 0.8
}).addTo(map);

// Crear icono de autobús
const busIcon = L.divIcon({
  html: '<div style="font-size:30px">🚌</div>',
  className: "bus-marker",
  iconSize: [35, 35],
  iconAnchor: [17, 17]
});

// BUS TRACK CR
// MODULO GPS DEL CONDUCTOR

const busMarker = L.marker(naranjo, {
  icon: busIcon
}).addTo(map);

busMarker.bindPopup("Autobús de demostración 001");

let gpsWatcher = null;
let accuracyCircle = null;

const startButton = document.getElementById("start-gps");
const stopButton = document.getElementById("stop-gps");

const gpsStatus = document.getElementById("gps-status");
const gpsAccuracy = document.getElementById("gps-accuracy");
const gpsUpdated = document.getElementById("gps-updated");

function startGPS() {

  if (!navigator.geolocation) {
    gpsStatus.textContent =
      "Este navegador no admite GPS.";
    return;
  }

  if (gpsWatcher !== null) {
    return;
  }

  gpsStatus.textContent = "Solicitando ubicación...";

  startButton.disabled = true;

  gpsWatcher = navigator.geolocation.watchPosition(

    function(position) {

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      const currentPosition = [
        latitude,
        longitude
      ];

      // Actualizar marcador del autobús
      busMarker.setLatLng(currentPosition);

      busMarker.setPopupContent(
        "Unidad 001 - GPS activo"
      );

      // Centrar mapa en la ubicación actual
      map.panTo(currentPosition);

      // Mostrar precisión GPS
      gpsAccuracy.textContent =
        "Precisión: " + Math.round(accuracy) + " metros";

      // Actualizar círculo de precisión
      if (accuracyCircle) {
        accuracyCircle.setLatLng(currentPosition);
        accuracyCircle.setRadius(accuracy);
      } else {
        accuracyCircle = L.circle(currentPosition, {
          radius: accuracy,
          color: "#16a6a0",
          fillOpacity: 0.12
        }).addTo(map);
      }

      gpsStatus.textContent = "GPS activo";

      gpsUpdated.textContent =
        "Última actualización: " +
        new Date().toLocaleTimeString();

    },

    function(error) {

      const messages = {
        1: "Permiso de ubicación denegado.",
        2: "Ubicación no disponible.",
        3: "Tiempo de espera agotado."
      };

      gpsStatus.textContent =
        messages[error.code] ||
        "Error al obtener ubicación.";

      stopGPS();
    },

    {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 20000
    }

  );

  stopButton.disabled = false;
}

function stopGPS() {

  if (gpsWatcher !== null) {
    navigator.geolocation.clearWatch(gpsWatcher);
    gpsWatcher = null;
  }

  if (accuracyCircle) {
    map.removeLayer(accuracyCircle);
    accuracyCircle = null;
  }

  gpsStatus.textContent = "GPS detenido";

  startButton.disabled = false;
  stopButton.disabled = true;
}

startButton.addEventListener("click", startGPS);
stopButton.addEventListener("click", stopGPS);

console.log("BusTrack CR GPS listo");
