// index.js

import { buildings } from './buildings.js';
import { locations } from './locations.js';

// === APPLE MAPKIT JS INIT ===

// Replace with your real token
mapkit.init({
  authorizationCallback: function(done) {
    done('eyJraWQiOiJYQlZRM044OFJLIiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiI0Njg1VVpKUDc3IiwiaWF0IjoxNzUyNTkxMDk4LCJleHAiOjE3NTMyNTM5OTl9.ySbCqW56_WIt7IgDbaqnZMBZQPvj6UkbE1BnHz7uj0jge8XWz4xSFMp19mpZNyHofu5YXZT0xOlLgz3U3T0KiA');
  }
});

// === MAP INITIALISE ===

const YORK_CENTER = { lat: 53.958916884514004, lng: -1.0812025894431188 };
const YORK_BOUNDS = {
  north: 54.010,
  south: 53.930,
  east: -1.010,
  west: -1.170
};

const DEFAULT_ZOOM = 15; // MapKit JS zoom is similar to Mapbox

const map = new mapkit.Map("map", {
  center: new mapkit.Coordinate(YORK_CENTER.lat, YORK_CENTER.lng),
  region: new mapkit.CoordinateRegion(
    new mapkit.Coordinate(YORK_CENTER.lat, YORK_CENTER.lng),
    new mapkit.CoordinateSpan(0.06, 0.10)
  ),
  showsCompass: mapkit.FeatureVisibility.Visible,
  showsZoomControl: true,
  showsMapTypeControl: true,
  colorScheme: mapkit.Map.ColorSchemes.Light,
  mapType: mapkit.Map.MapTypes.Flyover,
  isRotationEnabled: true,
  isZoomEnabled: true,
  isPitchEnabled: true
});

// === LOADING SCREEN ===

const loadingScreen = document.getElementById('loading-screen');
if (loadingScreen) loadingScreen.style.display = "block";
const loadingScreenStart = Date.now();
window.addEventListener('load', () => {
  setTimeout(() => {
    if (loadingScreen) loadingScreen.style.display = 'none';
  }, Math.max(0, 5000 - (Date.now() - loadingScreenStart)));
});

// === USER LOCATION MARKER (MapKit default controls) ===

map.showsUserLocation = true;
map.showsUserLocationControl = true;

// ======================
// Helper: URL PARAMS
// ======================
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
const urlLat = getUrlParameter('lat');
const urlLng = getUrlParameter('lng');
const urlZoom = getUrlParameter('zoom');
if(urlLat && urlLng && urlZoom) {
  map.center = new mapkit.Coordinate(parseFloat(urlLat), parseFloat(urlLng));
  map.zoom = parseFloat(urlZoom);
}

// =======================
// Custom MARKER logic using Apple MapKit annotations
// =======================

// -- BUILDINGS --
// BUILDINGS: use ImageAnnotation so each marker shows the building.image from your data

buildings.forEach(building => {
  const [lng, lat] = building.coords;
  const coord = new mapkit.Coordinate(lat, lng);

  // Use the building "image" as the custom pin (PNG/JPG/WEBP URL)
  const annotation = new mapkit.ImageAnnotation(coord, {
    title: building.name || '',
    subtitle: building.description || '',
    // MapKit JS wants an object: {1: url, 2: url@2x, ...} - you can use just 1: building.image
    url: { 1: building.image }, // THIS IS WHAT FETCHES THE IMAGE
    // anchorOffset: new DOMPoint(0, -16), // optional: to adjust pin anchor if you want
  });

  annotation.addEventListener('select', () => {
    // Show your info/video in the bottom sheet
    const videoHTML = building.videoUrl
      ? `<video src="${building.videoUrl}" poster="${building.posterUrl || ''}" controls autoplay
          style="width:100%; max-width:380px; border-radius:10px; margin-top:10px;"></video>` : '';
    toggleBottomSheet(`
      <div style="text-align:center;">
        <h2 style="margin-bottom:6px;">${building.name || ''}</h2>
        <div style="color:#666;font-size:15px;margin-bottom:7px;">${building.description || ''}</div>
        ${videoHTML}
      </div>
    `);
  });

  map.addAnnotation(annotation);
});


// -- LOCATIONS --
locations.forEach(location => {
  const [lng, lat] = location.coords;
  const coord = new mapkit.Coordinate(lat, lng);

  const annotation = new mapkit.MarkerAnnotation(coord, {
    title: location.name || '',
    subtitle: location.description || '',
    glyphText: "📍",
    color: '#0077b6',
  });

  annotation.addEventListener('select', () => {
    toggleBottomSheet(`
      <div style="text-align:center;">
        <h2>${location.name}</h2>
        <div style="color:#666;font-size:15px;margin-bottom:7px;">${location.description || ''}</div>
        ${location.image ? `<img src="${location.image}" 
          style="width:80px;height:80px;object-fit:cover;border-radius:8px;margin:12px auto;display:block;">` : ''}
      </div>
    `);
  });

  map.addAnnotation(annotation);
});

// ==========================
// Bottom Sheet Logic (Custom)
// ==========================
const bottomSheet = document.createElement('div');
bottomSheet.id = 'bottom-sheet';
Object.assign(bottomSheet.style, {
  position: 'fixed',
  left: '50%',
  bottom: '-100%',
  transform: 'translateX(-50%)',
  width: '96vw',
  maxWidth: '470px',
  maxHeight: '56vh',
  background: '#E9E8E0',
  border: '2px solid #f0f0f0',
  borderTopLeftRadius: '14px',
  borderTopRightRadius: '14px',
  boxShadow: '0 -8px 24px rgba(0,0,0,0.15)',
  zIndex: 10000,
  overflowY: 'auto',
  transition: 'bottom 0.3s',
  fontFamily: 'Poppins,sans-serif',
  fontSize: '16px',
  padding: '0'
});
document.body.appendChild(bottomSheet);

function closeBottomSheet() {
  bottomSheet.style.bottom = '-100%';
  isBottomSheetOpen = false;
}
let isBottomSheetOpen = false;
function toggleBottomSheet(contentHTML) {
  if(isBottomSheetOpen) {
    closeBottomSheet();
  } else {
    // Add close btn
    bottomSheet.innerHTML = 
    `<button id="close-bottom-sheet" style="
      position:absolute;top:8px;right:10px;font-size:22px;
      background:none;border:none;cursor:pointer;z-index:2;">×</button>
     <div style="padding:28px 12px 10px 12px;">${contentHTML}</div>`;
    document.getElementById('close-bottom-sheet').onclick = closeBottomSheet;
    bottomSheet.style.bottom = '0px';
    isBottomSheetOpen = true;
  }
}

// ========================
// Buy Me a Coffee/Donor Overlay
// ========================
document.addEventListener('DOMContentLoaded', () => {
  const button = document.createElement('button');
  button.id = 'custom-bmc-button';
  button.className = 'custom-button';
  button.textContent = '❤️ This site costs - please support it ❤️';

  // Dropdown
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
      <img src="https://freddyor.github.io/british-map/videos/IMG_7251.jpeg"
           alt="Profile Photo"
           style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;"/>
    </div>
    <div class="project-info" style="margin-bottom: 15px;">
      <b>If this site was free for you to use, it means someone else paid forward.</b>
    </div>
    <div class="project-info" style="margin-bottom: 15px;">
      My name is Freddy, I’m a 22 year old local to the city. I am coding and building this project completely independently. My mission is to use technology to tell the story of York, like no other city has before.
    </div>
    <div class="project-info" style="margin-bottom: 15px;">
      I would love to keep the site free-to-use, so please consider donating forward for your usage. I would also love to keep making the site better for future users (i.e. buying historic images from York Archives to use) ❤️
    </div>
    <button
      class="support-button"
      style="background-color: #9b4dca; color: white; padding: 10px 20px; font-size: 16px; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; text-align: center; box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3); margin-bottom: 15px;"
      onclick="window.open('https://www.buymeacoffee.com/britmap', '_blank')">Support
    </button>
    <div class="project-info" style="margin-bottom: 15px;">
      You can become a £5 Monthly Donor. You will receive update emails and be able to share and discuss York information with other locals!
    </div>
    <button
      class="support-button"
      style="background-color: #9b4dca; color: white; padding: 10px 20px; font-size: 16px; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; text-align: center; box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3); margin-bottom: 15px;"
      onclick="window.open('https://www.buymeacoffee.com/britmap/membership', '_blank')">Support Monthly
    </button>
    <div style="display: flex; align-items: center; justify-content: center; margin-top: 15px; font-size: 16px; font-weight: bold;">
      <hr style="flex: 1; border: 1px solid #ccc; margin: 0 10px;">
      Our Donors ❤️
      <hr style="flex: 1; border: 1px solid #ccc; margin: 0 10px;">
    </div>
    <div id="donor-list" style="margin-top: 10px;"></div>
  `;
  // Donors list
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
  addDonor('Matt Hall', '5', 'Fantastic stuff! Looking forward to finding out more about this fascinating city.');
  addDonor('Chip Pedro', '5', 'Will be very useful on our upcoming trip - really nice work!');
  addDonor('buffsteve24', '5', 'Amazing work!');
  addDonor('marksaw20', '5', 'Lovely map. Really interesting.');

  // Button & Dropdown Container
  const dropdownContainer = document.createElement('div');
  dropdownContainer.className = 'dropdown';
  dropdownContainer.style.position = 'fixed';
  dropdownContainer.style.left = '50%';
  dropdownContainer.style.top = '10px';
  dropdownContainer.style.transform = 'translateX(-50%)';
  dropdownContainer.style.zIndex = '1001';
  dropdownContainer.appendChild(button);
  dropdownContainer.appendChild(dropdownContent);
  document.body.appendChild(dropdownContainer);

  button.addEventListener('click', (e) => {
    e.preventDefault();
    dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', (event) => {
    if (!dropdownContainer.contains(event.target)) {
      dropdownContent.style.display = 'none';
    }
  });
  dropdownContent.style.width = `${Math.max(button.offsetWidth, 300)}px`;
});

// ========================
// FONTS AND STYLE
// ========================
const link = document.createElement('link');
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap";
document.head.appendChild(link);

const styleElem = document.createElement('style');
styleElem.innerHTML = `
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
    font-family: 'Poppins',sans-serif;
  }
  #bottom-sheet img, #bottom-sheet video {
    display:block;
    margin:14px auto 0;
    max-width:98%;
    border-radius:10px;
    background:#fff;
  }
`;
document.head.appendChild(styleElem);
