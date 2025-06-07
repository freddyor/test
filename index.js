// Import statements
import { buildings } from './buildings.js';
import { locations } from './locations.js';

// Track when the loading screen is first shown
const loadingScreenStart = Date.now();

// --- First Video Popup additions START ---
let firstVideoLoadedThisSession = false;
function showFirstVideoWaitMessage(videoElement) {
}


const yorkBounds = [
  [-1.170, 53.930], // Southwest corner (lng, lat)
  [-1.010, 54.010]  // Northeast corner (lng, lat)
];

var map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=gYFEdggSAlArkAt4iOei',
    center: [-1.08643774070107, 53.95996305984138],
    zoom: 16,
    pitch: 45,
    bearing: -17.6,
    maxBounds: yorkBounds,
    minZoom: 11,
    maxZoom: 19,
});

    // Geolocate control and user location marker
    const geolocate = new maplibregl.GeolocateControl({
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

    const userLocationMarker = new maplibregl.Marker({element: userLocationEl})
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
    const marker = new maplibregl.Marker({
        element: markerElement
    })
    .setLngLat(location.coords)
    .addTo(map);

    marker.getElement().addEventListener('click', () => {
        map.getCanvas().style.cursor = 'pointer';
        const contentHTML = createPopupContent(location); // Use the existing function to create the content
        toggleBottomSheet(contentHTML);
    });
});

    buildings.forEach(building => {
        const outlineColor = building.colour === "yes" ? '#FF69B4' : '#FFFFFF';
        const { element: markerElement } = createCustomMarker(building.image, outlineColor, false);
        markerElement.className += ' building-marker';

        if (building.colour === "yes") markerElement.style.zIndex = '3';

        const marker = new maplibregl.Marker({element: markerElement})
            .setLngLat(building.coords)
            .addTo(map);

        marker.getElement().addEventListener('click', () => {
            map.getCanvas().style.cursor = 'pointer';
            const videoUrl = building.videoUrl;
            if (!videoUrl) {
                console.error('Video URL not available for this building.');
                return;
            }
            document.querySelectorAll('.video-modal-overlay').forEach(el => el.remove());
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
            closeBtn.onclick = () => overlay.remove();

            const videoElement = document.createElement('video');
            videoElement.style.border = '1.5px solid #E9E8E0';
            videoElement.style.maxWidth = '88vw';
            videoElement.style.maxHeight = '80vh';
            videoElement.style.borderRadius = '14px';
            videoElement.controls = true;
            videoElement.preload = 'auto';
            videoElement.autoplay = true;
            videoElement.setAttribute('playsinline', '');
            videoElement.setAttribute('webkit-playsinline', '');
            videoElement.playsInline = true;

            const source = document.createElement('source');
            source.src = videoUrl;
            source.type = 'video/mp4';
            videoElement.appendChild(source);

            videoElement.addEventListener('ended', () => overlay.remove());
            videoElement.addEventListener('error', () => {
                alert('Video failed to load.');
            });

            const videoContainer = document.createElement('div');
            videoContainer.style.position = 'relative';
            videoContainer.appendChild(videoElement);
            videoContainer.appendChild(closeBtn);

            overlay.appendChild(videoContainer);
            document.body.appendChild(overlay);

            overlay.addEventListener('mousedown', function(e) {
                if (e.target === overlay) overlay.remove();
            });
        });
    });

function scaleMarkersBasedOnZoom() {
    const zoomLevel = map.getZoom();
    const markerSize = (zoomLevel - 13) + 'em';
    document.querySelectorAll('.location-marker').forEach(marker => {
        marker.style.width = markerSize;
        marker.style.height = markerSize;
    });
    document.querySelectorAll('.building-marker').forEach(marker => {
        marker.style.width = markerSize;
        marker.style.height = markerSize;
    });
}


    scaleMarkersBasedOnZoom();

    // Map event listeners immediately
    map.on('click', (e) => {
        const currentLat = e.lngLat.lat;
        const currentLng = e.lngLat.lng;
        const currentZoom = map.getZoom();
        const mapLink = generateMapLink(currentLat, currentLng, currentZoom);
        console.log('Map Link:', mapLink);
    });
    map.on('zoom', () => scaleMarkersBasedOnZoom());

    // Only what requires style load
map.on('load', () => {
    geolocate.trigger();

    // Hide the loading screen after at least 5 seconds
    const loadingScreen = document.getElementById('loading-screen');
    const elapsed = Date.now() - loadingScreenStart;
    const minDuration = 5000; // 5 seconds

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
// Function to parse URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

const defaultCenter = [-1.0835104081554843, 53.95838745239521]; // Default York coordinates

const lat = getUrlParameter('lat');
const lng = getUrlParameter('lng');
const zoom = getUrlParameter('zoom');

const initialCenter = lat && lng ? [parseFloat(lng), parseFloat(lat)] : defaultCenter;
const initialZoom = zoom ? parseFloat(zoom) : 15; // Adjust defaultZoom as necessary

// Create a bottom sheet container
const bottomSheet = document.createElement('div');
bottomSheet.id = 'bottom-sheet';
bottomSheet.style.position = 'fixed';
bottomSheet.style.bottom = '-100%'; // Initially hidden
bottomSheet.style.left = '50%'; // Align to the left
bottomSheet.style.transform = 'translate(-50%)'; // Adjust position to align center both ways
bottomSheet.style.right = '50%';
bottomSheet.style.width = '96%';
bottomSheet.style.height = '40%'; // Adjust height as needed
bottomSheet.style.backgroundColor = '#fff';
bottomSheet.style.borderTop = '2px solid #ccc';
bottomSheet.style.boxShadow = '0 -6px 15px rgba(0, 0, 0, 0.3)';
bottomSheet.style.zIndex = '10000';
bottomSheet.style.transition = 'bottom 0.3s ease';
bottomSheet.style.borderRadius = '12px 12px 0 0'; // Matches the popup's border-radius
bottomSheet.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.3)'; // Matches the popup's shadow
bottomSheet.style.backgroundColor = '#E9E8E0'; // Matches popup background color
bottomSheet.style.border = '2px solid #f0f0f0'; // Matches popup border
bottomSheet.style.fontFamily = "'Poppins', sans-serif"; // Matches popup font-family
bottomSheet.style.fontSize = '14px'; // Matches popup font size
bottomSheet.style.lineHeight = '1.05'; // Matches popup line height
bottomSheet.style.padding = '5px'; // Matches popup padding
bottomSheet.style.overflowY = 'auto'; // Make it scrollable
document.body.appendChild(bottomSheet);

// Function to generate a URL with given coordinates and zoom
function generateMapLink(latitude, longitude, zoomLevel) {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = `?lat=${latitude}&lng=${longitude}&zoom=${zoomLevel}`;
    return baseUrl + params;
}

// Container for both buttons
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

// Create a <style> element to add the CSS
const stylePopup = document.createElement('style');

// Add the link to Google Fonts for Poppins
const link = document.createElement('link');
link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap";
link.rel = "stylesheet";
document.head.appendChild(link);

// Style for the popup and markers
stylePopup.innerHTML = `
  .maplibregl-popup-content {
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
    margin-bottom: 10px; /* Add this line */
  }
  .maplibregl-popup-content img {
    border: 2px solid #f0f0f0 !important;
    border-radius: 8px;
  }
  .maplibregl-popup-content p {
    font-weight: bold !important;
    text-align: center;
    letter-spacing: -0.5px;
    font-size: 13px !important;
    margin-bottom: 10px !important;
  }
  .maplibregl-popup-close-button {
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
  .maplibregl-popup {
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
`;

document.head.appendChild(stylePopup);

function createCustomMarker(imageUrl, color = '#9b4dca', isLocation = false) {
  const markerDiv = document.createElement('div');
  markerDiv.className = 'custom-marker';
  markerDiv.style.width = '3em';
  markerDiv.style.height = '3em';
  markerDiv.style.position = 'absolute';
  markerDiv.style.borderRadius = '50%';
  markerDiv.style.border = `0.15em solid ${color}`;
  markerDiv.style.boxSizing = 'border-box';
  markerDiv.style.overflow = 'hidden';

  const imageElement = document.createElement('img');
  imageElement.src = imageUrl;
  imageElement.style.width = '100%';
  imageElement.style.height = '100%';
  imageElement.style.objectFit = 'cover';
  imageElement.style.borderRadius = '50%';

  markerDiv.appendChild(imageElement);

  return {
    element: markerDiv,
    id: `marker-${Date.now()}-${Math.random()}`
  };
}

// Toggle functionality for the bottom sheet
let isBottomSheetOpen = false;

function toggleBottomSheet(contentHTML) {
    if (isBottomSheetOpen) {
        bottomSheet.style.bottom = '-100%'; // Hide
    } else {
        // Add a close button to the top-right corner of the content
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

        bottomSheet.innerHTML = closeButtonHTML + contentHTML; // Add close button + content
        bottomSheet.style.bottom = '0'; // Show

        // Attach event listener to the close button
        document.getElementById('close-bottom-sheet').addEventListener('click', () => {
            // Stop video playback
            const videoElement = document.querySelector('video'); // Adjust selector as needed
            if (videoElement) {
                videoElement.pause();
                videoElement.currentTime = 0; // Optional: Reset video to start
            }
            toggleBottomSheet(); // Close the popup
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
