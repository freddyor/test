import { buildings } from './buildings.js';
import { locations } from './locations.js';

const loadingScreenStart = Date.now();
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
map.addControl(geolocate);

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
  if (building.colour === 'yes') markerElement.style.zIndex = '3';
  const marker = new mapboxgl.Marker({ element: markerElement })
    .setLngLat(building.coords)
    .addTo(map);
  marker.getElement().addEventListener('click', () => {
    map.getCanvas().style.cursor = 'pointer';
    showPeekCarouselModal(building);
  });
});

// ----------------------
// MODAL CAROUSEL FUNCTION
// ----------------------
function showPeekCarouselModal(building) {
  document.querySelectorAll('.video-modal-overlay').forEach((el) => el.remove());

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'video-modal-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.75)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = 100000;
  overlay.style.overflow = 'hidden';

  // Blur patch
  function setBlur(enabled) {
    const targets = [
      document.getElementById('map'),
      document.getElementById('bottom-sheet'),
      document.getElementById('button-group')
    ];
    targets.forEach(el => {
      if (el) el.style.filter = enabled ? 'blur(12px)' : '';
    });
    Array.from(document.body.children).forEach(child => {
      if (child !== overlay && child.style) {
        child.style.filter = enabled ? 'blur(12px)' : '';
      }
    });
  }
  setBlur(true);

  // Modal container (full screen overlay with centered box)
  const modalContainer = document.createElement('div');
  modalContainer.className = 'peek-carousel-modal-container';

  // Size modal container as fixed 9:16 ratio box, centered
  const modalWidth = 360; // px, adjust as preferred
  const modalHeight = Math.round(modalWidth * 16 / 9); // calculate height for 9:16 ratio
  modalContainer.style.position = 'absolute';
  modalContainer.style.width = modalWidth + 'px';
  modalContainer.style.height = modalHeight + 'px';
  // center modal
  modalContainer.style.top = '50%';
  modalContainer.style.left = '50%';
  modalContainer.style.transform = 'translate(-50%, -50%)';
  modalContainer.style.background = '#fff';
  modalContainer.style.borderRadius = '16px';
  modalContainer.style.boxShadow = '0 8px 32px rgba(0,0,0,0.22)';
  modalContainer.style.display = 'block';
  modalContainer.style.overflow = 'visible';
  modalContainer.style.zIndex = '100001';

  // Boards
  const boards = ['video', 'textboard', 'camera'];
  let currentIndex = 0;

  // Board content wrappers
  const boardWrappers = boards.map((type, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'peek-carousel-board';
    wrapper.style.position = 'absolute';
    wrapper.style.top = '0';
    wrapper.style.width = '70%';
    wrapper.style.height = '70%';
    wrapper.style.left = '50%';
    wrapper.style.transform = 'translateX(-50%)';
    wrapper.style.transition = 'left 0.3s cubic-bezier(.77,.2,.64,1.09), opacity 0.3s';
    wrapper.style.borderRadius = '16px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.background = '#fff';
    wrapper.style.boxShadow = i === currentIndex ? '0 8px 32px rgba(0,0,0,0.22)' : '0 2px 8px rgba(0,0,0,0.10)';
    wrapper.style.zIndex = i === currentIndex ? '3' : '2';

    // Contents
    if (type === 'video') {
      const videoUrl = building.videoUrl;
      const posterUrl = building.posterUrl;
      if (videoUrl) {
        const videoElement = document.createElement('video');
        videoElement.src = videoUrl;
        if (posterUrl) videoElement.poster = posterUrl;
        videoElement.width = '100%';
        videoElement.height = '100%';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.borderRadius = '16px';
        videoElement.style.border = 'none';
        videoElement.controls = true;
        videoElement.autoplay = true;
        videoElement.setAttribute('playsinline', '');
        videoElement.setAttribute('webkit-playsinline', '');
        videoElement.playsInline = true;
        wrapper.appendChild(videoElement);
      } else {
        const msg = document.createElement('div');
        msg.innerHTML = '<p style="color:#9b4dca;font-weight:bold;">No video available.</p>';
        wrapper.appendChild(msg);
      }
    } else if (type === 'textboard') {
      const textboardContent = building.textboard || 'No board content yet.';
      const title = document.createElement('div');
      title.textContent = building.name || '';
      title.style.fontSize = '1.1em';
      title.style.fontWeight = 'bold';
      title.style.marginTop = '32px';
      title.style.marginBottom = '10px';
      title.style.color = '#9b4dca';
      title.style.textAlign = 'center';

      const board = document.createElement('div');
      board.textContent = textboardContent;
      board.style.fontSize = '1em';
      board.style.fontWeight = 'normal';
      board.style.color = '#333';
      board.style.textAlign = 'center';
      board.style.lineHeight = '1.32';
      board.style.marginBottom = '8px';
      board.style.marginLeft = '14px';
      board.style.marginRight = '14px';

      wrapper.appendChild(title);
      wrapper.appendChild(board);
    } else if (type === 'camera') {
      const videoWrapper = document.createElement('div');
      videoWrapper.style.width = '96%';
      videoWrapper.style.height = '96%';
      videoWrapper.style.display = 'flex';
      videoWrapper.style.alignItems = 'center';
      videoWrapper.style.justifyContent = 'center';
      videoWrapper.style.margin = '2%';

      const cameraVideo = document.createElement('video');
      cameraVideo.autoplay = true;
      cameraVideo.playsInline = true;
      cameraVideo.style.width = '100%';
      cameraVideo.style.height = '100%';
      cameraVideo.style.objectFit = 'contain';
      cameraVideo.style.borderRadius = '14px';
      cameraVideo.style.display = 'block';
      cameraVideo.style.margin = '0 auto';

      videoWrapper.appendChild(cameraVideo);
      wrapper.appendChild(videoWrapper);

      // Start camera stream only when board active
      wrapper._activate = function () {
        if (!cameraVideo.srcObject) {
          navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              aspectRatio: 9 / 16,
              width: { ideal: 720 },
              height: { ideal: 1280 }
            }
          }).then(stream => {
            cameraVideo.srcObject = stream;
            wrapper._stream = stream;
          }).catch(() => {
            let msg = document.createElement('div');
            msg.innerHTML = '<p style="color:#9b4dca;font-weight:bold;">Could not access camera.</p>';
            wrapper.appendChild(msg);
          });
        }
      };
      wrapper._deactivate = function () {
        if (wrapper._stream) {
          wrapper._stream.getTracks().forEach(t => t.stop());
          cameraVideo.srcObject = null;
          wrapper._stream = null;
        }
      };
    }

    return wrapper;
  });

  // Position boards for initial state
  function updateBoardPositions() {
    for (let i = 0; i < boardWrappers.length; ++i) {
      if (i === currentIndex) {
        boardWrappers[i].style.left = '50%';
        boardWrappers[i].style.opacity = '1';
        boardWrappers[i].style.zIndex = '3';
        boardWrappers[i].style.boxShadow = '0 8px 32px rgba(0,0,0,0.22)';
        boardWrappers[i].style.transform = 'translateX(-50%)';
        if (boardWrappers[i]._activate) boardWrappers[i]._activate();
      } else if (i < currentIndex) {
        boardWrappers[i].style.left = 'calc(50% - 60px)';
        boardWrappers[i].style.opacity = '0.7';
        boardWrappers[i].style.zIndex = '2';
        boardWrappers[i].style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
        boardWrappers[i].style.transform = 'translateX(-50%)';
        if (boardWrappers[i]._deactivate) boardWrappers[i]._deactivate();
      } else {
        boardWrappers[i].style.left = 'calc(50% + 60px)';
        boardWrappers[i].style.opacity = '0.7';
        boardWrappers[i].style.zIndex = '2';
        boardWrappers[i].style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
        boardWrappers[i].style.transform = 'translateX(-50%)';
        if (boardWrappers[i]._deactivate) boardWrappers[i]._deactivate();
      }
    }
  }
  updateBoardPositions();

  // Arrows
  const navRight = document.createElement('button');
  navRight.textContent = '›';
  navRight.className = 'peek-carousel-nav-btn';
  navRight.style.position = 'absolute';
  navRight.style.right = '-24px';
  navRight.style.top = '50%';
  navRight.style.transform = 'translateY(-50%)';
  navRight.style.background = '#fff';
  navRight.style.border = 'none';
  navRight.style.borderRadius = '50%';
  navRight.style.width = '40px';
  navRight.style.height = '40px';
  navRight.style.fontSize = '2.1em';
  navRight.style.color = '#9b4dca';
  navRight.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
  navRight.style.cursor = 'pointer';
  navRight.style.zIndex = 101;

  const navLeft = document.createElement('button');
  navLeft.textContent = '‹';
  navLeft.className = 'peek-carousel-nav-btn';
  navLeft.style.position = 'absolute';
  navLeft.style.left = '-24px';
  navLeft.style.top = '50%';
  navLeft.style.transform = 'translateY(-50%)';
  navLeft.style.background = '#fff';
  navLeft.style.border = 'none';
  navLeft.style.borderRadius = '50%';
  navLeft.style.width = '40px';
  navLeft.style.height = '40px';
  navLeft.style.fontSize = '2.1em';
  navLeft.style.color = '#9b4dca';
  navLeft.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
  navLeft.style.cursor = 'pointer';
  navLeft.style.zIndex = 101;

  function updateNavButtons() {
    navLeft.style.display = currentIndex === 0 ? 'none' : '';
    navRight.style.display = currentIndex === boards.length - 1 ? 'none' : '';
  }
  updateNavButtons();

  navRight.onclick = () => {
    if (currentIndex < boards.length - 1) {
      currentIndex++;
      updateBoardPositions();
      updateNavButtons();
    }
  };
  navLeft.onclick = () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateBoardPositions();
      updateNavButtons();
    }
  };

  // Swipe support
  let dragStartX = null;
  modalContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) dragStartX = e.touches[0].clientX;
  });
  modalContainer.addEventListener('touchmove', (e) => {
    if (dragStartX !== null && e.touches.length === 1) {
      const dx = e.touches[0].clientX - dragStartX;
      if (Math.abs(dx) > 50) {
        if (dx < 0 && currentIndex < boards.length - 1) {
          currentIndex++;
          updateBoardPositions();
          updateNavButtons();
        } else if (dx > 0 && currentIndex > 0) {
          currentIndex--;
          updateBoardPositions();
          updateNavButtons();
        }
        dragStartX = null;
      }
    }
  });
  modalContainer.addEventListener('touchend', () => {
    dragStartX = null;
  });

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '❌';
  closeBtn.className = 'peek-carousel-close-btn';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '-16px';
  closeBtn.style.right = '-16px';
  closeBtn.style.width = '32px';
  closeBtn.style.height = '32px';
  closeBtn.style.background = '#000';
  closeBtn.style.color = '#fff';
  closeBtn.style.border = '1.5px solid #E9E8E0';
  closeBtn.style.borderRadius = '50%';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '1rem';
  closeBtn.style.zIndex = '100002';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.justifyContent = 'center';
  closeBtn.onclick = () => {
    overlay.remove();
    setBlur(false);
    // Stop camera stream
    boardWrappers.forEach(w => w._deactivate && w._deactivate());
  };

  // Add boards to container
  boardWrappers.forEach(w => modalContainer.appendChild(w));
  modalContainer.appendChild(navLeft);
  modalContainer.appendChild(navRight);
  overlay.appendChild(modalContainer);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  overlay.addEventListener('mousedown', function (e) {
    if (e.target === overlay) {
      closeBtn.onclick();
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
  if (loadingScreen) {
    if (elapsed >= minDuration) {
      loadingScreen.style.display = 'none';
    } else {
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, minDuration - elapsed);
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

const buttonGroup = document.createElement('div');
buttonGroup.id = 'button-group';
buttonGroup.style.position = 'fixed';
buttonGroup.style.left = '50%';
buttonGroup.style.top = '50px';
buttonGroup.style.transform = 'translateX(-50%)';
buttonGroup.style.zIndex = '1000';
buttonGroup.style.display = 'flex';
buttonGroup.style.gap = '10px';
document.body.appendChild(buttonGroup);

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
  .video-modal-overlay {
    animation: fadeIn 0.21s cubic-bezier(.77,.2,.64,1.09);
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .peek-carousel-modal-container {
    position: relative;
    width: 380px;
    max-width: 98vw;
    height: 464px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.22);
    display: block;
    overflow: visible;
  }
  .peek-carousel-board {
    position: absolute;
    top: 0;
    width: 380px;
    height: 464px;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.10);
    transition: left 0.3s cubic-bezier(.77,.2,.64,1.09), opacity 0.3s;
    will-change: left, opacity;
    overflow: hidden;
  }
  .peek-carousel-nav-btn {
    font-size: 2.1em;
    background: #fff;
    color: #9b4dca;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    cursor: pointer;
    z-index: 101;
    position: absolute;
  }
  .peek-carousel-close-btn {
    background: #000;
    color: #fff;
    border: 1.5px solid #E9E8E0;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    font-size: 1rem;
    z-index: 100001;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
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
  .custom-shutter-btn {
    background: white;
    border: 4px solid #ccc;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    outline: none;
    transition: box-shadow 0.1s;
  }
 `;
document.head.appendChild(stylePopup);

// ... rest unchanged (support buttons, marker list, etc.) ...

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

// ========== Support Button + Marker List Button & Popup =============
document.addEventListener('DOMContentLoaded', () => {
  const button = document.createElement('button');
  button.id = 'custom-bmc-button';
  button.className = 'custom-button';
  button.textContent = '❤️ This site costs - please support it ❤️';

  const dropdownContent = document.createElement('div');
  dropdownContent.style.display = 'none';
  dropdownContent.style.position = 'fixed';
  dropdownContent.style.top = '50px';
  dropdownContent.style.left = '50%';
  dropdownContent.style.transform = 'translateX(-50%)';
  dropdownContent.style.backgroundColor = '#f9f9f9';
  dropdownContent.style.padding = '20px';
  dropdownContent.style.border = '1px solid #ccc';
  dropdownContent.style.borderRadius = '8px';
  dropdownContent.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.3)';
  dropdownContent.style.fontSize = '14px';
  dropdownContent.style.lineHeight = '1.25';
  dropdownContent.style.zIndex = '10000';
  dropdownContent.style.maxWidth = '300px';
  dropdownContent.style.textAlign = 'center';
  dropdownContent.style.maxHeight = 'calc(100vh - 200px)';
  dropdownContent.style.overflowY = 'auto';
  dropdownContent.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <img src="https://freddyor.github.io/british-map/videos/IMG_7251.jp" 
             alt="Profile Photo" 
             style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;"/>
      </div>
      <div class="project-info" style="margin-bottom: 15px;">
        <b>If this site was free for you to use, it means someone else paid forward.</b>
      </div>
      <div class="project-info" style="margin-bottom: 15px;">
        My name is Freddy, I’m a 22 year old local to the city. I am coding and building this project completely independently. My mission is to use technology to tell the story of York, like no[...]
      </div>
      <div class="project-info" style="margin-bottom: 15px;">
        I would love to keep the site free-to-use, so please consider donating forward for your usage. I would also love to keep making the site better for future users (i.e. buying historic imag[...]
      </div>
      <button 
          class="support-button" 
          style="
              background-color: #9b4dca; 
              color: white; 
              padding: 10px 20px; 
              font-size: 16px; 
              font-weight: bold; 
              border: none; 
              border-radius: 8px; 
              cursor: pointer; 
              text-align: center;
              box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
              margin-bottom: 15px;
          "
          onclick="window.open('https://www.buymeacoffee.com/britmap', '_blank')"
      >
          Support
      </button>
      <div style="display: flex; align-items: center; justify-content: center; margin-top: 15px; font-size: 16px; font-weight: bold;">
        <hr style="flex: 1; border: 1px solid #ccc; margin: 0 10px;">
        Our Donors ❤️
        <hr style="flex: 1; border: 1px solid #ccc; margin: 0 10px;">
      </div>
      <div id="donor-list" style="margin-top: 10px;"></div>
  `;

  const dropdownContainer = document.createElement('div');
  dropdownContainer.className = 'dropdown';
  dropdownContainer.style.position = 'fixed';
  dropdownContainer.style.left = '50%';
  dropdownContainer.style.top = '10px';
  dropdownContainer.style.transform = 'translateX(-50%)';
  dropdownContainer.style.zIndex = '1001';
  dropdownContainer.style.display = 'flex';
  dropdownContainer.style.flexDirection = 'column';
  dropdownContainer.style.alignItems = 'center';
  dropdownContainer.appendChild(button);

  const markerListButton = document.createElement('button');
  markerListButton.textContent = '🔍 Search Locations';
  markerListButton.className = 'custom-button';
  markerListButton.style.marginTop = '10px';
  markerListButton.style.marginLeft = 'auto';
  markerListButton.style.marginRight = 'auto';
  markerListButton.style.display = 'block';

  const markerListPopup = document.createElement('div');
  markerListPopup.style.display = 'none';
  markerListPopup.style.position = 'fixed';
  markerListPopup.style.top = '90px';
  markerListPopup.style.left = '50%';
  markerListPopup.style.transform = 'translateX(-50%)';
  markerListPopup.style.background = '#fff';
  markerListPopup.style.padding = '15px 20px 20px 20px';
  markerListPopup.style.border = '1.5px solid #ccc';
  markerListPopup.style.borderRadius = '12px';
  markerListPopup.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.22)';
  markerListPopup.style.zIndex = '10002';
  markerListPopup.style.maxHeight = '60vh';
  markerListPopup.style.overflowY = 'auto';
  markerListPopup.style.minWidth = '240px';
  markerListPopup.style.fontFamily = "'Poppins', sans-serif";
  markerListPopup.style.fontSize = '15px';
  markerListPopup.style.lineHeight = '1.28';

  const popupModeContainer = document.createElement('div');
  popupModeContainer.style.display = 'flex';
  popupModeContainer.style.justifyContent = 'center';
  popupModeContainer.style.gap = '14px';
  popupModeContainer.style.marginBottom = '12px';

  const listModeBtn = document.createElement('button');
  listModeBtn.textContent = 'List';
  listModeBtn.className = 'custom-button';
  listModeBtn.style.padding = '4px 20px';
  listModeBtn.style.fontWeight = 'bold';

  const socialModeBtn = document.createElement('button');
  socialModeBtn.textContent = 'From Social Media';
  socialModeBtn.className = 'custom-button';
  socialModeBtn.style.padding = '4px 20px';
  socialModeBtn.style.fontWeight = 'bold';

  popupModeContainer.appendChild(listModeBtn);
  popupModeContainer.appendChild(socialModeBtn);

  let popupMode = 'list';
  function updateModeButtons() {
    if (popupMode === 'list') {
      listModeBtn.style.background = '#9b4dca';
      listModeBtn.style.color = '#fff';
      socialModeBtn.style.background = '#e9e8e0';
      socialModeBtn.style.color = '#111';
    } else {
      socialModeBtn.style.background = '#9b4dca';
      socialModeBtn.style.color = '#fff';
      listModeBtn.style.background = '#e9e8e0';
      listModeBtn.style.color = '#111';
    }
  }

  const popupContentDiv = document.createElement('div');
  function populateMarkerList() {
    updateModeButtons();
    popupContentDiv.innerHTML = '';
    if (popupMode === 'list') {
      const allMarkers = [
        ...locations.map((l) => ({ name: l.name, coords: l.coords })),
        ...buildings.map((b) => ({ name: b.name, coords: b.coords })),
      ].sort((a, b) => a.name.localeCompare(b.name));
      allMarkers.forEach(({ name, coords }) => {
        const item = document.createElement('button');
        item.textContent = name;
        item.className = 'custom-button';
        item.style.margin = '4px 0';
        item.style.width = '100%';
        item.style.textAlign = 'left';
        item.style.fontSize = '15px';
        item.onclick = () => {
          markerListPopup.style.display = 'none';
          map.flyTo({ center: coords, zoom: 17, speed: 1.4 });
        };
        popupContentDiv.appendChild(item);
      });
    } else {
      const socialBuildings = buildings.filter((b) => b['social media'] === 'yes');
      if (!socialBuildings.length) {
        popupContentDiv.innerHTML +=
          '<div style="color:#777; margin-bottom:10px;">No social media markers yet.</div>';
      } else {
        const grid = document.createElement('div');
        grid.className = 'marker-list-grid';
        socialBuildings.forEach((b) => {
          const imgBtn = document.createElement('button');
          imgBtn.className = 'marker-list-grid-btn';
          const img = document.createElement('img');
          img.className = 'marker-list-grid-img';
          img.src = b.posterUrl || b.image || '';
          img.alt = b.name;
          imgBtn.appendChild(img);
          imgBtn.onclick = () => {
            markerListPopup.style.display = 'none';
            map.flyTo({ center: b.coords, zoom: 17, speed: 1.4 });
          };
          grid.appendChild(imgBtn);
        });
        popupContentDiv.appendChild(grid);
      }
    }
    const close = document.createElement('button');
    close.textContent = 'Close';
    close.className = 'custom-button';
    close.style.background = '#eee';
    close.style.color = '#333';
    close.style.marginTop = '14px';
    close.onclick = () => (markerListPopup.style.display = 'none');
    popupContentDiv.appendChild(close);
  }

  listModeBtn.onclick = () => {
    popupMode = 'list';
    populateMarkerList();
  };
  socialModeBtn.onclick = () => {
    popupMode = 'social';
    populateMarkerList();
  };
  markerListButton.onclick = () => {
    if (markerListPopup.style.display === 'block') {
      markerListPopup.style.display = 'none';
    } else {
      popupMode = 'list';
      populateMarkerList();
      markerListPopup.style.display = 'block';
    }
  };

  markerListPopup.innerHTML = '';
  markerListPopup.appendChild(popupModeContainer);
  markerListPopup.appendChild(popupContentDiv);
  dropdownContainer.appendChild(markerListButton);
  dropdownContainer.appendChild(dropdownContent);
  document.body.appendChild(dropdownContainer);
  document.body.appendChild(markerListPopup);

  function addDonor(name, amount, subtext) {
    const donorList = document.getElementById('donor-list');
    const donorDiv = document.createElement('div');
    donorDiv.className = 'donor';
    donorDiv.innerHTML = `
            <span class="donor-name" style="font-weight: bold;">${name}</span>
            <span class="donor-amount" style="color: #9b4dca; margin-left: 10px; font-weight: bold;">£${amount}</span>
            <div class="donor-subtext" style="font-size: 12px; color: #666; margin-top: 1px;">${subtext}</div>
        `;
    donorDiv.style.marginBottom = '12px';
    donorList.appendChild(donorDiv);
  }

  addDonor('Anonymous', '15', ' ');
  addDonor(
    'Matt Hall',
    '5',
    'Fantastic stuff! Looking forward to finding out more about this fascinating city.'
  );
  addDonor(
    'Chip Pedro',
    '5',
    'Will be very useful on our upcoming trip - really nice work!'
  );
  addDonor('buffsteve24', '5', 'Amazing work!');
  addDonor('marksaw20', '5', 'Lovely map. Really interesting.');

  button.addEventListener('click', (e) => {
    e.preventDefault();
    dropdownContent.style.display =
      dropdownContent.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', (event) => {
    if (
      !dropdownContainer.contains(event.target) &&
      !markerListButton.contains(event.target) &&
      !markerListPopup.contains(event.target)
    ) {
      dropdownContent.style.display = 'none';
      markerListPopup.style.display = 'none';
    }
  });

  dropdownContent.style.width = `${Math.max(button.offsetWidth, 300)}px`;
});
