import { buildings } from './buildings.js';
import { locations } from './locations.js';

// Track when the loading screen is first shown
const loadingScreenStart = Date.now();

// --- First Video Popup additions START ---
let firstVideoLoadedThisSession = false;
function showFirstVideoWaitMessage(videoElement) {}

const yorkBounds = [
  [-1.170, 53.930],
  [-1.010, 54.010]
];

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZnJlZGRvbWF0ZSIsImEiOiJjbTc1bm5zYnQwaG1mMmtxeDdteXNmeXZ0In0.PuDNORq4qExIJ_fErdO_8g';

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

// Geolocate control and user location marker
const geolocate = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true
  },
  trackUserLocation: true,
  showUserHeading: true,
  showAccuracyCircle: false,
  fitBoundsOptions: {
    maxZoom: 15
  },
  showUserLocation: false
});
map.addControl(geolocate, 'bottom-right');

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

// --- Marker and helper functions ---
locations.forEach(location => {
  const { element: markerElement } = createCustomMarker(location.image, '#FFFFFF', true);
  markerElement.className += ' location-marker';
  const marker = new mapboxgl.Marker({
    element: markerElement
  })
    .setLngLat(location.coords)
    .addTo(map);

  marker.getElement().addEventListener('click', () => {
    map.getCanvas().style.cursor = 'pointer';
    const contentHTML = createPopupContent(location);
    toggleBottomSheet(contentHTML);
  });
});

// =================== BUILDING MARKER FILTER DROPDOWN AND MODE TOGGLE ===================

const categories = Array.from(new Set(buildings.map(b => b.category))).sort();
categories.unshift('All');

let allBuildingMarkers = [];
let currentMode = 'normal';
let currentCategory = 'All';

// ----------- START: Add building names above images in "explore" mode when zoomed in -----------
const ZOOM_NAME_THRESHOLD = 16;

function updateBuildingMarkerLabels() {
  allBuildingMarkers.forEach(({ marker, building, labelEl }) => {
    if (
      currentMode === 'normal' && // explore mode
      map.getZoom() >= ZOOM_NAME_THRESHOLD
    ) {
      labelEl.style.display = 'block';
    } else {
      labelEl.style.display = 'none';
    }
  });
}
map.on('zoom', updateBuildingMarkerLabels);
// ----------- END: Add building names above images -----------

function addBuildingMarkers(buildingsToShow) {
  allBuildingMarkers.forEach(obj => obj.marker.remove());
  allBuildingMarkers = [];
  buildingsToShow.forEach(building => {
    const outlineColor = building.colour === "yes" ? '#FF69B4' : '#FFFFFF';
    const { element: markerElement } = createCustomMarker(building.image, outlineColor, false);
    markerElement.className += ' building-marker';

    if (building.colour === "yes") markerElement.style.zIndex = '3';

    // ----------- ADD LABEL: -----------
    // Create name label element
    const nameLabel = document.createElement('div');
    nameLabel.className = 'building-name-label';
    nameLabel.innerText = building.name;
    nameLabel.style.position = 'absolute';
    nameLabel.style.left = '50%';
    nameLabel.style.top = '-1.5em';
    nameLabel.style.transform = 'translateX(-50%)';
    nameLabel.style.fontFamily = "'Poppins', sans-serif";
    nameLabel.style.fontWeight = 'bold';
    nameLabel.style.fontSize = '1.1em';
    nameLabel.style.pointerEvents = 'none';
    nameLabel.style.whiteSpace = 'nowrap';
    nameLabel.style.color = '#a259ff';
    nameLabel.style.textShadow =
      '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000,' + // strong black outline
      '0px 2px 0 #000, 2px 0px 0 #000, 0px -2px 0 #000, -2px 0px 0 #000';
    nameLabel.style.display = 'none'; // Hidden by default, toggled by updateBuildingMarkerLabels()

    markerElement.appendChild(nameLabel);
    // ----------- END LABEL -----------

    const marker = new mapboxgl.Marker({ element: markerElement })
      .setLngLat(building.coords)
      .addTo(map);

    marker.getElement().addEventListener('click', () => {
      map.getCanvas().style.cursor = 'pointer';
      const videoUrl = building.videoUrl;
      const posterUrl = building.posterUrl;

      if (!videoUrl) {
        console.error('Video URL not available for this building.');
        return;
      }

      // Remove any existing overlays
      document.querySelectorAll('.video-modal-overlay').forEach(el => el.remove());

      // Modal overlay
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

      // Poster and video container
      const posterContainer = document.createElement('div');
      posterContainer.style.position = 'relative';
      posterContainer.style.marginTop = '-60px';

      // Poster image
      const posterImg = document.createElement('img');
      posterImg.src = posterUrl || '';
      posterImg.alt = 'Video cover';
      posterImg.style.maxWidth = '79.2vw';
      posterImg.style.maxHeight = '72vh';
      posterImg.style.borderRadius = '14px';
      posterImg.style.display = 'block';
      posterImg.style.margin = '0 auto';
      posterImg.addEventListener('load', () => {
        posterImg.style.border = '1.5px solid #E9E8E0';
      });

      // Play button
      const playBtn = document.createElement('button');
      playBtn.innerHTML = '▶';
      playBtn.style.position = 'absolute';
      playBtn.style.top = '50%';
      playBtn.style.left = '50%';
      playBtn.style.transform = 'translate(-50%, -50%)';
      playBtn.style.background = 'rgba(0,0,0,0.6)';
      playBtn.style.border = 'none';
      playBtn.style.borderRadius = '50%';
      playBtn.style.width = '48px';
      playBtn.style.height = '48px';
      playBtn.style.color = '#fff';
      playBtn.style.fontSize = '1.7rem';
      playBtn.style.cursor = 'pointer';
      playBtn.style.display = 'flex';
      playBtn.style.alignItems = 'center';
      playBtn.style.justifyContent = 'center';
      playBtn.style.zIndex = 2;

      // Spinner
      const spinner = document.createElement('div');
      spinner.style.position = 'absolute';
      spinner.style.top = '50%';
      spinner.style.left = '50%';
      spinner.style.transform = 'translate(-50%, -50%)';
      spinner.style.width = '36px';
      spinner.style.height = '36px';
      spinner.style.border = '4px solid #eee';
      spinner.style.borderTop = '4px solid #9b4dca';
      spinner.style.borderRadius = '50%';
      spinner.style.animation = 'spin 1s linear infinite';
      spinner.style.display = 'none';
      spinner.style.zIndex = 3;
      const spinnerStyle = document.createElement('style');
      spinnerStyle.innerHTML = `@keyframes spin {0% { transform: translate(-50%, -50%) rotate(0deg);}100% { transform: translate(-50%, -50%) rotate(360deg);}}`;
      document.head.appendChild(spinnerStyle);

      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '❌';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '-6px';
      closeBtn.style.right = '-6px';
      closeBtn.style.width = '18px';
      closeBtn.style.height = '18px';
      closeBtn.style.background = '#000';
      closeBtn.style.color = '#fff';
      closeBtn.style.border = '1.5px solid #E9E8E0';
      closeBtn.style.borderRadius = '50%';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontSize = '0.6rem';
      closeBtn.style.zIndex = '100001';
      closeBtn.style.display = 'flex';
      closeBtn.style.alignItems = 'center';
      closeBtn.style.justifyContent = 'center';

      // Find out more button (always at the bottom)
      let moreBtn = null;
      if (building.link) {
        let moreBtn = document.createElement('a');
        moreBtn.textContent = 'find out more...';
        moreBtn.href = building.link;
        moreBtn.target = '_blank';
        moreBtn.style.position = 'absolute';
        moreBtn.style.left = '50%';
        moreBtn.style.transform = 'translateX(-50%)';
        moreBtn.style.bottom = '-11px';
        moreBtn.style.height = '22px';
        moreBtn.style.lineHeight = '22px';
        moreBtn.style.width = '70%';
        moreBtn.style.background = '#fff';
        moreBtn.style.color = '#111';
        moreBtn.style.border = 'none';
        moreBtn.style.borderRadius = '8px';
        moreBtn.style.fontWeight = 'bold';
        moreBtn.style.fontSize = '1.05rem';
        moreBtn.style.textAlign = 'center';
        moreBtn.style.textDecoration = 'none';
        moreBtn.style.cursor = 'pointer';
        moreBtn.style.zIndex = '10';
        // Much stronger shadow, but still soft-edged:
        moreBtn.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.37), 0 2px 8px 0 rgba(0,0,0,0.19)';
        posterContainer.appendChild(moreBtn);
      }

      // Video element (created later)
      let videoElement = null;

      function removeOverlayAndPauseVideo() {
        if (videoElement) {
          videoElement.pause();
          videoElement.currentTime = 0;
        }
        overlay.remove();
      }

      closeBtn.onclick = () => removeOverlayAndPauseVideo();

      let startY;
      overlay.addEventListener('touchstart', e => {
        if (e.touches.length === 1) startY = e.touches[0].clientY;
      });
      overlay.addEventListener('touchmove', e => {
        if (startY !== undefined && e.touches.length === 1) {
          const dy = e.touches[0].clientY - startY;
          if (dy > 50) {
            removeOverlayAndPauseVideo();
            startY = undefined;
          }
        }
      });
      overlay.addEventListener('touchend', () => { startY = undefined; });

      playBtn.style.display = 'none';
      closeBtn.style.display = 'none';
      posterImg.onload = function () {
        playBtn.style.display = 'flex';
        closeBtn.style.display = 'flex';
      };

      // Append elements in this order: media, play, spinner, close, then find out more button
      posterContainer.appendChild(posterImg);
      posterContainer.appendChild(playBtn);
      posterContainer.appendChild(spinner);
      posterContainer.appendChild(closeBtn);
      if (moreBtn) posterContainer.appendChild(moreBtn);

      overlay.appendChild(posterContainer);
      document.body.appendChild(overlay);

      overlay.addEventListener('mousedown', function (e) {
        if (e.target === overlay) removeOverlayAndPauseVideo();
      });

      playBtn.onclick = () => {
        playBtn.style.display = 'none';
        spinner.style.display = 'block';
        videoElement = document.createElement('video');
        videoElement.src = videoUrl;
        if (posterUrl) videoElement.poster = posterUrl;
        // Use same styles as posterImg
        videoElement.style.maxWidth = '79.2vw';
        videoElement.style.maxHeight = '72vh';
        videoElement.style.borderRadius = '14px';
        videoElement.style.display = 'block';
        videoElement.style.margin = '0 auto';
        videoElement.style.border = '2px solid #E9E8E0';
        videoElement.controls = false;
        videoElement.preload = 'auto';
        videoElement.autoplay = true;
        videoElement.setAttribute('playsinline', '');
        videoElement.setAttribute('webkit-playsinline', '');
        videoElement.playsInline = true;
        showFirstVideoWaitMessage(videoElement);
        let hasStarted = false;

        function showVideo() {
          if (!hasStarted) {
            hasStarted = true;
            posterContainer.replaceChild(videoElement, posterImg);
            spinner.style.display = 'none';
            // The "find out more..." button stays in place because it's always appended last
          }
        }

        function onProgress() {
          if (videoElement.duration && videoElement.buffered.length) {
            const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
            const percentBuffered = bufferedEnd / videoElement.duration;
            if (percentBuffered >= 0.25 && !hasStarted) {
              videoElement.play();
            }
          }
        }

        videoElement.addEventListener('play', showVideo);
        videoElement.addEventListener('progress', onProgress);
        videoElement.addEventListener('click', () => {
          videoElement.controls = true;
        });
        videoElement.addEventListener('ended', () => removeOverlayAndPauseVideo());
        videoElement.addEventListener('error', () => {
          spinner.style.display = 'none';
          playBtn.style.display = 'block';
          alert('Video failed to load.');
        });
        videoElement.load();
      };
    });

    // Add marker, building, and the label element to allBuildingMarkers for later toggling
    allBuildingMarkers.push({ marker, category: building.category, building, labelEl: nameLabel });
  });
  updateBuildingMarkerLabels(); // Make sure to update visibility after markers are added
}

function filterBuildingMarkersByModeAndCategory(mode, category) {
  let filtered;
  if (mode === "normal") {
    filtered = buildings.filter(b => b.mode === "normal");
  } else if (mode === "history") {
    filtered = buildings.filter(b => !b.mode || b.mode === "history");
  }
  if (category !== 'All') {
    filtered = filtered.filter(b => b.category === category);
  }
  addBuildingMarkers(filtered);
}

function filterBuildingMarkers(category) {
  currentCategory = category;
  filterBuildingMarkersByModeAndCategory(currentMode, currentCategory);
}


document.addEventListener('DOMContentLoaded', () => {
  const topBar = document.createElement('div');
  topBar.id = 'top-bar';
  topBar.style.position = 'fixed';
  topBar.style.top = '0';
  topBar.style.left = '0';
  topBar.style.width = '100vw';
  topBar.style.height = '38px';
  topBar.style.background = '#e9e8e0';
  topBar.style.zIndex = '1000';
  topBar.style.display = 'flex';
  topBar.style.alignItems = 'center';
  topBar.style.justifyContent = 'center';
  topBar.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
  topBar.style.fontFamily = "'Poppins', sans-serif";

  // --- Mode Toggle ---
  const toggleWrapper = document.createElement('div');
  toggleWrapper.style.display = 'flex';
  toggleWrapper.style.alignItems = 'center';
  toggleWrapper.style.gap = '9px';
  toggleWrapper.style.userSelect = 'none';

  // Labels
  const normalLabel = document.createElement('span');
  normalLabel.textContent = 'Explore';
  normalLabel.style.fontSize = '12px';
  normalLabel.style.fontWeight = 'bold';
  normalLabel.style.cursor = 'pointer';
  normalLabel.style.transition = 'color 0.18s, font-weight 0.18s';

  const historyLabel = document.createElement('span');
  historyLabel.textContent = 'History';
  historyLabel.style.fontSize = '12px';
  historyLabel.style.fontWeight = 'normal';
  historyLabel.style.cursor = 'pointer';
  historyLabel.style.transition = 'color 0.18s, font-weight 0.18s';

  // Toggle switch container
  const toggleContainer = document.createElement('div');
  toggleContainer.style.width = '38px';
  toggleContainer.style.height = '20px';
  toggleContainer.style.background = '#ccc';
  toggleContainer.style.borderRadius = '12px';
  toggleContainer.style.position = 'relative';
  toggleContainer.style.display = 'inline-block';
  toggleContainer.style.cursor = 'pointer';
  toggleContainer.style.transition = 'background 0.2s';

  // Toggle circle (thumb)
  const toggleCircle = document.createElement('div');
  toggleCircle.style.position = 'absolute';
  toggleCircle.style.top = '2px';
  toggleCircle.style.left = '2px';
  toggleCircle.style.width = '16px';
  toggleCircle.style.height = '16px';
  toggleCircle.style.background = '#ffffff';
  toggleCircle.style.borderRadius = '50%';
  toggleCircle.style.boxShadow = '0 1px 4px rgba(0,0,0,0.13)';
  toggleCircle.style.transition = 'left 0.2s';

  toggleContainer.appendChild(toggleCircle);

  let isHistory = false;
  function updateToggleVisual() {
    if (isHistory) {
      toggleCircle.style.left = '20px';
      toggleContainer.style.background = '#e0b0ff';
      normalLabel.style.color = '#888';
      normalLabel.style.fontWeight = 'normal';
      historyLabel.style.color = '#000';
      historyLabel.style.fontWeight = 'bold';
    } else {
      toggleCircle.style.left = '2px';
      toggleContainer.style.background = '#e0b0ff';
      normalLabel.style.color = '#000';
      normalLabel.style.fontWeight = 'bold';
      historyLabel.style.color = '#888';
      historyLabel.style.fontWeight = 'normal';
    }
  }
function setMode(history) {
  isHistory = history;
  currentMode = isHistory ? 'history' : 'normal';
  currentCategory = 'All';
  updateToggleVisual();
  filterBuildingMarkersByModeAndCategory(currentMode, currentCategory);
}

// Place this right after setMode:
const path = window.location.pathname;
if (path.endsWith('/history')) {
  setMode(true);
} else if (path.endsWith('/normal')) {
  setMode(false);
} else {
  setMode(false);
}

  normalLabel.onclick = () => setMode(false);
  historyLabel.onclick = () => setMode(true);
  toggleContainer.onclick = () => setMode(!isHistory);

  toggleWrapper.appendChild(normalLabel);
  toggleWrapper.appendChild(toggleContainer);
  toggleWrapper.appendChild(historyLabel);

  // Divider between controls
  const divider = document.createElement('div');
  divider.style.height = '28px';
  divider.style.width = '1.5px';
  divider.style.background = '#ccc';
  divider.style.margin = '0 18px';
  divider.style.borderRadius = '3px';

  // Support link (plain clickable text)
  const supportLink = document.createElement('span');
  supportLink.textContent = '❤️ Support this project ❤️';
  supportLink.style.fontWeight = 'bold';
  supportLink.style.fontSize = '12px';
  supportLink.style.color = '#000000';
  supportLink.style.cursor = 'pointer';
  supportLink.style.marginLeft = '10px';

  // Dropdown logic
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
  dropdownContent.style.fontSize = '13px';
  dropdownContent.style.lineHeight = '1.25';
  dropdownContent.style.zIndex = '10000';
  dropdownContent.style.width = '80vw';     // Popup now takes 80% of the viewport width
dropdownContent.style.maxWidth = '96vw'; 
  dropdownContent.style.textAlign = 'center';
  dropdownContent.style.maxHeight = 'calc(100vh - 200px)';
  dropdownContent.style.overflowY = 'auto';

  dropdownContent.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <img src="https://freddyor.github.io/british-map/videos/IMG_7251.jpeg" 
           alt="Profile Photo" 
           style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;"/>
    </div>
    <div class="project-info" style="margin-bottom: 15px;">
      <b>This page needs donors.</b>
    </div>
    <div class="project-info" style="margin-bottom: 15px;">
      My name is Freddy, I’m a 22 year old local to the city. I am building this project completely independently. Feel free to email me on freddy@britmap.com 📧
    </div>
    <div class="project-info" style="margin-bottom: 15px;">
      In full transparency, here is why I will need donors:
    </div>
    <ul style="margin-bottom: 15px; text-align: left;">
      <li>the map server in the background costs me money based on usage</li>
      <li>I want to add old pictures of York locations to make the map even better for users - but York Archives charges a significant amount to use them commercially</li>
      <li>lots of people actually asked to me to put a donation link. Considering this project has consumed A LOT of my time - it is nice to receive some love back ❤️</li>
    </ul>
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

  function addDonor(name, amount, subtext) {
    const donorList = dropdownContent.querySelector('#donor-list');
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
  addDonor('Chip Pedro', '5', 'Will be very useful on our upcoming trip - really nice work!');
  addDonor('buffsteve24', '5', 'Amazing work!');
  addDonor('marksaw20', '5', 'Lovely map. Really interesting.');

  supportLink.addEventListener('click', (e) => {
    e.preventDefault();
    dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', (event) => {
    if (!supportLink.contains(event.target) && !dropdownContent.contains(event.target)) {
      dropdownContent.style.display = 'none';
    }
  });

  topBar.appendChild(toggleWrapper);
  topBar.appendChild(divider);
  topBar.appendChild(supportLink);
  document.body.appendChild(topBar);
  document.body.appendChild(dropdownContent);

  // Set initial visual feedback for mode
  setMode(false);
});

// =================== MARKER ZOOM SCALING ===================
function scaleMarkersBasedOnZoom() {
  const zoomLevel = map.getZoom();
  const markerSize = (zoomLevel - 13);
  const markerWidth = markerSize + 'em';
  const markerHeight = markerSize + 'em';
  const borderWidth = (markerSize * 0.075) + 'em';

  document.querySelectorAll('.location-marker, .building-marker').forEach(marker => {
    marker.style.width = markerWidth;
    marker.style.height = markerHeight;
    marker.style.borderWidth = borderWidth;

    const bump = marker.querySelector('.marker-bump');
    if (bump) {
      const bumpWidth = (markerSize * 0.4) + 'em';
      const bumpHeight = (markerSize * 0.25) + 'em';
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
};

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

const link = document.createElement('link');
link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap";
link.rel = "stylesheet";
document.head.appendChild(link);

const stylePopup = document.createElement('style');
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
    border: 1.5px solid #f0f0f0;
    padding: 3px 12px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 9px;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.16);
    white-space: nowrap;
    text-align: center;
    height: 28.5px;
    min-width: 128px;
    align-items: center;
    justify-content: center;
  }
  #button-group {
    position: relative;
    display: flex;
    align-items: center;
  }
  #mode-toggle-container {
    min-width: 128px;
    height: 28.5px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
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
 `;
document.head.appendChild(stylePopup);

function createCustomMarker(imageUrl, color = '#9b4dca', isLocation = false) {
  const markerDiv = document.createElement('div');
  markerDiv.className = 'custom-marker';
  markerDiv.style.width = '3em';
  markerDiv.style.height = '3em';
  markerDiv.style.position = 'absolute';
  markerDiv.style.borderRadius = '25%';
  markerDiv.style.border = `0.2em solid ${color}`;
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
  imageElement.style.borderRadius = '25%';

  const bump = document.createElement('div');
  bump.className = 'marker-bump';
  bump.style.position = 'absolute';
  bump.style.left = '50%';
  bump.style.top = '100%';
  bump.style.transform = 'translateX(-50%)';
  bump.style.width = '2em';
  bump.style.height = '0.5em';
  bump.style.background = color;
  bump.style.clipPath = 'polygon(0% 0%, 100% 0%, 55% 96%, 56% 100%, 44% 100%, 45% 96%)';
  bump.style.zIndex = '1';

  markerDiv.appendChild(imageElement);
  markerDiv.appendChild(bump);

  return {
    element: markerDiv,
    id: `marker-${Date.now()}-${Math.random()}`
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
                    ${eventsData.map(event => `
                        <div style="background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 10px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                            <strong style="color: #7C6E4D; font-size: 15px;">${event.date || event.label}</strong>: <span style="font-size: 15px;">${event.description}</span>
                        </div>
                    `).join('')}
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
