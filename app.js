// ==========================================
// BUS TRACK CR
// VERSION 0.1.1
// ==========================================

// ==========================================
// AUTENTICACION DE FIREBASE
// ==========================================

let driverUID = null;

auth.signInAnonymously()
  .then((result) => {
    driverUID = result.user.uid;

    console.log("Conductor autenticado");
    console.log("Autenticación Firebase lista");
  })
  .catch((error) => {
    console.error("Error de autenticación:", error);
  });


// ==========================================
// CONFIGURACION DEL MAPA
// ==========================================

const naranjo = [10.098, -84.378];

const map = L.map("map").setView(naranjo, 14);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }
).addTo(map);


// ==========================================
// PARADAS DINAMICAS DESDE FIREBASE
// ==========================================

const stopsContainer = document.getElementById("stops");

const stopMarkers = [];

if (stopsContainer) {

  const routeStopsRef = database.ref(
    "routes/naranjo_san_jose/stops"
  );

  routeStopsRef.on("value", (snapshot) => {

    const stops = snapshot.val();

    stopsContainer.innerHTML = "";

    stopMarkers.forEach(marker => map.removeLayer(marker));
    stopMarkers.length = 0;

    if (!stops) {
      stopsContainer.textContent = "No hay paradas registradas.";
      return;
    }

    const orderedStops = Object.entries(stops)
      .sort((a, b) => a[1].order - b[1].order);

    orderedStops.forEach(([stopId, stop]) => {

      const item = document.createElement("div");
      item.className = "stop";

      const name = document.createElement("strong");
      name.textContent = `${stop.order}. ${stop.name}`;

      const status = document.createElement("small");
      status.textContent = stop.verified
        ? "Parada verificada"
        : "Pendiente de verificar";

      item.append(name, status);

      stopsContainer.appendChild(item);

      if (
        stop.verified === true &&
        stop.active === true &&
        typeof stop.latitude === "number" &&
        typeof stop.longitude === "number"
      ) {

        const marker = L.marker([
          stop.latitude,
          stop.longitude
        ])
          .addTo(map)
          .bindPopup(stop.name);

        stopMarkers.push(marker);

      }

    });

    console.log(
      "Paradas cargadas desde Firebase:",
      orderedStops.length
    );

  });

} else {

  console.warn("No se encontró el elemento HTML stops");

}


// ==========================================
// ICONO DEL AUTOBUS
// ==========================================

const busIcon = L.divIcon({
  html: '<div style="font-size:30px">🚌</div>',
  className: "bus-marker",
  iconSize: [35, 35],
  iconAnchor: [17, 17]
});

const busMarker = L.marker(naranjo, {
  icon: busIcon
}).addTo(map);

busMarker.bindPopup("Autobús de demostración 001");


// ==========================================
// MODULO GPS DEL CONDUCTOR
// ==========================================

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


      // ==========================================
// ==========================================
// ENVIAR UBICACION A FIREBASE
// ==========================================

if (driverUID) {

    database.ref("buses/unidad001/location").set({

        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy,

        updatedAt: firebase.database.ServerValue.TIMESTAMP,

        diagnostic: {
            driverUID: driverUID,
            device: navigator.userAgent,
            receivedAccuracy: accuracy
        }

    })
    .then(() => {

        console.log("Ubicación enviada a Firebase");

        console.log("DIAGNÓSTICO GPS:", {
            accuracy: accuracy,
            driverUID: driverUID,
            device: navigator.userAgent
        });

    })
    .catch((error) => {

        console.error("Error enviando ubicación:", error);

    });

} else {

    console.log("Esperando autenticación del conductor");

}


      // ==========================================
      // ACTUALIZAR MARCADOR DEL AUTOBUS
      // ==========================================

      busMarker.setLatLng(currentPosition);

      busMarker.setPopupContent(
        "Unidad 001 - GPS activo"
      );

      map.panTo(currentPosition);


      // ==========================================
      // PRECISION GPS
      // ==========================================

      gpsAccuracy.textContent =
        "Precisión: " + Math.round(accuracy) + " metros";


      // ==========================================
      // CIRCULO DE PRECISION
      // ==========================================

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


      // ==========================================
      // ESTADO GPS
      // ==========================================

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


// ==========================================
// DETENER GPS
// ==========================================

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


// ==========================================
// BOTONES GPS
// ==========================================

startButton.addEventListener("click", startGPS);

stopButton.addEventListener("click", stopGPS);


// ==========================================
// INICIO DE BUS TRACK CR
// ==========================================

console.log("BusTrack CR GPS listo");
