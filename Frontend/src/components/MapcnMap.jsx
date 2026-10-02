import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';
import cebuBoundaries from '../data/cebu_boundaries.json';
import { PHILIPPINE_CITY_COORDINATES } from '../data/philippine_locations';
import { CEBU_CITY_COORDINATES } from '../data/cebu_locations';

/**
 * MapcnMap
 * A modern map component powered by MapLibre GL and OpenFreeMap.
 * Features:
 *   - Stable WebView lifecycle (no reloads on prop changes)
 *   - Preserves user zoom when pinning (zero unwanted zoom-out)
 *   - Prominent pin with place name badge and pulsing pinpoint ripple
 *   - Clean view with pin location and place name (no borders)
 */
export default function MapcnMap({
  center = [123.8854, 10.3157],
  zoom = 9,
  markers = [],
  activeLocation = '',
  pinnedBarangay = null,
  showPin = true,
  boundariesGeoJSON = cebuBoundaries,
  onMarkerPress,
  onSelectLocation,
  onPinBarangay,
  interactive = true,
  showControls = true,
  cardContainer = true,
  height = 260,
  style,
}) {
  const { isDarkMode } = useTheme();
  const webViewRef = useRef(null);
  const mapReadyRef = useRef(false);
  const pendingActionsRef = useRef([]);

  // Normalize center coordinates into [lng, lat]
  const centerCoords = Array.isArray(center)
    ? center
    : [center.lng ?? center.longitude ?? 123.8854, center.lat ?? center.latitude ?? 10.3157];

  // Helper to execute script immediately if map is ready, or queue until MAP_READY
  const injectOrQueue = useCallback((script) => {
    if (mapReadyRef.current && webViewRef.current) {
      webViewRef.current.injectJavaScript(script);
    } else {
      pendingActionsRef.current.push(script);
    }
  }, []);

  const flushPendingActions = useCallback(() => {
    mapReadyRef.current = true;
    if (webViewRef.current && pendingActionsRef.current.length > 0) {
      pendingActionsRef.current.forEach((script) => {
        webViewRef.current.injectJavaScript(script);
      });
      pendingActionsRef.current = [];
    }
  }, []);

  // Pan to center only when no barangay is pinned
  useEffect(() => {
    if (!pinnedBarangay) {
      const script = `
        if (window.map && !window.isBarangayPinned) {
          window.map.panTo(${JSON.stringify(centerCoords)}, {
            duration: 500,
            essential: true
          });
        }
        true;
      `;
      injectOrQueue(script);
    }
  }, [centerCoords[0], centerCoords[1], Boolean(pinnedBarangay), injectOrQueue]);

  // Pin exact barangay and pan smoothly without altering the current zoom level
  useEffect(() => {
    if (pinnedBarangay && pinnedBarangay.lat && pinnedBarangay.lng) {
      const script = `
        if (typeof window.setPinnedBarangay === 'function') {
          window.setPinnedBarangay(${JSON.stringify(pinnedBarangay)});
        } else {
          window.pendingPin = ${JSON.stringify(pinnedBarangay)};
        }
        true;
      `;
      injectOrQueue(script);
    } else if (!pinnedBarangay) {
      const script = `
        if (typeof window.removeActivePin === 'function') {
          window.removeActivePin();
        }
        true;
      `;
      injectOrQueue(script);
    }
  }, [pinnedBarangay?.lat, pinnedBarangay?.lng, pinnedBarangay?.formattedTitle, injectOrQueue]);

  // Update active boundary and zoom to place
  useEffect(() => {
    if (activeLocation) {
      const script = `
        if (typeof window.applyActiveBoundary === 'function') {
          window.applyActiveBoundary(${JSON.stringify(activeLocation)}, true);
        } else {
          window.pendingActiveLocation = ${JSON.stringify(activeLocation)};
        }
        true;
      `;
      injectOrQueue(script);
    }
  }, [activeLocation, injectOrQueue]);

  // Push updated barangay markers into webview when markers change
  useEffect(() => {
    if (Array.isArray(markers)) {
      const standardized = markers.map((m, idx) => ({
        id: m.id ?? idx,
        name: m.name || m.title || 'Location',
        barangay: m.barangay || '',
        city: m.city || '',
        lat: Number(m.lat ?? m.latitude ?? 0),
        lng: Number(m.lng ?? m.longitude ?? 0),
        subtitle: m.subtitle || m.desc || '',
        active: Boolean(m.active),
        isBarangay: Boolean(m.isBarangay || m.barangay),
      }));
      const script = `
        if (typeof window.updateBarangayMarkers === 'function') {
          window.updateBarangayMarkers(${JSON.stringify(standardized)});
        }
        true;
      `;
      injectOrQueue(script);
    }
  }, [markers, injectOrQueue]);

  const bgColor = '#F8FAFC';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  // Memoize HTML content so the WebView NEVER reloads on state changes
  const htmlContent = useMemo(() => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
      <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { 
          width: 100%; 
          height: 100%; 
          overflow: hidden; 
          background: ${bgColor}; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        }
        #map { width: 100%; height: 100%; }
        #map .maplibregl-canvas {
          filter: saturate(1.25) contrast(1.05);
        }

        /* ── Modern Zoom Controls (+ and -) ── */
        .maplibregl-ctrl-top-right {
          top: 12px !important;
          right: 12px !important;
        }
        .maplibregl-ctrl-group {
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)'} !important;
          backdrop-filter: blur(14px) !important;
          -webkit-backdrop-filter: blur(14px) !important;
          border: 1.5px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'} !important;
          border-radius: 14px !important;
          box-shadow: 0 6px 22px rgba(0, 0, 0, ${isDarkMode ? '0.4' : '0.14'}) !important;
          overflow: hidden !important;
          margin: 0 !important;
        }
        .maplibregl-ctrl-group button {
          width: 38px !important;
          height: 38px !important;
          border: none !important;
          background: transparent !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          outline: none !important;
          transition: background 0.15s ease !important;
        }
        .maplibregl-ctrl-group button:active {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'} !important;
        }
        .maplibregl-ctrl-group button + button {
          border-top: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'} !important;
        }
        .maplibregl-ctrl-zoom-in .maplibregl-ctrl-icon {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='${isDarkMode ? '%23F8FAFC' : '%230F172A'}' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='12' y1='5' x2='12' y2='19'%3E%3C/line%3E%3Cline x1='5' y1='12' x2='19' y2='12'%3E%3C/line%3E%3C/svg%3E") !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          width: 100% !important;
          height: 100% !important;
          opacity: 1 !important;
        }
        .maplibregl-ctrl-zoom-out .maplibregl-ctrl-icon {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='${isDarkMode ? '%23F8FAFC' : '%230F172A'}' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='5' y1='12' x2='19' y2='12'%3E%3C/line%3E%3C/svg%3E") !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          width: 100% !important;
          height: 100% !important;
          opacity: 1 !important;
        }
        .maplibregl-ctrl-compass, .mapboxgl-ctrl-compass { display: none !important; }

        /* ── Modern MapPin Marker ── */
        .mapcn-mappin-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          cursor: pointer;
          user-select: none;
          z-index: 9999;
          animation: pinDrop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes pinDrop {
          0% {
            opacity: 0;
            transform: translateY(-22px) scale(0.6);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .mapcn-mappin-pin {
          width: 42px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mapcn-mappin-pin:hover {
          transform: scale(1.1);
        }

        /* ── EXACT RED PINPOINT DOT & PULSE AT THE BOTTOM OF THE PIN ── */
        .mapcn-exact-pinpoint-red-dot {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 14px;
          background-color: #DC2626;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.6), 0 3px 8px rgba(0, 0, 0, 0.6);
          z-index: 10001;
        }
        .mapcn-exact-pinpoint-pulse {
          position: absolute;
          bottom: -16px;
          left: 50%;
          transform: translateX(-50%);
          width: 34px;
          height: 34px;
          border: 2.5px solid #EF4444;
          border-radius: 50%;
          animation: redPinpointPulse 1.8s infinite ease-out;
          pointer-events: none;
          z-index: 10000;
        }
        @keyframes redPinpointPulse {
          0% { transform: translateX(-50%) scale(0.3); opacity: 1; }
          100% { transform: translateX(-50%) scale(1.6); opacity: 0; }
        }

        /* ── Municipality / Barangay Popup Badge ── */
        .maplibregl-popup.mapcn-single-popup {
          z-index: 10050;
        }
        .maplibregl-popup.mapcn-single-popup .maplibregl-popup-content {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          border: none !important;
        }
        .maplibregl-popup.mapcn-single-popup .maplibregl-popup-tip {
          border-top-color: ${isDarkMode ? '#0F172A' : '#FFFFFF'} !important;
          margin-bottom: -1px;
        }
        .mapcn-popup-card {
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)'};
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: ${isDarkMode ? '#F8FAFC' : '#0F172A'};
          border: 1.5px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'};
          border-radius: 9999px;
          padding: 6px 14px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          animation: popupFade 0.25s ease-out;
        }
        @keyframes popupFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mapcn-popup-name {
          font-size: 13px;
          font-weight: 800;
          color: ${isDarkMode ? '#F8FAFC' : '#0F172A'};
          letter-spacing: -0.2px;
          line-height: 1.2;
        }
        .mapcn-popup-pinned {
          border-left: 3px solid #EF4444 !important;
        }
        .mapcn-popup-pinned-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #EF4444;
          margin-right: 6px;
          flex-shrink: 0;
        }

        /* ── Hidden Attributions ── */
        .mapcn-watermark,
        .maplibregl-ctrl-attrib,
        .maplibregl-ctrl-bottom-right,
        .mapboxgl-ctrl-attrib,
        .mapboxgl-ctrl-bottom-right { 
          display: none !important; 
        }

        /* ── Exact Barangay Red Dot Pinpoint ── */
        .mapcn-barangay-dot-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          user-select: none;
          transform: translate(-50%, -50%);
          z-index: 25;
          transition: transform 0.15s ease-out;
        }
        .mapcn-barangay-dot-marker:hover {
          transform: translate(-50%, -50%) scale(1.22);
          z-index: 35;
        }
        .mapcn-red-dot-core {
          width: 14px;
          height: 14px;
          background-color: #EF4444;
          border: 2.5px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 0 2.5px rgba(239, 68, 68, 0.45), 0 2px 7px rgba(0, 0, 0, 0.42);
          position: relative;
        }
        .mapcn-red-dot-pulse {
          position: absolute;
          top: -6px;
          left: -6px;
          width: 26px;
          height: 26px;
          border: 1.5px solid rgba(239, 68, 68, 0.65);
          border-radius: 50%;
          animation: redPulse 2.2s infinite ease-out;
          pointer-events: none;
        }
        @keyframes redPulse {
          0% { transform: scale(0.7); opacity: 0.95; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        .mapcn-barangay-label {
          font-size: 10px;
          font-weight: 800;
          color: ${isDarkMode ? '#F8FAFC' : '#0F172A'};
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)'};
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)'};
          padding: 1px 6px;
          border-radius: 6px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.22);
          white-space: nowrap;
          margin-top: 3px;
          pointer-events: none;
        }

        /* ── Modern Zoom In / Out Controls ── */
        .maplibregl-ctrl-top-right {
          top: 10px !important;
          right: 10px !important;
          z-index: 50 !important;
        }
        .maplibregl-ctrl-group {
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.96)'} !important;
          border: 1.2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)'} !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.20) !important;
          overflow: hidden !important;
        }
        .maplibregl-ctrl-group button {
          width: 32px !important;
          height: 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .maplibregl-ctrl-group button + button {
          border-top: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'} !important;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>

      <script>
        var mapStyle = ${isDarkMode ? "'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'" : "'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'"};

        var map = new maplibregl.Map({
          container: 'map',
          style: mapStyle,
          center: [123.8854, 10.3157],
          zoom: 9,
          pitch: 0,
          bearing: 0,
          interactive: ${interactive},
          attributionControl: false
        });
        window.map = map;

        if (${showControls}) {
          map.addControl(new maplibregl.NavigationControl({
            showCompass: false,
            showZoom: true,
            visualizePitch: false
          }), 'top-right');
        }

        function enhanceMapColors() {
          try {
            var layers = map.getStyle().layers || [];
            var waterLayers = ['water', 'water-intermittent'];
            waterLayers.forEach(function(id) {
              if (map.getLayer(id)) {
                map.setPaintProperty(id, 'fill-color', '#38BDF8');
                map.setPaintProperty(id, 'fill-opacity', 0.95);
              }
            });

            var waterwayLayers = ['waterway-river', 'waterway-stream-canal', 'waterway-other', 'waterway_river'];
            waterwayLayers.forEach(function(id) {
              if (map.getLayer(id)) {
                map.setPaintProperty(id, 'line-color', '#0284C7');
              }
            });

            var parkLayers = ['park', 'landcover-grass', 'landcover-grass-park', 'landcover_grass', 'park_outline'];
            parkLayers.forEach(function(id) {
              if (map.getLayer(id)) {
                if (map.getLayer(id).type === 'fill') {
                  map.setPaintProperty(id, 'fill-color', '#86EFAC');
                  map.setPaintProperty(id, 'fill-opacity', 0.65);
                } else if (map.getLayer(id).type === 'line') {
                  map.setPaintProperty(id, 'line-color', '#4ADE80');
                }
              }
            });

            var yellowStreetLayerIds = [
              'highway-primary', 'highway-trunk', 'highway-secondary-tertiary',
              'highway-motorway', 'highway-motorway-link', 'highway-link',
              'road_trunk_primary', 'road_secondary_tertiary', 'road_motorway',
              'road_motorway_link', 'road_link'
            ];
            yellowStreetLayerIds.forEach(function(id) {
              if (map.getLayer(id)) {
                map.setPaintProperty(id, 'line-color', '#FFFFFF');
              }
            });
          } catch(err) {
            console.warn('Error enhancing map colors:', err);
          }
        }

        // Active State Variables
        var markersData = [];
        var activePinMarker = null;
        var barangayMarkerElements = [];
        var isBarangayPinned = false;
        window.isBarangayPinned = false;
        window.currentPinnedBarangay = null;
        var boundariesData = ${JSON.stringify(boundariesGeoJSON || null)};
        var currentActiveLocation = ${JSON.stringify(activeLocation || '')};
        window.CEBU_COORDS = ${JSON.stringify(CEBU_CITY_COORDINATES || {})};
        window.PHIL_COORDS = ${JSON.stringify(PHILIPPINE_CITY_COORDINATES || {})};

        function clearCityHighlight() {
          // No boundary polygons rendered
        }
        window.clearCityHighlight = clearCityHighlight;

        function updateBarangayMarkers(newList) {
          // Keep map clean: remove all background pins on individual barangays
          barangayMarkerElements.forEach(function(m) {
            try { m.remove(); } catch(_) {}
          });
          barangayMarkerElements = [];
        }
        window.updateBarangayMarkers = updateBarangayMarkers;

        function isCodeString(s) {
          if (!s || typeof s !== 'string') return true;
          var t = s.trim();
          return t.indexOf('+') !== -1 || /^\d+(\.\d+)?[,\s]+\d+(\.\d+)?$/.test(t) || /^\d{3,6}$/.test(t) || (/^[A-Z0-9]{3,8}$/.test(t) && /\d/.test(t));
        }

        var isPinEnabled = true;

        function showActivePin(title, lngLat) {
          if (!lngLat || typeof lngLat[0] !== 'number' || typeof lngLat[1] !== 'number') return;

          var displayTitle = title || 'Selected Location';
          if (isCodeString(displayTitle)) {
            displayTitle = 'Selected Location';
          }

          if (activePinMarker) {
            try { activePinMarker.remove(); } catch(_) {}
            activePinMarker = null;
          }

          var el = document.createElement('div');
          el.className = 'mapcn-mappin-wrapper';
          el.innerHTML = [
            '<div class="mapcn-mappin-pin">',
              '<svg width="42" height="52" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">',
                '<defs>',
                  '<linearGradient id="activeRedPinGrad" x1="0%" y1="0%" x2="0%" y2="100%">',
                    '<stop offset="0%" stop-color="#EF4444"/>',
                    '<stop offset="100%" stop-color="#B91C1C"/>',
                  '</linearGradient>',
                  '<filter id="pinShadow" x="-30%" y="-15%" width="160%" height="160%">',
                    '<feDropShadow dx="0" dy="3.5" stdDeviation="3.2" flood-color="rgba(0,0,0,0.5)"/>',
                  '</filter>',
                '</defs>',
                '<path d="M12 25C17.5 19.5 21 15 21 11a9 9 0 1 0-18 0c0 4 3.5 8.5 9 14z" fill="url(#activeRedPinGrad)" stroke="#FFFFFF" stroke-width="1.8" filter="url(#pinShadow)"/>',
                '<circle cx="12" cy="11" r="5" fill="#FFFFFF"/>',
                '<circle cx="12" cy="11" r="2.8" fill="#DC2626"/>',
              '</svg>',
            '</div>',
            '<div class="mapcn-exact-pinpoint-pulse"></div>',
            '<div class="mapcn-exact-pinpoint-red-dot"></div>'
          ].join('');

          var popupContent = [
            '<div class="mapcn-popup-card mapcn-popup-pinned">',
              '<div class="mapcn-popup-pinned-dot"></div>',
              '<div class="mapcn-popup-name">' + displayTitle + '</div>',
            '</div>'
          ].join('');

          var popup = new maplibregl.Popup({
            offset: [0, -50],
            closeButton: false,
            closeOnClick: false,
            className: 'mapcn-single-popup'
          }).setHTML(popupContent);

          activePinMarker = new maplibregl.Marker({ 
            element: el,
            anchor: 'bottom'
          })
            .setLngLat(lngLat)
            .setPopup(popup)
            .addTo(map);

          try {
            if (!activePinMarker.getPopup().isOpen()) {
              activePinMarker.togglePopup();
            }
          } catch(_) {}

          el.addEventListener('click', function(e) {
            e.stopPropagation();
            if (activePinMarker && activePinMarker.getPopup() && !activePinMarker.getPopup().isOpen()) {
              activePinMarker.togglePopup();
            }
          });
        }
        window.showActivePin = showActivePin;

        function setPinnedBarangay(data) {
          if (!data || typeof data.lat !== 'number' || typeof data.lng !== 'number') return;
          window.currentPinnedBarangay = data;
          isBarangayPinned = true;
          window.isBarangayPinned = true;

          var title = '';
          if (data.barangay && !isCodeString(data.barangay)) {
            title = 'Brgy. ' + data.barangay + (data.city ? (', ' + data.city) : '');
          } else if (data.formattedTitle && !isCodeString(data.formattedTitle)) {
            title = data.formattedTitle;
          } else if (data.name && !isCodeString(data.name)) {
            title = data.name;
          } else {
            title = 'Pinned Location';
          }

          showActivePin(title, [data.lng, data.lat]);

          if (window.map) {
            window.map.panTo([data.lng, data.lat], {
              duration: 500,
              essential: true
            });
          }
        }
        window.setPinnedBarangay = setPinnedBarangay;

        function removeActivePin() {
          isBarangayPinned = false;
          window.isBarangayPinned = false;
          window.currentPinnedBarangay = null;
          if (activePinMarker) {
            try { activePinMarker.remove(); } catch(_) {}
            activePinMarker = null;
          }
        }
        window.removeActivePin = removeActivePin;

        function initBoundaries() {
          if (!map || !map.getSource) return;
          try {
            // Invisible Cebu boundaries layer purely for tap detection
            if (boundariesData && !map.getSource('cebu-boundaries')) {
              map.addSource('cebu-boundaries', {
                type: 'geojson',
                data: boundariesData
              });

              if (!map.getLayer('cebu-boundaries-all-fill')) {
                map.addLayer({
                  id: 'cebu-boundaries-all-fill',
                  type: 'fill',
                  source: 'cebu-boundaries',
                  paint: {
                    'fill-color': '#000000',
                    'fill-opacity': 0.0001
                  }
                });
              }

              // Click listener for tapping directly on any municipality polygon
              map.on('click', 'cebu-boundaries-all-fill', function(e) {
                if (e.features && e.features[0] && e.features[0].properties) {
                  var props = e.features[0].properties;
                  var clickedCity = props.name || props.original_name || props.NAME_2;
                  if (clickedCity) {
                    applyActiveBoundary(clickedCity, true);
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'BOUNDARY_CLICK',
                        name: clickedCity
                      }));
                    }
                  }
                }
              });

              map.on('mouseenter', 'cebu-boundaries-all-fill', function() {
                map.getCanvas().style.cursor = 'pointer';
              });
              map.on('mouseleave', 'cebu-boundaries-all-fill', function() {
                map.getCanvas().style.cursor = '';
              });
            }
          } catch(err) {
            console.warn('Error initializing boundaries:', err);
          }
        }

        function applyActiveBoundary(name, shouldFly) {
          if (!name) return;
          currentActiveLocation = name;

          // Clear prior pinned barangay state if selecting a city
          if (shouldFly) {
            isBarangayPinned = false;
            window.isBarangayPinned = false;
            window.currentPinnedBarangay = null;
          }

          initBoundaries();

          try {
            var cleanInput = (name || '')
              .toLowerCase()
              .replace(/\s*\(camotes\)/g, '')
              .replace(/^city of\s+/g, '')
              .replace(/\s+city$/g, '')
              .replace(/^municipality of\s+/g, '')
              .replace(/,\s*(cebu|philippines).*$/g, '')
              .trim();

            var targetCoord = null;
            var matchedName = name;

            // 1. Resolve from Cebu Coordinates first (exact precision)
            if (window.CEBU_COORDS) {
              if (window.CEBU_COORDS[name]) {
                targetCoord = window.CEBU_COORDS[name];
                matchedName = name;
              } else {
                var cKey = Object.keys(window.CEBU_COORDS).find(function(k) {
                  var lk = k.toLowerCase().replace(/\s*\(camotes\)/g, '').replace(/\s+city$/g, '').trim();
                  return lk === cleanInput || lk.indexOf(cleanInput) !== -1 || cleanInput.indexOf(lk) !== -1;
                });
                if (cKey) {
                  targetCoord = window.CEBU_COORDS[cKey];
                  matchedName = cKey;
                }
              }
            }

            // 2. Resolve from Cebu GeoJSON boundary bbox centroid
            if (!targetCoord && boundariesData && boundariesData.features) {
              var targetFeature = boundariesData.features.find(function(f) {
                if (!f.properties) return false;
                var fName = (f.properties.name || '').toLowerCase();
                var fOrig = (f.properties.original_name || '').toLowerCase();
                var fName2 = (f.properties.NAME_2 || '').toLowerCase();
                var fCleanName = fName.replace(/\s*\(camotes\)/g, '').replace(/\s+city$/g, '').trim();
                var fCleanOrig = fOrig.replace(/\s*\(camotes\)/g, '').replace(/\s+city$/g, '').trim();

                return (
                  fName === name.toLowerCase() ||
                  fOrig === name.toLowerCase() ||
                  fName2 === name.toLowerCase() ||
                  fCleanName === cleanInput ||
                  fCleanOrig === cleanInput ||
                  (cleanInput.length >= 3 && fName.indexOf(cleanInput) !== -1) ||
                  (cleanInput.length >= 3 && cleanInput.indexOf(fCleanName) !== -1)
                );
              });

              if (targetFeature && targetFeature.properties) {
                matchedName = targetFeature.properties.name || targetFeature.properties.original_name || targetFeature.properties.NAME_2 || name;
                if (targetFeature.properties.bbox) {
                  var bb = targetFeature.properties.bbox;
                  targetCoord = {
                    lng: (bb[0] + bb[2]) / 2,
                    lat: (bb[1] + bb[3]) / 2
                  };
                }
              }
            }

            // 3. Resolve from Philippine City Coordinates
            if (!targetCoord && window.PHIL_COORDS) {
              if (window.PHIL_COORDS[name]) {
                targetCoord = window.PHIL_COORDS[name];
                matchedName = name;
              } else {
                var pKey = Object.keys(window.PHIL_COORDS).find(function(k) {
                  var lk = k.toLowerCase().replace(/\s+city$/g, '').trim();
                  return lk === cleanInput || lk.indexOf(cleanInput) !== -1 || cleanInput.indexOf(lk) !== -1;
                });
                if (pKey) {
                  targetCoord = window.PHIL_COORDS[pKey];
                  matchedName = pKey;
                }
              }
            }

            // If coordinate found: show Pin and Place Name, fly smoothly
            if (targetCoord && typeof targetCoord.lat === 'number' && typeof targetCoord.lng === 'number') {
              showActivePin(matchedName, [targetCoord.lng, targetCoord.lat]);

              if (shouldFly && window.map) {
                map.flyTo({
                  center: [targetCoord.lng, targetCoord.lat],
                  zoom: 12.8,
                  duration: 850,
                  essential: true
                });
              }
            }
          } catch(err) {
            console.warn('Error applying active location pin:', err);
          }
        }
        window.applyActiveBoundary = applyActiveBoundary;

        map.on('click', function(e) {
          var lng = e.lngLat.lng;
          var lat = e.lngLat.lat;

          if (isPinEnabled) {
            isBarangayPinned = true;
            window.isBarangayPinned = true;
            clearCityHighlight();
            showActivePin('📍 Pinning location...', [lng, lat]);
          }

          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MAP_TAP_COORDS',
              lng: lng,
              lat: lat
            }));
          }
        });

        function onMapReady() {
          enhanceMapColors();
          initBoundaries();

          // Check if there is a pending pin from React Native
          if (window.pendingPin) {
            setPinnedBarangay(window.pendingPin);
            window.pendingPin = null;
          } else if (window.pendingActiveLocation) {
            applyActiveBoundary(window.pendingActiveLocation, true);
            window.pendingActiveLocation = null;
          } else if (currentActiveLocation && !isBarangayPinned) {
            applyActiveBoundary(currentActiveLocation, true);
          }

          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
          }
        }

        if (map.isStyleLoaded()) {
          onMapReady();
        } else {
          map.once('load', onMapReady);
          map.once('style.load', onMapReady);
        }


      </script>
    </body>
    </html>
    `;
  }, [isDarkMode, boundariesGeoJSON, interactive, showControls, showPin]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        flushPendingActions();
      } else if (data.type === 'MARKER_CLICK') {
        const target = data.name || data.id;
        if (onMarkerPress) onMarkerPress(target);
        if (onSelectLocation) onSelectLocation(target);
      } else if (data.type === 'BOUNDARY_CLICK') {
        if (onMarkerPress) onMarkerPress(data.name);
        if (onSelectLocation) onSelectLocation(data.name);
      } else if (data.type === 'MAP_TAP_COORDS') {
        if (onPinBarangay) {
          onPinBarangay({ lat: data.lat, lng: data.lng, name: data.name, barangay: data.barangay, city: data.city });
        } else if (data.name && onSelectLocation) {
          onSelectLocation(data.name);
        }
      }
    } catch (err) {
      if (onMarkerPress) {
        onMarkerPress(event.nativeEvent.data);
      }
    }
  };

  const containerStyle = [
    styles.baseContainer,
    cardContainer && styles.cardContainer,
    cardContainer && {
      borderColor,
      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
    },
    { height },
    style,
  ];

  return (
    <View style={containerStyle}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        scrollEnabled={false}
        overScrollMode="never"
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        onLoadEnd={() => {
          setTimeout(flushPendingActions, 400);
        }}
        style={styles.webView}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
            <ActivityIndicator size="small" color="#10B981" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
});
