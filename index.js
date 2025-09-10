import { buildings } from './buildings.js';
import { locations } from './locations.js';

// --- Firebase imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// --- Firebase config ---
const firebaseConfig = {
  apiKey: "AIzaSyDjv5uUNOx86FvYsXdKSMkl8vui2Jynt7M",
  authDomain: "britmap-64cb3.firebaseapp.com",
  projectId: "britmap-64cb3",
  storageBucket: "britmap-64cb3.firebasestorage.app",
  messagingSenderId: "821384262397",
  appId: "1:821384262397:web:ca81d64ab6a8dea562c494",
  measurementId: "G-03E2BB7BQH"
};

const loadingScreenStart = Date.now();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let firebaseUser = null;
let completedMarkers = {};

signInAnonymously(auth);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    firebaseUser = user;
    await loadCompletedMarkers();
    applyDimmedMarkers();
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
}

function applyDimmedMarkers() {
  buildings.forEach((building) => {
    const markerKey = 'completed-marker-' + building.name;
    const markerEls = document.querySelectorAll(
      `.building-marker[data-marker-key="${markerKey}"]`
    );
    markerEls.forEach((el) => {
      if (completedMarkers[markerKey]) {
        el.style.filter = 'brightness(0.6) grayscale(0.3)';
      } else {
        el.style.filter = '';
      }
    });
  });
}

let firstVideoLoadedThisSession = false;
function showFirstVideoWaitMessage(videoElement) {}

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
map.addControl(geolocate, 'top-right'); // moved to top-right

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
geolocate.on('geolocate', (e) => {
  userLocationMarker.setLngLat([e.coords.longitude, e.coords.latitude]);
});

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

    // Create camera, visit, close buttons but DO NOT append yet!
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

    // --- NEW BUTTON (visitBtn) ---
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
        markerElement.style.filter = 'brightness(0.6) grayscale(0.3)';
        await saveCompletedMarker(markerKey);
      } else {
        visitBtn.textContent = 'Unvisited';
        visitBtn.style.background = '#ccc';
        visitBtn.style.color = '#333';
        markerElement.style.filter = '';
        completedMarkers[markerKey] = false;
        const docRef = doc(db, "users", firebaseUser.uid);
        await setDoc(docRef, { completedMarkers }, { merge: true });
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

    let videoElement = null;
    let cameraStream = null;

    function removeOverlayAndPauseVideo() {
      if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0;
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      overlay.remove();
    }

    closeBtn.onclick = () => removeOverlayAndPauseVideo();
    let startY;
    overlay.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) startY = e.touches[0].clientY;
    });
    overlay.addEventListener('touchmove', (e) => {
      if (startY !== undefined && e.touches.length === 1) {
        const dy = e.touches[0].clientY - startY;
        if (dy > 70) {
          removeOverlayAndPauseVideo();
          startY = undefined;
        }
      }
    });
    overlay.addEventListener('touchend', () => {
      startY = undefined;
    });

    // spinner, playBtn, etc.
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

    // Only the poster image is appended initially!
    const posterImg = document.createElement('img');
    posterImg.src = posterUrl || '';
    posterImg.alt = 'Video cover';
    posterImg.style.maxWidth = '88vw';
    posterImg.style.maxHeight = '80vh';
    posterImg.style.borderRadius = '14px';
    posterImg.style.display = 'block';

    // Only after the poster loads, append the controls/buttons
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

    overlay.addEventListener('mousedown', function (e) {
      if (e.target === overlay) removeOverlayAndPauseVideo();
    });

    // ------ CAMERA LOGIC --------
    cameraIcon.onclick = async function () {
      if (
        !(
          navigator.mediaDevices &&
          typeof navigator.mediaDevices.getUserMedia === 'function'
        )
      ) {
        alert(
          "Camera access is not supported on this browser/device. If you're on iPhone, please use Safari (not Chrome or an in-app browser), and make sure your iOS version is up to date."
        );
        return;
      }

      cameraIcon.remove();
      posterContainer.innerHTML = '';

      const overlayPaddingY = 6;
      const overlayPaddingX = 12;
      const overlayInset = 32;
      const overlayInnerPadding = `${overlayPaddingY}px ${overlayPaddingX}px`;

      const textOverlay = document.createElement('div');
      textOverlay.textContent = markerText;
      textOverlay.style.position = 'absolute';
      textOverlay.style.top = '50px';
      textOverlay.style.left = '50%';
      textOverlay.style.transform = 'translateX(-50%)';
      textOverlay.style.background = 'rgba(0,0,0,0.4)';
      textOverlay.style.color = '#fff';
      textOverlay.style.padding = overlayInnerPadding;
      textOverlay.style.borderRadius = '8px';
      textOverlay.style.fontSize = '12px';
      textOverlay.style.fontWeight = 'bold';
      textOverlay.style.pointerEvents = 'none';
      textOverlay.style.zIndex = 20;
      textOverlay.style.fontFamily = "'Poppins', sans-serif";
      textOverlay.style.textAlign = "center";
      textOverlay.style.lineHeight = "1";
      textOverlay.style.width = `calc(90vw - ${2 * overlayInset}px)`;
      posterContainer.appendChild(textOverlay);

      const cameraVideo = document.createElement('video');
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
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
        }
        overlay.remove();
      };
      posterContainer.appendChild(cameraCloseBtn);

      let imgPreview = null, addToArchiveBtn = null, cancelBtn = null;
      let cameraStream = null;

      async function startCameraStream() {
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }
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

        if (imgPreview) imgPreview.remove();
        if (addToArchiveBtn) addToArchiveBtn.remove();
        if (cancelBtn) cancelBtn.remove();

        shutterBtn.style.display = 'none';
        cameraCloseBtn.style.display = 'none';

        const canvas = document.createElement('canvas');
        canvas.width = cameraVideo.videoWidth;
        canvas.height = cameraVideo.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);

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

        const canvasPaddingY = overlayPaddingY * scaleY;
        const canvasPaddingX = overlayPaddingX * scaleX;

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
          textBoxWidth - 2 * canvasPaddingX
        );

        const totalLines = wrappedLines.length;
        const totalTextHeight = totalLines * canvasLineHeight;
        let y = textBoxY + canvasPaddingY + (textBoxHeight - 2 * canvasPaddingY - totalTextHeight) / 2 + canvasLineHeight / 2;

        for (let i = 0; i < wrappedLines.length; i++) {
          ctx.fillText(
            wrappedLines[i],
            textBoxX + textBoxWidth / 2,
            y + i * canvasLineHeight
          );
        }
        ctx.restore();

        // --- TIP TEXT ABOVE PHOTO ---
        const tipText = document.createElement('div');
        tipText.textContent = 'tip; hold the image to share or save to photos';
        tipText.style.display = 'block';
        tipText.style.margin = '16px auto 0 auto';
        tipText.style.fontSize = '13px';
        tipText.style.fontFamily = "'Poppins', sans-serif";
        tipText.style.textAlign = 'center';
        tipText.style.color = '#7C6E4D';
        tipText.style.fontWeight = 'bold';
        tipText.style.background = '#F9F7F3';
        tipText.style.borderRadius = '8px';
        tipText.style.padding = '6px 12px';
        tipText.style.maxWidth = '90vw';
        posterContainer.appendChild(tipText);

        imgPreview = document.createElement('img');
        imgPreview.src = canvas.toDataURL('image/png');
        imgPreview.style.display = 'block';
        imgPreview.style.margin = '8px auto 8px auto';
        imgPreview.style.maxWidth = '90vw';
        imgPreview.style.maxHeight = '60vh';
        imgPreview.style.borderRadius = '12px';
        imgPreview.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
        posterContainer.appendChild(imgPreview);

        // --- "Add to Archive" BUTTON ---
        addToArchiveBtn = document.createElement('button');
        addToArchiveBtn.textContent = 'Add to Archive';
        addToArchiveBtn.className = 'custom-button';
        addToArchiveBtn.style.display = 'block';
        addToArchiveBtn.style.margin = '10px auto 0 auto';
        addToArchiveBtn.style.background = '#e0e0e0';
        addToArchiveBtn.style.color = '#333';
        addToArchiveBtn.onclick = function (e) {
          e.preventDefault();
          // Add photo to archive
          addPhotoToArchive(imgPreview.src);
        };
        posterContainer.appendChild(addToArchiveBtn);

        cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Take again';
        cancelBtn.className = 'custom-button';
        cancelBtn.style.display = 'block';
        cancelBtn.style.margin = '10px auto 0 auto';
        cancelBtn.style.background = '#9b4dca';
        cancelBtn.style.color = '#fff';
        posterContainer.appendChild(cancelBtn);

        cameraVideo.style.display = 'none';
        shutterBtn.style.display = 'none';
        textOverlay.style.display = 'none';
        cameraCloseBtn.style.display = 'none';

        cancelBtn.onclick = function () {
          if (imgPreview) imgPreview.remove();
          if (addToArchiveBtn) addToArchiveBtn.remove();
          if (cancelBtn) cancelBtn.remove();
          if (tipText) tipText.remove();

          cameraVideo.style.display = 'block';
          shutterBtn.style.display = 'block';
          textOverlay.style.display = 'block';
          cameraCloseBtn.style.display = 'flex';

          cameraVideo.play();
        };
      };
    };

    // *** NEW: Swap poster for video IMMEDIATELY on play ***
    playBtn.onclick = () => {
      playBtn.style.display = 'none';
      spinner.style.display = 'block';
      videoElement = document.createElement('video');
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

      // Swap poster for video immediately
      posterContainer.replaceChild(videoElement, posterImg);

      videoElement.addEventListener('playing', () => {
        spinner.style.display = 'none';
      });

      videoElement.addEventListener('waiting', () => {
        spinner.style.display = 'block';
      });

      videoElement.addEventListener('error', () => {
        spinner.style.display = 'none';
        playBtn.style.display = 'block';
        alert('Video failed to load.');
      });

      videoElement.addEventListener('ended', () => removeOverlayAndPauseVideo());

      videoElement.addEventListener('click', () => {
        videoElement.controls = true;
      });

      videoElement.load();
    };
  });
});

// ----------- ADD TO ARCHIVE LOGIC -----------
// This will be a list of photo URLs (base64 data)
let archivePhotos = [];

// Find the archive section, or create it if needed
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

function addPhotoToArchive(imgSrc) {
  archivePhotos.push(imgSrc);
  renderArchivePhotos();
  // Switch to archive tab
  showSection('archive-section');
}

function renderArchivePhotos() {
  const archiveSection = ensureArchiveSection();
  archiveSection.innerHTML = '<h2 style="text-align:center;font-family:\'Poppins\',sans-serif;">Archive</h2>';
  if (archivePhotos.length === 0) {
    archiveSection.innerHTML += `<p style="text-align:center;">No photos added yet.</p>`;
    return;
  }
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
  grid.style.gap = '16px';
  grid.style.padding = '16px';
  archivePhotos.forEach((src) => {
    const img = document.createElement('img');
    img.src = src;
    img.style.width = '100%';
    img.style.maxWidth = '220px';
    img.style.borderRadius = '10px';
    img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    img.style.display = 'block';
    grid.appendChild(img);
  });
  archiveSection.appendChild(grid);
}

// --------------------------------------------

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
  const bottomBar = document.getElementById('bottom-bar');
  const elapsed = Date.now() - loadingScreenStart;
  const minDuration = 5000;

  function showBottomBar() {
    loadingScreen.style.display = 'none';
    if (bottomBar) bottomBar.style.display = 'flex';
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

// ----------- BOTTOM BAR NAVIGATION LOGIC -----------
function showSection(section) {
  const sections = ['map-section', 'archive-section', 'about-section'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = (id === section) ? 'block' : 'none';
    }
  });

  // Update bar button active state
  document.getElementById('bar-map').classList.toggle('active', section === 'map-section');
  document.getElementById('bar-archive').classList.toggle('active', section === 'archive-section');
  document.getElementById('bar-about').classList.toggle('active', section === 'about-section');

    // --- ADD THIS! ---
  if (section === 'map-section' && window.map) {
    // If your map variable is not global, use just map.resize();
    map.resize();
  }
}

// Initial section shown
document.addEventListener('DOMContentLoaded', () => {
  showSection('map-section');

  // Add event listeners for bottom bar
  document.getElementById('bar-map').addEventListener('click', () => showSection('map-section'));
  document.getElementById('bar-archive').addEventListener('click', () => showSection('archive-section'));
  document.getElementById('bar-about').addEventListener('click', () => showSection('about-section'));
});

// ----------------------------------------------------

const stylePopup = document.createElement('style');

const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

stylePopup.innerHTML = `
  .mapboxgl-popup-content {
    border-radius: 12px !important;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3) !important;
    padding: 10px !important;
    font-family: 'Poppins', sans-serif !important;
    background: #E9E8E0;
    border: 2px solid #f0f0f0 !important;
    line-height: 1.05;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    margin-left: 3px;
    margin-right: 5px;
    margin-bottom: 10px;
  }
  .mapboxgl-popup-content img {
    border: 2px solid #f0f0f0 !important;
    border-radius: 8px;
  }
  .mapboxgl-popup-content p {
    font-weight: bold !important;
    text-align: center;
    letter-spacing: -0.5px;
    font-size: 13px !important;
    margin-bottom: 10px !important;
  }
  .mapboxgl-popup-close-button {
    display: none !important;
  }
  .user-location-marker {
    width: 20px;
    height: 20px;
    background-color: white;
    border: 3px solid #87CEFA;
    border-radius: 100%;
    position: relative;
  }
  .location-marker {
    z-index: 1;
  }
  .building-marker {
    z-index: 2;
  }
  .mapboxgl-popup {
    z-index: 9999 !important;
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .custom-button {
    background-color: #e9e8e0;
    color: black;
    border: 2px solid #f0f0f0;
    padding: 3px 8px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 8px;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
    text-align: center;
  }
  #button-group {
    position: fixed;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    z-index: 1000;
  }
  .dropdown-content {
    line-height: 1.05;
    font-size: 12px;
  }
  #bottom-sheet {
    font-family: 'Poppins', sans-serif !important;
    padding: 5px;
    font-size: 14px;
    line-height: 1.05;
  }
  #bottom-sheet img {
    max-width: 100%;
    border-radius: 8px;
    margin-bottom: 10px;
  }
  #bottom-sheet p {
    margin-bottom: 10px;
  }
  .marker-list-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin-bottom: 8px;
    justify-items: center;
  }
  .marker-list-grid-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .marker-list-grid-img {
    width: 100px;
    height: 178px;
    object-fit: cover;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    border: 1.5px solid #E9E8E0;
    background: #fff;
    display: block;
    margin-bottom: 0;
  }
  .marker-list-grid-label {
    font-size: 11px;
    font-weight: bold;
    text-align: center;
    color: #9b4dca;
    max-width: 70px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
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
      const videoElement = document.querySelector('video');
      if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0;
      }
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
