import { buildings } from './buildings.js';
import { locations } from './locations.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjv5uUNOx86FvYsXdKSMkl8vui2Jynt7M",
  authDomain: "britmap-64cb3.firebaseapp.com",
  projectId: "britmap-64cb3",
  storageBucket: "britmap-64cb3.firebasestorage.app",
  messagingSenderId: "821384262397",
  appId: "1:821384262397:web:ca81d64ab6a8dea562c494",
  measurementId: "G-03E2BB7BQH"
};

const bottomBar = document.getElementById('bottom-bar');
if (bottomBar) { bottomBar.style.display = 'none'; }

const loadingScreenStart = Date.now();
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let firebaseUser = null;
let completedMarkers = {};
let activeModalVideos = new Set();

const progressBarWrapper = document.createElement('div');
progressBarWrapper.id = 'progress-bar-wrapper';
progressBarWrapper.style.position = 'fixed';
progressBarWrapper.style.top = '10px';
progressBarWrapper.style.left = '10px';
progressBarWrapper.style.zIndex = '10001';
progressBarWrapper.style.display = 'flex';
progressBarWrapper.style.flexDirection = 'row';
progressBarWrapper.style.alignItems = 'center';
progressBarWrapper.style.gap = '8px';

const progressBarContainer = document.createElement('div');
progressBarContainer.id = 'progress-bar-container';
progressBarContainer.style.height = '28px';
progressBarContainer.style.minHeight = '28px';
progressBarContainer.style.maxHeight = '28px';
progressBarContainer.style.boxSizing = 'border-box';
progressBarContainer.style.background = '#e0e0e0';
progressBarContainer.style.borderRadius = '14px';
progressBarContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
progressBarContainer.style.border = '2px solid #111';
progressBarContainer.style.display = 'flex';
progressBarContainer.style.alignItems = 'center';
progressBarContainer.style.justifyContent = 'flex-start';
progressBarContainer.style.overflow = 'hidden';
progressBarContainer.style.width = 'auto';
progressBarContainer.style.gap = '8px';

const progressBar = document.createElement('div');
progressBar.id = 'progress-bar';
progressBar.style.position = 'relative';
progressBar.style.height = '100%';
progressBar.style.width = '100px';
progressBar.style.borderRadius = '14px';
progressBar.style.overflow = 'hidden';

const progressFill = document.createElement('div');
progressFill.id = 'progress-fill';
progressFill.style.height = '100%';
progressFill.style.width = '0%';
progressFill.style.background = 'linear-gradient(90deg, #4caf50 60%, #398c32 100%)';
progressFill.style.transition = 'width 0.3s ease';
progressFill.style.borderRadius = '14px 0 0 14px';
progressFill.style.position = 'absolute';
progressFill.style.top = '0';
progressFill.style.left = '0';
progressFill.style.zIndex = '1';

const progressBarLabel = document.createElement('span');
progressBarLabel.id = 'progress-bar-label';
progressBarLabel.style.position = 'absolute';
progressBarLabel.style.top = '0';
progressBarLabel.style.left = '0';
progressBarLabel.style.width = '100%';
progressBarLabel.style.height = '100%';
progressBarLabel.style.textAlign = 'center';
progressBarLabel.style.display = 'flex';
progressBarLabel.style.alignItems = 'center';
progressBarLabel.style.justifyContent = 'center';
progressBarLabel.style.fontFamily = "'Poppins', sans-serif";
progressBarLabel.style.fontWeight = 'bold';
progressBarLabel.style.fontSize = '15px';
progressBarLabel.style.color = '#111';
progressBarLabel.style.userSelect = 'none';
progressBarLabel.style.zIndex = '2';

const exploreButton = document.createElement('button');
exploreButton.id = 'explore-locations-button';
exploreButton.textContent = 'Explore locations 🔍';
exploreButton.title = 'Explore all locations';
exploreButton.style.height = '28px';
exploreButton.style.minHeight = '28px';
exploreButton.style.maxHeight = '28px';
exploreButton.style.boxSizing = 'border-box';
exploreButton.style.lineHeight = '28px';
exploreButton.style.paddingTop = '0';
exploreButton.style.paddingBottom = '0';
exploreButton.style.marginTop = '0';
exploreButton.style.marginBottom = '0';
exploreButton.style.background = '#e0e0e0';
exploreButton.style.color = '#111';
exploreButton.style.border = '2px solid #111';
exploreButton.style.borderRadius = '14px';
exploreButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
exploreButton.style.fontSize = '15px';
exploreButton.style.fontFamily = "'Poppins', sans-serif";
exploreButton.style.fontWeight = 'bold';
exploreButton.style.cursor = 'pointer';
exploreButton.style.padding = '0 15px';
exploreButton.style.display = 'flex';
exploreButton.style.alignItems = 'center';
exploreButton.style.justifyContent = 'center';
exploreButton.style.marginLeft = '12px';
exploreButton.style.transition = 'box-shadow 0.2s';

progressBar.appendChild(progressFill);
progressBar.appendChild(progressBarLabel);
progressBarContainer.appendChild(progressBar);
progressBarWrapper.appendChild(progressBarContainer);
progressBarWrapper.appendChild(exploreButton);
document.body.appendChild(progressBarWrapper);

exploreButton.onclick = function() {
  if (document.getElementById('explore-popup-overlay')) {
    document.getElementById('explore-popup-overlay').remove();
  }
  const bottomBar = document.getElementById('bottom-bar');
  let bottomBarHeight = bottomBar && bottomBar.offsetHeight ? bottomBar.offsetHeight : 54;
  const overlay = document.createElement('div');
  overlay.id = 'explore-popup-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = `calc(100vh - ${bottomBarHeight}px)`;
  overlay.style.background = 'rgba(40,40,40,0.18)';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.style.webkitBackdropFilter = 'blur(10px)';
  overlay.style.zIndex = '20000';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'flex-end';
  overlay.style.justifyContent = 'center';

  const popup = document.createElement('div');
  popup.id = 'explore-popup';
  popup.style.position = 'fixed';
  popup.style.left = '50%';
  popup.style.transform = 'translateX(-50%)';
  popup.style.top = '24px';
  popup.style.bottom = `${bottomBarHeight + 16}px`;
  popup.style.width = '84vw';
  popup.style.maxWidth = '620px';
  popup.style.background = '#e0e0e0';
  popup.style.borderRadius = '14px';
  popup.style.border = '2px solid #111';
  popup.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
  popup.style.padding = '20px 12px 14px 12px';
  popup.style.zIndex = '20001';
  popup.style.overflow = 'visible';
  popup.style.display = 'flex';
  popup.style.flexDirection = 'column';
  popup.style.fontFamily = "'Poppins', sans-serif";

  const closeBtn = document.createElement('button');
  closeBtn.id = 'explore-popup-close-btn';
  closeBtn.innerHTML = '❌';
  closeBtn.title = 'Close';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '-14px';
  closeBtn.style.right = '-14px';
  closeBtn.style.width = '28px';
  closeBtn.style.height = '28px';
  closeBtn.style.background = '#111';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '50%';
  closeBtn.style.color = '#ff4444';
  closeBtn.style.fontSize = '13px';
  closeBtn.style.fontFamily = 'inherit';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
  closeBtn.style.zIndex = '20002';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.justifyContent = 'center';
  closeBtn.onclick = () => overlay.remove();
  popup.appendChild(closeBtn);

  const grid = document.createElement('div');
  grid.id = 'explore-popup-grid';
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
  grid.style.columnGap = '8px';
  grid.style.rowGap = '4px';
  grid.style.marginTop = '8px';
  grid.style.justifyItems = 'center';
  grid.style.alignItems = 'start';
  grid.style.overflowY = 'auto';

  if (!document.getElementById('posterimg-spinner-keyframes')) {
    const style = document.createElement('style');
    style.id = 'posterimg-spinner-keyframes';
    style.innerHTML = `@keyframes spin {0% {transform: rotate(0deg);} 100% {transform: rotate(360deg);}}`;
    document.head.appendChild(style);
  }

  buildings.forEach((building, idx) => {
    const cell = document.createElement('div');
    cell.style.display = 'flex';
    cell.style.flexDirection = 'column';
    cell.style.alignItems = 'center';
    cell.style.justifyContent = 'center';
    cell.style.position = 'relative';

    const spinner = document.createElement('div');
    spinner.style.width = '32px';
    spinner.style.height = '32px';
    spinner.style.border = '5px solid #eee';
    spinner.style.borderTop = '5px solid #9b4dca';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'spin 1s linear infinite';
    spinner.style.margin = '24px 0';

    cell.appendChild(spinner);

    const img = document.createElement('img');
    img.src = building.posterUrl || building.image;
    img.className = 'explore-popup-img';
    img.alt = building.name;
    img.title = building.name;
    img.style.width = '98px';
    img.style.height = 'auto';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '10px';
    img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    img.style.border = '2px solid #111';
    img.style.background = '#e0e0e0';
    img.style.cursor = 'pointer';
    img.style.transition = 'transform 0.12s';
    img.style.display = 'none';

    img.onload = () => {
      spinner.style.display = 'none';
      img.style.display = 'block';
    };

    img.onerror = () => {
      spinner.style.borderTop = '5px solid red';
      spinner.title = 'Image failed to load';
    };

    img.onmouseover = () => img.style.transform = 'scale(1.07)';
    img.onmouseout = () => img.style.transform = 'scale(1)';

    img.onclick = function() {
      overlay.remove();
      map.flyTo({
        center: building.coords,
        zoom: 17,
        pitch: 45,
        bearing: -17.6,
        speed: 1.2,
        curve: 1,
        essential: true
      });
    };

    cell.appendChild(img);
    grid.appendChild(cell);
  });

  popup.appendChild(grid);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  overlay.onclick = function(e) {
    if (e.target === overlay) {
      overlay.remove();
    }
  };
};

function updateProgressBar() {
  const totalMarkers = buildings.length;
  const visitedMarkers = buildings.filter(
    b => completedMarkers['completed-marker-' + b.name]
  ).length;

  progressBarLabel.textContent = `${visitedMarkers} / ${totalMarkers}`;
  const percent = totalMarkers > 0 ? Math.round((visitedMarkers / totalMarkers) * 100) : 0;
  progressFill.style.width = percent + '%';
}

progressBarContainer.addEventListener('click', function (e) {
  if (e.target === exploreButton) return;
  const totalMarkers = buildings.length;
  const visitedMarkers = buildings.filter(
    b => completedMarkers['completed-marker-' + b.name]
  ).length;

  if (visitedMarkers === 0) {
    showProgressBarHint();
  }
});

function showProgressBarHint() {
  const existingPopup = document.getElementById('progress-bar-popup');
  if (existingPopup) existingPopup.remove();
  const existingOverlay = document.getElementById('progress-bar-popup-overlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'progress-bar-popup-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.1)';
  overlay.style.zIndex = '10009';

  overlay.onclick = function (e) {
    if (e.target === overlay) {
      popup.remove();
      overlay.remove();
    }
  };

  const popup = document.createElement('div');
  popup.id = 'progress-bar-popup';
  popup.style.position = 'fixed';
  popup.style.top = '50%';
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.background = '#e0e0e0';
  popup.style.borderRadius = '14px';
  popup.style.border = '2px solid #111';
  popup.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
  popup.style.padding = '18px 32px 18px 32px';
  popup.style.zIndex = '10010';
  popup.style.display = 'flex';
  popup.style.alignItems = 'center';
  popup.style.justifyContent = 'center';
  popup.style.flexDirection = 'row';
  popup.style.minWidth = '260px';
  popup.style.fontFamily = "'Poppins', sans-serif";
  popup.style.fontWeight = 'bold';
  popup.style.fontSize = '16px';
  popup.style.color = '#111';
  popup.style.userSelect = 'none';
  popup.style.lineHeight = '1.1';

  const text = document.createElement('span');
  text.textContent = "This is the your Visited Progress Bar. Press the 'Unvisited' button on a marker to confirm your first visit!";
  text.style.flex = '1';
  text.style.textAlign = 'center';
  text.style.lineHeight = '1.1';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '❌';
  closeBtn.title = 'Close';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '-14px';
  closeBtn.style.right = '-14px';
  closeBtn.style.width = '28px';
  closeBtn.style.height = '28px';
  closeBtn.style.background = '#000';
  closeBtn.style.color = '#fff';
  closeBtn.style.border = '1.5px solid #E9E8E0';
  closeBtn.style.borderRadius = '50%';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '0.9rem';
  closeBtn.style.zIndex = '10011';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.justifyContent = 'center';

  closeBtn.onclick = () => {
    popup.remove();
    overlay.remove();
  };

  popup.appendChild(text);
  popup.appendChild(closeBtn);

  document.body.appendChild(overlay);
  document.body.appendChild(popup);
}

signInAnonymously(auth);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    firebaseUser = user;
    await loadCompletedMarkers();
    applyDimmedMarkers();
    updateProgressBar();
  }
});

async function loadCompletedMarkers() {
  if (!firebaseUser) return;
  try {
    const docRef = doc(db, "users", firebaseUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      completedMarkers = docSnap.data().completedMarkers || {};
    }
  } catch (err) {
    completedMarkers = {};
  }
}

async function saveCompletedMarker(markerKey) {
  if (!firebaseUser) return;
  completedMarkers[markerKey] = true;
  const docRef = doc(db, "users", firebaseUser.uid);
  await setDoc(docRef, { completedMarkers }, { merge: true });
  updateProgressBar();
}

function applyDimmedMarkers() {
  buildings.forEach((building) => {
    const markerKey = 'completed-marker-' + building.name;
    const markerEls = document.querySelectorAll(
      `.building-marker[data-marker-key="${markerKey}"]`
    );
    markerEls.forEach((el) => {
      if (completedMarkers[markerKey]) {
        el.style.filter = 'brightness(0.3) grayscale(0.3)';
      } else {
        el.style.filter = '';
      }
    });
  });
}

const yorkBounds = [
  [-1.170, 53.930],
  [-1.010, 54.010]
];

mapboxgl.accessToken =
  'pk.eyJ1IjoiZnJlZGRvbWF0ZSIsImEiOiJjbTc1bm5zYnQwaG1mMmtxeDdteXNmeXZ0In0.PuDNORq4qExIJ_fErdO_8g';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/freddomate/cm8q8wtwx00a801qzdayccnvz',
  center: [-1.0812025894431188, 53.958916884514004],
  zoom: 15,
  pitch: 45,
  bearing: -17.6,
  maxBounds: yorkBounds,
  minZoom: 11,
  maxZoom: 19,
});

const geolocate = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true,
  },
  trackUserLocation: true,
  showUserHeading: true,
  showAccuracyCircle: false,
  fitBoundsOptions: {
    maxZoom: 15,
  },
  showUserLocation: false,
});
map.addControl(geolocate, 'top-right');

const userLocationEl = document.createElement('div');
userLocationEl.className = 'user-location-marker';
const textEl = document.createElement('div');
textEl.style.position = 'absolute';
textEl.style.top = '50%';
textEl.style.left = '50%';
textEl.style.transform = 'translate(-50%, -50%)';
textEl.style.fontFamily = 'Poppins, sans-serif';
textEl.style.fontWeight = 'bold';
textEl.style.fontSize = '10px';
textEl.style.color = '#87CEFA';
textEl.textContent = 'me';
userLocationEl.appendChild(textEl);

const userLocationMarker = new mapboxgl.Marker({ element: userLocationEl })
  .setLngLat([0, 0])
  .addTo(map);

geolocate.on('error', (e) => {
  if (e.code === 1) console.log('Location access denied by user');
});

let currentUserLocation = null;
geolocate.on('geolocate', (e) => {
  currentUserLocation = { lat: e.coords.latitude, lng: e.coords.longitude };
  userLocationMarker.setLngLat([e.coords.longitude, e.coords.latitude]);
});

function getDistanceMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1) ) * Math.cos(toRad(lat2) ) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

locations.forEach((location) => {
  const { element: markerElement } = createCustomMarker(
    location.image,
    '#FFFFFF',
    true
  );
  markerElement.className += ' location-marker';
  const marker = new mapboxgl.Marker({
    element: markerElement,
  })
    .setLngLat(location.coords)
    .addTo(map);

  marker.getElement().addEventListener('click', () => {
    map.getCanvas().style.cursor = 'pointer';
    const contentHTML = createPopupContent(location);
    toggleBottomSheet(contentHTML);
  });
});

buildings.forEach((building) => {
  const outlineColor = building.colour === 'yes' ? '#FF69B4' : '#FFFFFF';
  const { element: markerElement } = createCustomMarker(
    building.image,
    outlineColor,
    false
  );
  markerElement.className += ' building-marker';
  markerElement.setAttribute('data-marker-key', 'completed-marker-' + building.name);

  if (building.colour === 'yes') markerElement.style.zIndex = '3';

  const marker = new mapboxgl.Marker({ element: markerElement })
    .setLngLat(building.coords)
    .addTo(map);

  marker.getElement().addEventListener('click', () => {
    map.getCanvas().style.cursor = 'pointer';
    const videoUrl = building.videoUrl;
    const posterUrl = building.posterUrl;
    const markerText = building.text || "";

    if (!videoUrl) {
      console.error('Video URL not available for this building.');
      return;
    }
    document.querySelectorAll('.video-modal-overlay').forEach((el) => el.remove());
    stopAllModalVideos();

    const overlay = document.createElement('div');
    overlay.className = 'video-modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.2)';
    overlay.style.backdropFilter = 'blur(10px)';
    overlay.style.webkitBackdropFilter = 'blur(10px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 100000;

    const posterContainer = document.createElement('div');
    posterContainer.style.position = 'relative';
    posterContainer.style.marginTop = '-60px';
    posterContainer.style.display = 'flex';
    posterContainer.style.flexDirection = 'column';
    posterContainer.style.alignItems = 'center';

    overlay.addEventListener('mousedown', function (e) {
      if (!posterContainer.contains(e.target)) { stopAllModalVideos(); overlay.remove(); }
    });

    const cameraIcon = document.createElement('button');
    cameraIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="7" width="18" height="14" rx="4" ry="4"></rect>
        <circle cx="12" cy="14" r="3.5"></circle>
        <circle cx="17.5" cy="10.5" r="1"></circle>
        <rect x="8" y="3" width="8" height="4" rx="2" ry="2"></rect>
      </svg>
    `;
    cameraIcon.title = 'Open Camera';
    cameraIcon.style.position = 'absolute';
    cameraIcon.style.left = '50%';
    cameraIcon.style.top = '0';
    cameraIcon.style.transform = 'translate(-50%, -50%)';
    cameraIcon.style.background = 'white';
    cameraIcon.style.border = 'none';
    cameraIcon.style.borderRadius = '50%';
    cameraIcon.style.width = '48px';
    cameraIcon.style.height = '48px';
    cameraIcon.style.display = 'flex';
    cameraIcon.style.alignItems = 'center';
    cameraIcon.style.justifyContent = 'center';
    cameraIcon.style.cursor = 'pointer';
    cameraIcon.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
    cameraIcon.style.zIndex = 10;

    const markerKey = 'completed-marker-' + building.name;
    let isVisited = completedMarkers[markerKey] ? true : false;

    const visitBtn = document.createElement('button');
    visitBtn.textContent = isVisited ? 'Visited' : 'Unvisited';
    visitBtn.style.position = 'absolute';
    visitBtn.style.left = '50%';
    visitBtn.style.bottom = '0';
    visitBtn.style.transform = 'translateX(-50%) translateY(25%)';
    visitBtn.style.background = isVisited ? '#4caf50' : '#ccc';
    visitBtn.style.color = isVisited ? '#fff' : '#333';
    visitBtn.style.border = '2px solid #fff';
    visitBtn.style.borderRadius = '20px';
    visitBtn.style.width = '95px';
    visitBtn.style.height = '36px';
    visitBtn.style.fontWeight = 'bold';
    visitBtn.style.fontSize = '14px';
    visitBtn.style.cursor = 'pointer';
    visitBtn.style.alignItems = 'center';
    visitBtn.style.justifyContent = 'center';
    visitBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    visitBtn.style.display = 'flex';
    visitBtn.style.zIndex = 11;

    visitBtn.onclick = async function () {
      isVisited = !isVisited;
      if (isVisited) {
        visitBtn.textContent = 'Visited';
        visitBtn.style.background = '#4caf50';
        visitBtn.style.color = '#fff';
        markerElement.style.filter = 'brightness(0.3) grayscale(0.3)';
        await saveCompletedMarker(markerKey);
      } else {
        visitBtn.textContent = 'Unvisited';
        visitBtn.style.background = '#ccc';
        visitBtn.style.color = '#333';
        markerElement.style.filter = '';
        completedMarkers[markerKey] = false;
        const docRef = doc(db, "users", firebaseUser.uid);
        await setDoc(docRef, { completedMarkers }, { merge: true });
        updateProgressBar();
      }
    };

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '❌';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '-8px';
    closeBtn.style.right = '-8px';
    closeBtn.style.width = '25px';
    closeBtn.style.height = '25px';
    closeBtn.style.background = '#000';
    closeBtn.style.color = '#fff';
    closeBtn.style.border = '1.5px solid #E9E8E0';
    closeBtn.style.borderRadius = '50%';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '0.7rem';
    closeBtn.style.zIndex = '100001';
    closeBtn.style.display = 'flex';
    closeBtn.style.alignItems = 'center';
    closeBtn.style.justifyContent = 'center';
    closeBtn.onclick = () => { closeBtn.parentElement.parentElement.remove(); };

    // CAMERA LOGIC WITH DOUBLE TAP SUPPORT + TEXT OVERLAY FEATURE
    let cameraFacingMode = 'environment'; // default rear
    let lastTapTime = 0;
    let cameraStream = null;
    let cameraVideo = null;

    cameraIcon.onclick = async function () {
      posterContainer.innerHTML = '';

      // --- TEXT OVERLAY ON CAMERA STREAM ---
      let textOverlay = null;
      if (markerText && markerText.trim().length > 0) {
        textOverlay = document.createElement('div');
        textOverlay.textContent = markerText;
        textOverlay.style.position = 'absolute';
        textOverlay.style.top = '50px';
        textOverlay.style.left = '50%';
        textOverlay.style.transform = 'translateX(-50%)';
        textOverlay.style.background = 'rgba(0,0,0,0.4)';
        textOverlay.style.color = '#fff';
        textOverlay.style.borderRadius = '8px';
        textOverlay.style.fontSize = '12px';
        textOverlay.style.fontWeight = 'bold';
        textOverlay.style.pointerEvents = 'none';
        textOverlay.style.zIndex = 20;
        textOverlay.style.fontFamily = "'Poppins', sans-serif";
        textOverlay.style.textAlign = "center";
        textOverlay.style.lineHeight = "1";
        textOverlay.style.padding = '6px 12px';

        // Compute width based on text content for better overlay fit
        const tempSpan = document.createElement('span');
        tempSpan.textContent = markerText;
        tempSpan.style.fontFamily = textOverlay.style.fontFamily;
        tempSpan.style.fontWeight = textOverlay.style.fontWeight;
        tempSpan.style.fontSize = textOverlay.style.fontSize;
        tempSpan.style.lineHeight = textOverlay.style.lineHeight;
        tempSpan.style.position = 'absolute';
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.whiteSpace = 'pre';
        document.body.appendChild(tempSpan);

        let textWidth = tempSpan.offsetWidth + 24; // 12px padding each side
        let maxWidth = window.innerWidth * 0.90 - 64;
        textOverlay.style.width = Math.min(textWidth, maxWidth) + "px";

        document.body.removeChild(tempSpan);

        posterContainer.appendChild(textOverlay);
      }

      cameraVideo = document.createElement('video');
      cameraVideo.autoplay = true;
      cameraVideo.playsInline = true;
      cameraVideo.style.width = '90vw';
      cameraVideo.style.height = '160vw';
      cameraVideo.style.objectFit = 'contain';
      cameraVideo.style.borderRadius = '14px';
      cameraVideo.style.display = 'block';
      cameraVideo.style.margin = '0 auto';
      cameraVideo.style.position = 'relative';
      posterContainer.appendChild(cameraVideo);

      const shutterBtn = document.createElement('button');
      shutterBtn.title = 'Take Photo';
      shutterBtn.className = 'custom-shutter-btn';
      shutterBtn.style.position = 'absolute';
      shutterBtn.style.left = '50%';
      shutterBtn.style.bottom = '20px';
      shutterBtn.style.transform = 'translateX(-50%)';
      shutterBtn.style.width = '64px';
      shutterBtn.style.height = '64px';
      shutterBtn.style.background = 'white';
      shutterBtn.style.border = '4px solid #ccc';
      shutterBtn.style.borderRadius = '50%';
      shutterBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      shutterBtn.style.display = 'flex';
      shutterBtn.style.alignItems = 'center';
      shutterBtn.style.justifyContent = 'center';
      shutterBtn.style.cursor = 'pointer';
      shutterBtn.style.zIndex = 12;
      shutterBtn.style.outline = 'none';
      shutterBtn.style.transition = 'box-shadow 0.1s';
      const innerCircle = document.createElement('div');
      innerCircle.style.width = '44px';
      innerCircle.style.height = '44px';
      innerCircle.style.background = '#fff';
      innerCircle.style.borderRadius = '50%';
      innerCircle.style.boxShadow = '0 0 0 2px #eee';
      shutterBtn.appendChild(innerCircle);
      posterContainer.appendChild(shutterBtn);

      const cameraCloseBtn = document.createElement('button');
      cameraCloseBtn.textContent = '❌';
      cameraCloseBtn.style.position = 'absolute';
      cameraCloseBtn.style.top = '-8px';
      cameraCloseBtn.style.right = '-8px';
      cameraCloseBtn.style.width = '25px';
      cameraCloseBtn.style.height = '25px';
      cameraCloseBtn.style.background = '#000';
      cameraCloseBtn.style.color = '#fff';
      cameraCloseBtn.style.border = '1.5px solid #E9E8E0';
      cameraCloseBtn.style.borderRadius = '50%';
      cameraCloseBtn.style.cursor = 'pointer';
      cameraCloseBtn.style.fontSize = '0.7rem';
      cameraCloseBtn.style.zIndex = '100001';
      cameraCloseBtn.style.display = 'flex';
      cameraCloseBtn.style.alignItems = 'center';
      cameraCloseBtn.style.justifyContent = 'center';
      cameraCloseBtn.onclick = () => {
        if (cameraVideo.srcObject) {
          cameraVideo.srcObject.getTracks().forEach((track) => track.stop());
        }
        overlay.remove();
      };
      posterContainer.appendChild(cameraCloseBtn);

      async function startCameraStream(facingMode = cameraFacingMode) {
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          });
          cameraVideo.srcObject = cameraStream;
        } catch (err) {
          try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraVideo.srcObject = cameraStream;
          } catch (err2) {
            alert('Could not access camera: ' + err2.message);
          }
        }
      }
      await startCameraStream();

      // DOUBLE TAP support for mobile (touch) and desktop (dblclick)
      cameraVideo.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTapTime < 300) { // 300ms double tap
          cameraFacingMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
          if (cameraVideo.srcObject) {
            cameraVideo.srcObject.getTracks().forEach(track => track.stop());
          }
          startCameraStream(cameraFacingMode);
        }
        lastTapTime = now;
      });
      cameraVideo.addEventListener('dblclick', function(e) {
        cameraFacingMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
        if (cameraVideo.srcObject) {
          cameraVideo.srcObject.getTracks().forEach(track => track.stop());
        }
        startCameraStream(cameraFacingMode);
      });

      function wrapCanvasText(ctx, text, maxWidth) {
        const words = text.split(' ');
        let lines = [];
        let line = '';
        for (let n = 0; n < words.length; n++) {
          const testLine = line + (line ? ' ' : '') + words[n];
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line) {
            lines.push(line);
            line = words[n];
          } else {
            line = testLine;
          }
        }
        lines.push(line);
        return lines;
      }

      shutterBtn.onclick = function () {
        cameraVideo.pause();
        posterContainer.querySelectorAll('.img-preview, .add-to-archive-btn, .cancel-btn, .tip-text').forEach(el => el.remove());

        const canvas = document.createElement('canvas');
        canvas.width = cameraVideo.videoWidth;
        canvas.height = cameraVideo.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);

        // --- DRAW TEXT OVERLAY ON PHOTO ---
        if (textOverlay && markerText && markerText.trim().length > 0) {
          const overlayRect = textOverlay.getBoundingClientRect();
          const videoRect = cameraVideo.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(textOverlay);

          let topPx = overlayRect.top - videoRect.top;
          let leftPx = overlayRect.left - videoRect.left;
          let overlayWidthPx = overlayRect.width;
          let overlayHeightPx = overlayRect.height;

          let fontSizePx = parseFloat(computedStyle.fontSize);
          let fontFamily = computedStyle.fontFamily;
          let fontWeight = computedStyle.fontWeight;
          let lineHeightPx = parseFloat(computedStyle.lineHeight || fontSizePx);

          let scaleX = canvas.width / videoRect.width;
          let scaleY = canvas.height / videoRect.height;

          let textBoxX = leftPx * scaleX;
          let textBoxY = topPx * scaleY;
          let textBoxWidth = overlayWidthPx * scaleX;
          let textBoxHeight = overlayHeightPx * scaleY;

          ctx.save();
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = "#000";
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(textBoxX, textBoxY, textBoxWidth, textBoxHeight, 8 * scaleY);
          } else {
            ctx.rect(textBoxX, textBoxY, textBoxWidth, textBoxHeight);
          }
          ctx.fill();
          ctx.restore();

          const canvasFontSize = fontSizePx * scaleY;
          const canvasLineHeight = canvasFontSize * 1.1;
          ctx.font = `${fontWeight} ${canvasFontSize}px ${fontFamily}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#fff";

          const wrappedLines = wrapCanvasText(
            ctx,
            markerText,
            textBoxWidth - 24 * scaleX
          );
          const totalLines = wrappedLines.length;
          const totalTextHeight = totalLines * canvasLineHeight;
          let y = textBoxY + 12 * scaleY + (textBoxHeight - 24 * scaleY - totalTextHeight) / 2 + canvasLineHeight / 2;

          for (let i = 0; i < wrappedLines.length; i++) {
            ctx.fillText(
              wrappedLines[i],
              textBoxX + textBoxWidth / 2,
              y + i * canvasLineHeight
            );
          }
          ctx.restore();
        }

        const tipText = document.createElement('div');
        tipText.className = 'tip-text';
        tipText.textContent = 'Tap and hold image to save';
        tipText.style.display = 'block';
        tipText.style.margin = '16px auto 0 auto';
        tipText.style.fontSize = '13px';
        tipText.style.fontFamily = "'Poppins', sans-serif";
        tipText.style.textAlign = 'center';
        tipText.style.color = '#7C6E4D';
        tipText.style.fontWeight = 'bold';
        tipText.style.background = '#eae7de';
        tipText.style.borderRadius = '8px';
        tipText.style.padding = '6px 7px';
        tipText.style.lineHeight = '1.02';
        tipText.style.maxWidth = '90vw';
        posterContainer.appendChild(tipText);

        const imgPreview = document.createElement('img');
        imgPreview.className = 'img-preview';
        imgPreview.src = canvas.toDataURL('image/png');
        imgPreview.style.display = 'block';
        imgPreview.style.margin = '8px auto 8px auto';
        imgPreview.style.maxWidth = '90vw';
        imgPreview.style.maxHeight = '60vh';
        imgPreview.style.borderRadius = '12px';
        imgPreview.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
        posterContainer.appendChild(imgPreview);

        const addToArchiveBtn = document.createElement('button');
        addToArchiveBtn.className = 'add-to-archive-btn custom-button';
        addToArchiveBtn.textContent = 'Add to Archive';
        addToArchiveBtn.style.fontSize = '13px';
        addToArchiveBtn.style.fontFamily = "'Poppins', sans-serif";
        addToArchiveBtn.style.textAlign = 'center';
        addToArchiveBtn.style.background = '#e0e0e0';
        addToArchiveBtn.style.color = '#333';
        addToArchiveBtn.style.borderRadius = '8px';
        addToArchiveBtn.style.padding = '6px 7px';
        addToArchiveBtn.style.lineHeight = '1.02';
        addToArchiveBtn.style.display = 'block';
        addToArchiveBtn.style.margin = '10px auto 0 auto';
        addToArchiveBtn.style.fontWeight = 'bold';
        addToArchiveBtn.onclick = function (e) {
          e.preventDefault();
          addPhotoToArchive(imgPreview.src, building.name, addToArchiveBtn);
        };
        posterContainer.appendChild(addToArchiveBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn custom-button';
        cancelBtn.textContent = 'Take again';
        cancelBtn.style.fontSize = '13px';
        cancelBtn.style.fontFamily = "'Poppins', sans-serif";
        cancelBtn.style.textAlign = 'center';
        cancelBtn.style.background = '#9b4dca';
        cancelBtn.style.color = '#fff';
        cancelBtn.style.borderRadius = '8px';
        cancelBtn.style.padding = '6px 7px';
        cancelBtn.style.lineHeight = '1.02';
        cancelBtn.style.display = 'block';
        cancelBtn.style.margin = '10px auto 0 auto';
        cancelBtn.style.fontWeight = 'bold';
        cancelBtn.onclick = function () {
          imgPreview.remove();
          addToArchiveBtn.remove();
          cancelBtn.remove();
          tipText.remove();
          cameraVideo.style.display = 'block';
          shutterBtn.style.display = 'block';
          if (textOverlay) textOverlay.style.display = 'block';
          cameraCloseBtn.style.display = 'flex';
          cameraVideo.play();
        };
        posterContainer.appendChild(cancelBtn);

        cameraVideo.style.display = 'none';
        shutterBtn.style.display = 'none';
        if (textOverlay) textOverlay.style.display = 'none';
        cameraCloseBtn.style.display = 'none';
      };
    };

    const playBtn = document.createElement('button');
    playBtn.innerHTML = '▶';
    playBtn.style.position = 'absolute';
    playBtn.style.top = '50%';
    playBtn.style.left = '50%';
    playBtn.style.transform = 'translate(-50%, -50%)';
    playBtn.style.background = 'rgba(0,0,0,0.6)';
    playBtn.style.border = 'none';
    playBtn.style.borderRadius = '50%';
    playBtn.style.width = '64px';
    playBtn.style.height = '64px';
    playBtn.style.color = '#fff';
    playBtn.style.fontSize = '2.5rem';
    playBtn.style.cursor = 'pointer';
    playBtn.style.display = 'flex';
    playBtn.style.alignItems = 'center';
    playBtn.style.justifyContent = 'center';
    playBtn.style.zIndex = 2;

    const spinner = document.createElement('div');
    spinner.style.position = 'absolute';
    spinner.style.top = '50%';
    spinner.style.left = '50%';
    spinner.style.transform = 'translate(-50%, -50%)';
    spinner.style.width = '48px';
    spinner.style.height = '48px';
    spinner.style.border = '6px solid #eee';
    spinner.style.borderTop = '6px solid #9b4dca';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'spin 1s linear infinite';
    spinner.style.display = 'none';
    spinner.style.zIndex = 3;

    const spinnerStyle = document.createElement('style');
    spinnerStyle.innerHTML = `@keyframes spin {0% { transform: translate(-50%, -50%) rotate(0deg);}100% { transform: translate(-50%, -50%) rotate(360deg);}}`;
    document.head.appendChild(spinnerStyle);

    const posterImg = document.createElement('img');
    posterImg.src = posterUrl || '';
    posterImg.alt = 'Video cover';
    posterImg.style.maxWidth = '88vw';
    posterImg.style.maxHeight = '80vh';
    posterImg.style.borderRadius = '14px';
    posterImg.style.display = 'block';

    posterImg.addEventListener('load', () => {
      posterImg.style.border = '1.5px solid #E9E8E0';
      posterContainer.appendChild(cameraIcon);
      posterContainer.appendChild(visitBtn);
      posterContainer.appendChild(closeBtn);
      posterContainer.appendChild(playBtn);
      posterContainer.appendChild(spinner);
      playBtn.style.display = 'flex';
      closeBtn.style.display = 'flex';
    });

    posterContainer.appendChild(posterImg);
    overlay.appendChild(posterContainer);
    document.body.appendChild(overlay);

    playBtn.onclick = () => {
      playBtn.style.display = 'none';
      spinner.style.display = 'block';
      const videoElement = document.createElement('video');
      videoElement.src = videoUrl;
      if (posterUrl) videoElement.poster = posterUrl;
      videoElement.style.border = '1.5px solid #E9E8E0';
      videoElement.style.maxWidth = '88vw';
      videoElement.style.maxHeight = '80vh';
      videoElement.style.borderRadius = '14px';
      videoElement.preload = 'auto';
      videoElement.autoplay = true;
      videoElement.setAttribute('playsinline', '');
      videoElement.setAttribute('webkit-playsinline', '');
      videoElement.playsInline = true;

      posterContainer.replaceChild(videoElement, posterImg);

      activeModalVideos.add(videoElement);

      videoElement.addEventListener('playing', () => { spinner.style.display = 'none'; });
      videoElement.addEventListener('waiting', () => { spinner.style.display = 'block'; });
      videoElement.addEventListener('error', () => {
        spinner.style.display = 'none';
        playBtn.style.display = 'block';
        alert('Video failed to load.');
      });
      videoElement.addEventListener('ended', () => {
        videoElement.parentElement.parentElement.remove();
      });
      videoElement.addEventListener('click', () => {
        videoElement.controls = true;
      });

      overlay.addEventListener('remove', () => {
        videoElement.pause();
        videoElement.currentTime = 0;
        activeModalVideos.delete(videoElement);
      });

      videoElement.load();
    };
  });
});

/* -------- IndexedDB Archive Logic -------- */
const DB_NAME = 'archiveDB';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function(e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addPhotoToArchive(imgSrc, markerName, buttonRef) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.add({ src: imgSrc, name: markerName, ts: Date.now() });
  await tx.complete;
  await loadArchivePhotos();
  if (buttonRef) {
    buttonRef.textContent = 'Archived';
    buttonRef.style.background = '#4caf50';
    buttonRef.style.color = '#fff';
  }
}

async function getArchivePhotos() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.ts - a.ts));
    request.onerror = () => reject(request.error);
  });
}

async function removePhoto(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.delete(id);
  await tx.complete;
  await loadArchivePhotos();
}

let archivePhotos = [];
async function loadArchivePhotos() {
  archivePhotos = await getArchivePhotos();
  renderArchivePhotos();
}

function ensureArchiveSection() {
  let archiveSection = document.getElementById('archive-section');
  if (!archiveSection) {
    archiveSection = document.createElement('div');
    archiveSection.id = 'archive-section';
    archiveSection.style.display = 'none';
    archiveSection.style.padding = '18px 0 0 0';
    document.body.appendChild(archiveSection);
  }
  return archiveSection;
}

function renderArchivePhotos() {
  const archiveSection = ensureArchiveSection();
  archiveSection.innerHTML = '<h2 style="text-align:center;font-family:\'Poppins\',sans-serif;">Your archive 🇬🇧</h2>';

  const divider = document.createElement('div');
  divider.style.width = '25vw';
  divider.style.height = '1px';
  divider.style.background = '#b7ab8b';
  divider.style.margin = '8px auto 12px auto';
  archiveSection.appendChild(divider);

  if (!archivePhotos || archivePhotos.length === 0) {
    archiveSection.innerHTML += `<p style="text-align:center;">No photos archived yet. Take some pictures!</p>`;
    return;
  }

  const tipText = document.createElement('div');
  tipText.textContent = 'Tap and hold the image to download or share it - it would look really cool on your Instagram story :)';
  tipText.style.fontSize = '14px';
  tipText.style.fontFamily = "'Poppins', sans-serif";
  tipText.style.color = '#000';
  tipText.style.fontWeight = 'bold';
  tipText.style.marginBottom = '12px';
  tipText.style.textAlign = 'center';
  tipText.style.maxWidth = '100%';
  tipText.style.margin = '0 auto 12px auto';
  tipText.style.lineHeight = '1.2';
  archiveSection.appendChild(tipText);

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
  grid.style.gap = '2px';
  grid.style.padding = '8px';
  grid.style.width = '100%';
  grid.style.boxSizing = 'border-box';

  archivePhotos.forEach(({ src, name, id }, idx) => {
    const cell = document.createElement('div');
    cell.style.display = 'flex';
    cell.style.flexDirection = 'column';
    cell.style.alignItems = 'center';
    cell.style.position = 'relative';
    cell.style.width = '100%';

    const imgContainer = document.createElement('div');
    imgContainer.style.position = 'relative';
    imgContainer.style.display = 'block';
    imgContainer.style.width = '100%';
    imgContainer.style.boxSizing = 'border-box';

    const img = document.createElement('img');
    img.src = src;
    img.style.width = '100%';   // fills container width
    img.style.height = 'auto';  // keeps natural aspect ratio
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
    img.style.display = 'block';

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '❌';
    removeBtn.title = 'Remove from archive';
    removeBtn.style.position = 'absolute';
    removeBtn.style.left = '100%';
    removeBtn.style.top = '100%';
    removeBtn.style.transform = 'translate(-50%, -50%)';
    removeBtn.style.width = '22px';
    removeBtn.style.height = '22px';
    removeBtn.style.background = '#000';
    removeBtn.style.color = '#fff';
    removeBtn.style.border = '1.5px solid #E9E8E0';
    removeBtn.style.borderRadius = '50%';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.fontSize = '0.85rem';
    removeBtn.style.zIndex = '10';
    removeBtn.style.display = 'flex';
    removeBtn.style.alignItems = 'center';
    removeBtn.style.justifyContent = 'center';

    removeBtn.onclick = function () {
      const confirmRemove = window.confirm(`Do you want to remove the photo for "${name}" from your archive?`);
      if (confirmRemove) {
        removePhoto(id);
      }
    };

    imgContainer.appendChild(img);
    imgContainer.appendChild(removeBtn);

    cell.appendChild(imgContainer);
    grid.appendChild(cell);
  });

  archiveSection.appendChild(grid);
}

document.addEventListener('DOMContentLoaded', loadArchivePhotos);

function stopAllModalVideos(except = null) {
  activeModalVideos.forEach((video) => {
    if (!except || video !== except) {
      video.pause();
      video.currentTime = 0;
      if (video.parentNode) {
        video.controls = false;
      }
    }
  });
}

function scaleMarkersBasedOnZoom() {
  const zoomLevel = map.getZoom();
  const markerSize = zoomLevel - 13;
  const markerWidth = markerSize + 'em';
  const markerHeight = markerSize + 'em';
  const borderWidth = markerSize * 0.075 + 'em';

  document.querySelectorAll('.location-marker, .building-marker').forEach((marker) => {
    marker.style.width = markerWidth;
    marker.style.height = markerHeight;
    marker.style.borderWidth = borderWidth;

    const bump = marker.querySelector('.marker-bump');
    if (bump) {
      const bumpWidth = markerSize * 0.4 + 'em';
      const bumpHeight = markerSize * 0.25 + 'em';
      bump.style.width = bumpWidth;
      bump.style.height = bumpHeight;
    }
  });
}
scaleMarkersBasedOnZoom();

map.on('click', (e) => {
  const currentLat = e.lngLat.lat;
  const currentLng = e.lngLat.lng;
  const currentZoom = map.getZoom();
  const mapLink = generateMapLink(currentLat, currentLng, currentZoom);
  console.log('Map Link:', mapLink);
});
map.on('zoom', () => scaleMarkersBasedOnZoom());

map.on('load', () => {
  geolocate.trigger();

  const loadingScreen = document.getElementById('loading-screen');
  const elapsed = Date.now() - loadingScreenStart;
  const minDuration = 5000;

  function showBottomBar() {
    loadingScreen.style.display = 'none';
    if (bottomBar) bottomBar.style.display = 'flex';
    if (document.getElementById('map-section')?.style.display !== 'none') {
      progressBarWrapper.style.display = 'flex';
    }
  }

  if (loadingScreen) {
    if (elapsed >= minDuration) {
      showBottomBar();
    } else {
      setTimeout(showBottomBar, minDuration - elapsed);
    }
  }
});

function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

const lat = getUrlParameter('lat');
const lng = getUrlParameter('lng');
const zoom = getUrlParameter('zoom');

const defaultCenter = [-1.0835104081554843, 53.95838745239521];
const defaultZoom = 15;

const initialCenter = lat && lng ? [parseFloat(lng), parseFloat(lat)] : defaultCenter;
const initialZoom = zoom ? parseFloat(zoom) : defaultZoom;

const bottomSheet = document.createElement('div');
bottomSheet.id = 'bottom-sheet';
bottomSheet.style.position = 'fixed';
bottomSheet.style.bottom = '-100%';
bottomSheet.style.left = '50%';
bottomSheet.style.transform = 'translate(-50%)';
bottomSheet.style.right = '50%';
bottomSheet.style.width = '96%';
bottomSheet.style.height = '40%';
bottomSheet.style.backgroundColor = '#fff';
bottomSheet.style.borderTop = '2px solid #ccc';
bottomSheet.style.boxShadow = '0 -6px 15px rgba(0, 0, 0, 0.3)';
bottomSheet.style.zIndex = '10000';
bottomSheet.style.transition = 'bottom 0.3s ease';
bottomSheet.style.borderRadius = '12px 12px 0 0';
bottomSheet.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.3)';
bottomSheet.style.backgroundColor = '#E9E8E0';
bottomSheet.style.border = '2px solid #f0f0f0';
bottomSheet.style.fontFamily = "'Poppins', sans-serif";
bottomSheet.style.fontSize = '14px';
bottomSheet.style.lineHeight = '1.05';
bottomSheet.style.padding = '5px';
bottomSheet.style.overflowY = 'auto';
document.body.appendChild(bottomSheet);

function generateMapLink(latitude, longitude, zoomLevel) {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = `?lat=${latitude}&lng=${longitude}&zoom=${zoomLevel}`;
  return baseUrl + params;
}

function showSection(section) {
  const sections = ['map-section', 'archive-section', 'about-section'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = (id === section) ? 'block' : 'none';
    }
  });

  document.getElementById('bar-map').classList.toggle('active', section === 'map-section');
  document.getElementById('bar-archive').classList.toggle('active', section === 'archive-section');
  document.getElementById('bar-about').classList.toggle('active', section === 'about-section');

  const loadingScreen = document.getElementById('loading-screen');
  if (section === 'map-section' && (!loadingScreen || loadingScreen.style.display === 'none')) {
    progressBarWrapper.style.display = 'flex';
    map.resize();
  } else {
    progressBarWrapper.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  progressBarWrapper.style.display = 'none';
  showSection('map-section');
  document.getElementById('bar-map').addEventListener('click', () => showSection('map-section'));
  document.getElementById('bar-archive').addEventListener('click', () => showSection('archive-section'));
  document.getElementById('bar-about').addEventListener('click', () => showSection('about-section'));
});

const stylePopup = document.createElement('style');
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

stylePopup.innerHTML = `
  /* ... (the CSS from your original file, omitted for brevity, but should be present!) ... */
`;
document.head.appendChild(stylePopup);

function createCustomMarker(imageUrl, color = '#9b4dca', isLocation = false) {
  const markerDiv = document.createElement('div');
  markerDiv.className = 'custom-marker';
  markerDiv.style.width = '2em';
  markerDiv.style.height = '2em';
  markerDiv.style.position = 'absolute';
  markerDiv.style.borderRadius = '50%';
  markerDiv.style.border = `0.05em solid ${color}`;
  markerDiv.style.boxSizing = 'border-box';
  markerDiv.style.overflow = 'visible';
  markerDiv.style.background = 'white';
  markerDiv.style.display = 'flex';
  markerDiv.style.alignItems = 'center';
  markerDiv.style.justifyContent = 'center';

  const imageElement = document.createElement('img');
  imageElement.src = imageUrl;
  imageElement.style.width = '100%';
  imageElement.style.height = '100%';
  imageElement.style.objectFit = 'cover';
  imageElement.style.borderRadius = '50%';

  const bump = document.createElement('div');
  bump.className = 'marker-bump';
  bump.style.position = 'absolute';
  bump.style.left = '50%';
  bump.style.top = '98%';
  bump.style.transform = 'translateX(-50%)';
  bump.style.width = '5em';
  bump.style.height = '0.5em';
  bump.style.background = color;
  bump.style.clipPath =
    'polygon(0% 0%, 100% 0%, 55% 96%, 56% 100%, 44% 100%, 45% 96%)';
  bump.style.zIndex = '1';

  markerDiv.appendChild(imageElement);
  markerDiv.appendChild(bump);

  return {
    element: markerDiv,
    id: `marker-${Date.now()}-${Math.random()}`,
  };
}

let isBottomSheetOpen = false;

function toggleBottomSheet(contentHTML) {
  if (isBottomSheetOpen) {
    bottomSheet.style.bottom = '-100%';
    bottomSheet.querySelectorAll('video').forEach((video) => {
      video.pause();
      video.currentTime = 0;
      video.controls = false;
    });
  } else {
    const closeButtonHTML = `
            <button id="close-bottom-sheet" style="
                position: absolute;
                top: 5px;
                right: 5px;
                padding: 3px 3px;
                background: none;
                color: #fff;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 10px;
            ">❌</button>
        `;

    bottomSheet.innerHTML = closeButtonHTML + contentHTML;
    bottomSheet.style.bottom = '0';

    document.getElementById('close-bottom-sheet').addEventListener('click', () => {
      bottomSheet.querySelectorAll('video').forEach((video) => {
        video.pause();
        video.currentTime = 0;
        video.controls = false;
      });
      toggleBottomSheet();
    });
  }
  isBottomSheetOpen = !isBottomSheetOpen;
}

function createPopupContent(location, isFirebase = false) {
  const data = isFirebase ? location : location;
  const eventsData = isFirebase ? data.events : data.events;
  const videoUrl = data.videoUrl ? data.videoUrl : null;
  const tldrContent = !videoUrl
    ? `<p style="background: #f9f9f9; padding: 10px; margin-top: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); font-size: 15px; color: #000000;">${data.tldr}</p>`
    : '';
  const imageContent = !videoUrl
    ? `<img src="${data.image || data.imageUrl}" alt="${data.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;" />`
    : '';

  return `
        <div style="text-align: center; padding: 0; margin: 0;">
            <p style="font-size: 15px; font-weight: bold; margin-bottom: 10px;">${data.description}</p>
            ${imageContent}
            <div style="font-size: 20px; font-weight: bold; margin-top: 0;">${data.name}</div>
            <div style="font-size: 15px; color: #666;">${data.occupation || data.dates}</div>
            ${tldrContent}
            ${eventsData && eventsData.length ? `
                <div style="margin-top: 10px;">
                    ${eventsData
                      .map(
                        (event) => `
                        <div style="background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 10px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                            <strong style="color: #7C6E4D; font-size: 15px;">${event.date || event.label}</strong>: <span style="font-size: 15px;">${event.description}</span>
                        </div>
                    `
                      )
                      .join('')}
                </div>
            ` : ''}
            ${videoUrl ? `
                <div style="margin-top: 10px; margin-bottom: 10px; text-align: center;">
                    <video 
                        width="300" 
                        height="464" 
                        autoplay 
                        controlsList="nodownload nofullscreen noremoteplayback" 
                        controls 
                        style="display: block; margin: 0 auto;">
                        <source src="${videoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            ` : ''}
        </div>
    `;
}

updateProgressBar();
