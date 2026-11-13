// BUS TRACK CR
// Version 0.1.0

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

// Posición inicial de demostración
const busPosition = [10.098, -84.378];

const busMarker = L.marker(busPosition, {
  icon: busIcon
}).addTo(map);

busMarker.bindPopup("Autobús de demostración 001");

console.log("BusTrack CR iniciado correctamente");
