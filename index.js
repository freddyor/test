import { buildings } from './buildings.js';
import { locations } from './locations.js';

// === Set up Apple MapKit JS ===
mapkit.init({
  authorizationCallback: function(done) {
    done('eyJraWQiOiJYQlZRM044OFJLIiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiI0Njg1VVpKUDc3IiwiaWF0IjoxNzUyNTkxMDk4LCJleHAiOjE3NTMyNTM5OTl9.ySbCqW56_WIt7IgDbaqnZMBZQPvj6UkbE1BnHz7uj0jge8XWz4xSFMp19mpZNyHofu5YXZT0xOlLgz3U3T0KiA');
  }
});

const YORK_CENTER = { lat: 53.958916884514004, lng: -1.0812025894431188 };
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

// === Markers Layer ===
const markerLayer = document.createElement('div');
markerLayer.style.position = 'absolute';
markerLayer.style.top = 0;
markerLayer.style.left = 0;
markerLayer.style.width = '100%';
markerLayer.style.height = '100%';
markerLayer.style.pointerEvents = 'none'; // Allow map interaction below
markerLayer.style.zIndex = 10;
document.getElementById('map').appendChild(markerLayer);

// === Helper: Create custom HTML marker (round + bump) ===
function createCustomMarker(imageUrl, color = '#9b4dca') {
  const markerDiv = document.createElement('div');
  markerDiv.className = 'custom-marker';
  markerDiv.style.width = '2.4em';
  markerDiv.style.height = '2.4em';
  markerDiv.style.borderRadius = '50%';
  markerDiv.style.border = `0.12em solid ${color}`;
  markerDiv.style.background = 'white';
  markerDiv.style.position = 'absolute';
  markerDiv.style.boxSizing = 'border-box';
  markerDiv.style.overflow = 'visible';
  markerDiv.style.display = 'flex';
  markerDiv.style.alignItems = 'center';
  markerDiv.style.justifyContent = 'center';
  markerDiv.style.boxShadow = '0 2px 8px rgba(50,40,80,0.08)';
  markerDiv.style.transition = 'box-shadow 0.2s';

  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = '';
  img.style.width = '92%';
  img.style.height = '92%';
  img.style.borderRadius = '50%';
  img.style.objectFit = 'cover';
  markerDiv.appendChild(img);

  // Bump
  const bump = document.createElement('div');
  bump.className = 'marker-bump';
  bump.style.position = 'absolute';
  bump.style.left = '50%';
  bump.style.top = '98%';
  bump.style.transform = 'translateX(-50%)';
  bump.style.width = '1.2em';
  bump.style.height = '0.32em';
  bump.style.background = color;
  bump.style.clipPath = 'polygon(0% 0%, 100% 0%, 55% 100%, 45% 100%)';
  bump.style.zIndex = '1';
  markerDiv.appendChild(bump);

  markerDiv.style.pointerEvents = 'auto';
  
  markerDiv.addEventListener('mouseenter', () => {
    markerDiv.style.boxShadow = '0 8px 24px rgba(30,30,80,0.16)';
  });
  markerDiv.addEventListener('mouseleave', () => {
    markerDiv.style.boxShadow = '0 2px 8px rgba(50,40,80,0.08)';
  });

  return markerDiv;
}

// === Store DOM/custom marker references ===
const buildingMarkers = [];
const locationMarkers = [];

// === Create Building Markers (circular, scalable) ===
buildings.forEach(building => {
  const [lng, lat] = building.coords;
  const color = building.colour === 'yes' ? '#FF69B4' : '#192b4a';
  const marker = createCustomMarker(building.image, color);

  marker.dataset.lat = lat;
  marker.dataset.lng = lng;
  marker.classList.add('building-marker');

  marker.addEventListener('click', () => {
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

  markerLayer.appendChild(marker);
  buildingMarkers.push(marker);
});

// === Create Location Markers (with logic and circle) ===
locations.forEach(location => {
  const [lng, lat] = location.coords;
  const marker = createCustomMarker(location.image, '#87CEFA');
  marker.dataset.lat = lat;
  marker.dataset.lng = lng;
  marker.classList.add('location-marker');

  marker.addEventListener('click', () => {
    toggleBottomSheet(`
      <div style="text-align:center;">
        <h2>${location.name}</h2>
        <div style="color:#666;font-size:15px;margin-bottom:7px;">${location.description || ''}</div>
        ${location.image ? `<img src="${location.image}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;margin:12px auto;display:block;">` : ''}
      </div>
    `);
  });

  markerLayer.appendChild(marker);
  locationMarkers.push(marker);
});
// === Dynamically update marker positions & scaling ===

function updateMarkerPositionsAndSizes() {
  const mapRect = document.getElementById('map').getBoundingClientRect();
  const zoom = map.cameraDistance ? 17 - Math.log2(map.cameraDistance / 240) : 15; // crude zoom est

  // Function to convert coordinate to pixel relative to the map container
  function toPixel(lat, lng) {
    const coord = new mapkit.Coordinate(lat, lng);
    const point = map.convertCoordinateToPoint(coord);
    // Subtract the mapkitJS canvas offset if present
    return {
      x: point.x,
      y: point.y
    };
  }

  // Scale size based on zoom (match your old logic: grows with zoom, min=1, max reasonable)
  let markerSize = Math.max(1, Math.min(2 + (zoom - 13), 3.5)); // scale from 1em...3.5em ("em" in CSS)

  buildingMarkers.concat(locationMarkers).forEach(marker => {
    const lat = parseFloat(marker.dataset.lat);
    const lng = parseFloat(marker.dataset.lng);
    const {x, y} = toPixel(lat, lng);

    // Center marker
    marker.style.left = `calc(${x}px - ${markerSize/2}em)`;
    marker.style.top = `calc(${y}px - ${markerSize/2}em)`;
    marker.style.width = `${markerSize}em`;
    marker.style.height = `${markerSize}em`;

    // Scale bump
    const bump = marker.querySelector('.marker-bump');
    if (bump) {
      bump.style.width = `${markerSize*0.7}em`;
      bump.style.height = `${markerSize*0.18}em`;
    }
  });
}

// Update on region or zoom changes
map.addEventListener('region-change-end', updateMarkerPositionsAndSizes);
map.addEventListener('zoom-end', updateMarkerPositionsAndSizes);
map.addEventListener('scroll-end', updateMarkerPositionsAndSizes);
window.addEventListener('resize', updateMarkerPositionsAndSizes);
map.addEventListener('load', updateMarkerPositionsAndSizes);
setTimeout(updateMarkerPositionsAndSizes, 400); // Fallback for mapkit slow init

// === Bottom Sheet Modal logic (unchanged from before) ===

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

// === Font and marker CSS to support the look
const markerStyle = document.createElement('style');
markerStyle.innerHTML = `
  .custom-marker {
    cursor: pointer;
    transition: width 0.15s, height 0.15s;
    will-change: width, height, left, top;
  }
  .custom-marker img { pointer-events:none; }
  .marker-bump { transition: width 0.13s, height 0.13s; }
`;
document.head.appendChild(markerStyle);

// === After the map is ready, run initial update in case (hotfix for delayed mapkit)
setTimeout(updateMarkerPositionsAndSizes, 1500);


