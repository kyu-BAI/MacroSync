import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';
import cebuBoundaries from '../data/cebu_boundaries.json';

/**
 * MapcnMap
 * A modern map component powered by MapLibre GL and OpenFreeMap.
 * Features:
 *   - Vibrant 2D Bright Map (full colors: blue oceans, green parks, crisp roads)
 *   - Immersive 3D Liberty Map (3D building extrusions & 60° tilt)
 *   - Sleek Apple/Google Maps-style [ 2D | 3D ] pill toggle
 *   - MapMarker, MarkerContent, MarkerTooltip, and MarkerPopup
 *   - Municipality & City Boundary Polygons (with interactive highlights)
 *   - 100% Free & Open-source (Zero API keys required)
 *
 * Props:
 *   center: [lng, lat] or { lat, lng } (default: [123.8854, 10.3157])
 *   zoom: number (default: 9)
 *   markers: Array<{ id, name, title, lat, lng, latitude, longitude, subtitle, desc, active }>
 *   activeLocation?: string (selected municipality/city name to highlight boundary)
 *   boundariesGeoJSON?: object (custom GeoJSON boundaries, defaults to all 53 Cebu LGUs)
 *   onMarkerPress?: (id: string | number) => void
 *   onSelectLocation?: (name: string) => void
 *   interactive?: boolean (default: true)
 *   showControls?: boolean (default: true)
 *   cardContainer?: boolean (default: true)
 *   height?: number | string (default: 260)
 *   style?: object
 */
export default function MapcnMap({
  center = [123.8854, 10.3157],
  zoom = 9,
  markers = [],
  activeLocation = '',
  pinnedBarangay = null,
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

  // Normalize center coordinates into [lng, lat]
  const centerCoords = Array.isArray(center)
    ? center
    : [center.lng ?? center.longitude ?? 123.8854, center.lat ?? center.latitude ?? 10.3157];

  // Pan to new center when updated from React Native (maintains current zoom level)
  useEffect(() => {
    if (webViewRef.current && centerCoords) {
      const script = `
        if (window.map) {
          window.map.panTo(${JSON.stringify(centerCoords)}, {
            duration: 600,
            essential: true
          });
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [centerCoords[0], centerCoords[1]]);

  // Pin exact barangay and pan without zooming in when pinnedBarangay changes
  useEffect(() => {
    if (webViewRef.current && pinnedBarangay && pinnedBarangay.lat && pinnedBarangay.lng) {
      const title = pinnedBarangay.formattedTitle || pinnedBarangay.name || 'Pinned Barangay';
      const script = `
        if (typeof clearCityHighlight === 'function') {
          clearCityHighlight();
        }
        if (typeof showActivePin === 'function') {
          showActivePin(${JSON.stringify(title)}, [${pinnedBarangay.lng}, ${pinnedBarangay.lat}]);
        }
        if (window.map) {
          window.map.panTo([${pinnedBarangay.lng}, ${pinnedBarangay.lat}], {
            duration: 600,
            essential: true
          });
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    } else if (webViewRef.current && !pinnedBarangay) {
      const script = `
        if (typeof isBarangayPinned !== 'undefined') {
          isBarangayPinned = false;
        }
        if (typeof removeActivePin === 'function') {
          removeActivePin();
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [pinnedBarangay?.lat, pinnedBarangay?.lng, pinnedBarangay?.formattedTitle]);

  // Highlight active boundary polygon and fitBounds when activeLocation changes ONLY IF no barangay is pinned
  useEffect(() => {
    if (webViewRef.current && activeLocation && !pinnedBarangay) {
      const script = `
        if (typeof applyActiveBoundary === 'function') {
          applyActiveBoundary(${JSON.stringify(activeLocation)}, true);
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [activeLocation, Boolean(pinnedBarangay)]);

  // Push updated barangay markers into webview when markers change
  useEffect(() => {
    if (webViewRef.current && Array.isArray(markers)) {
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
        if (typeof updateBarangayMarkers === 'function') {
          updateBarangayMarkers(${JSON.stringify(standardized)});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [markers]);

  const bgColor = '#F8FAFC';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  // Standardize markers array
  const formattedMarkers = markers.map((m, idx) => ({
    id: m.id ?? idx,
    name: m.name || m.title || 'Location',
    lat: Number(m.lat ?? m.latitude ?? 0),
    lng: Number(m.lng ?? m.longitude ?? 0),
    subtitle: m.subtitle || m.desc || '',
    active: Boolean(m.active),
  }));

  const htmlContent = `
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

        /* ── Improved Modern Zoom Controls (+ and -) ── */
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
          transition: background 0.15s ease, transform 0.1s ease !important;
          padding: 0 !important;
        }
        .maplibregl-ctrl-group button:active {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)'} !important;
          transform: scale(0.92) !important;
        }
        .maplibregl-ctrl-group button + button {
          border-top: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'} !important;
        }
        .maplibregl-ctrl-zoom-in .maplibregl-ctrl-icon {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='${isDarkMode ? '%23F8FAFC' : '%230F172A'}' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='12' y1='5' x2='12' y2='19'%3E%3C/line%3E%3Cline x1='5' y1='12' x2='19' y2='12'%3E%3C/line%3E%3C/svg%3E") !important;
          background-size: 18px 18px !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          width: 100% !important;
          height: 100% !important;
          opacity: 1 !important;
        }
        .maplibregl-ctrl-zoom-out .maplibregl-ctrl-icon {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='${isDarkMode ? '%23F8FAFC' : '%230F172A'}' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='5' y1='12' x2='19' y2='12'%3E%3C/line%3E%3C/svg%3E") !important;
          background-size: 18px 18px !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          width: 100% !important;
          height: 100% !important;
          opacity: 1 !important;
        }
        /* Completely remove compass / reset-bearing button below +- */
        .maplibregl-ctrl-compass,
        .mapboxgl-ctrl-compass {
          display: none !important;
        }

        /* ── Modern MapPin Marker ── */
        .mapcn-mappin-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          user-select: none;
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
          width: 34px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mapcn-mappin-pin:hover {
          transform: scale(1.1);
        }

        /* ── Municipality Name Popup Badge ── */
        .maplibregl-popup.mapcn-single-popup {
          z-index: 50;
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
        .mapcn-exact-pinpoint-red-dot {
          position: absolute;
          bottom: -7px;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 14px;
          background-color: #EF4444;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.55), 0 3px 8px rgba(0, 0, 0, 0.5);
          z-index: 25;
        }
        .mapcn-exact-pinpoint-pulse {
          position: absolute;
          bottom: -17px;
          left: 50%;
          transform: translateX(-50%);
          width: 34px;
          height: 34px;
          border: 2.5px solid #EF4444;
          border-radius: 50%;
          animation: redPinpointPulse 1.8s infinite ease-out;
          pointer-events: none;
          z-index: 10;
        }
        @keyframes redPinpointPulse {
          0% { transform: translateX(-50%) scale(0.3); opacity: 1; }
          100% { transform: translateX(-50%) scale(1.6); opacity: 0; }
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
      </style>
    </head>
    <body>
      <div id="map"></div>

      <script>
        // Map Style: CARTO Voyager (Light) / Dark Matter (Dark)
        var mapStyle = ${isDarkMode ? "'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'" : "'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'"};

        var map = new maplibregl.Map({
          container: 'map',
          style: mapStyle,
          center: ${JSON.stringify(centerCoords)},
          zoom: ${zoom},
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

        // Enrich map colors: deepen water, lush green parks, crisp high-contrast roads, and remove pale look
        function enhanceMapColors() {
          try {
            var layers = map.getStyle().layers || [];

            // 1. Enrich Water: replace washed out pale grayish blue with rich vibrant azure
            var waterLayers = ['water', 'water-intermittent'];
            waterLayers.forEach(function(id) {
              if (map.getLayer(id)) {
                map.setPaintProperty(id, 'fill-color', '#38BDF8');
                map.setPaintProperty(id, 'fill-opacity', 0.95);
              }
            });

            var waterwayLayers = [
              'waterway-river', 'waterway-stream-canal', 'waterway-other', 
              'waterway_river', 'waterway_other', 'waterway_tunnel'
            ];
            waterwayLayers.forEach(function(id) {
              if (map.getLayer(id)) {
                map.setPaintProperty(id, 'line-color', '#0284C7');
              }
            });

            // 2. Enrich Greenery & Parks: replace washed out pale olive with rich vibrant emerald
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

            var woodLayers = ['landcover-wood', 'landcover_wood'];
            woodLayers.forEach(function(id) {
              if (map.getLayer(id)) {
                map.setPaintProperty(id, 'fill-color', '#4ADE80');
                map.setPaintProperty(id, 'fill-opacity', 0.55);
              }
            });

            // 3. Clean Modern Canvas: replace dull grayish beige with clean modern slate canvas
            if (map.getLayer('background')) {
              map.setPaintProperty('background', 'background-color', '#F1F5F9');
            }

            // 4. Roads: Remove Yellow Traffic Colors & Ensure Crisp High-Contrast White Roads
            var yellowStreetLayerIds = [
              'highway-primary', 'highway-trunk', 'highway-secondary-tertiary', 'highway-link',
              'highway-motorway', 'highway-motorway-link',
              'road_trunk_primary', 'road_secondary_tertiary', 'road_link',
              'road_motorway', 'road_motorway_link',
              'tunnel-secondary-tertiary', 'tunnel-trunk-primary', 'tunnel-link',
              'tunnel-motorway', 'tunnel-motorway-link',
              'tunnel_secondary_tertiary', 'tunnel_trunk_primary', 'tunnel_link',
              'tunnel_motorway', 'tunnel_motorway_link',
              'bridge-secondary-tertiary', 'bridge-trunk-primary', 'bridge-link',
              'bridge-motorway', 'bridge-motorway-link',
              'bridge_secondary_tertiary', 'bridge_trunk_primary', 'bridge_link',
              'bridge_motorway', 'bridge_motorway_link'
            ];

            // Casing layers: give them crisp modern slate outlines so roads pop with clarity
            var yellowCasingLayerIds = [
              'highway-primary-casing', 'highway-trunk-casing', 'highway-secondary-tertiary-casing',
              'highway-motorway-casing', 'highway-motorway-link-casing', 'highway-link-casing',
              'road_trunk_primary_casing', 'road_secondary_tertiary_casing', 'road_motorway_casing',
              'road_motorway_link_casing', 'road_link_casing',
              'tunnel-primary-casing', 'tunnel-trunk-primary-casing', 'tunnel-secondary-tertiary-casing',
              'tunnel-motorway-casing', 'tunnel-motorway-link-casing', 'tunnel-link-casing',
              'tunnel_trunk_primary_casing', 'tunnel_secondary_tertiary_casing', 'tunnel_motorway_casing',
              'tunnel_motorway_link_casing', 'tunnel_link_casing',
              'bridge-trunk-primary-casing', 'bridge-secondary-tertiary-casing', 'bridge-motorway-casing',
              'bridge-motorway-link-casing', 'bridge-link-casing',
              'bridge_trunk_primary_casing', 'bridge_secondary_tertiary_casing', 'bridge_motorway_casing',
              'bridge_motorway_link_casing', 'bridge_link_casing'
            ];

            // Pure clean crisp white road surface
            yellowStreetLayerIds.forEach(function(id) {
              if (map.getLayer(id)) {
                map.setPaintProperty(id, 'line-color', '#FFFFFF');
              }
            });

            // Crisp defined road border casing
            yellowCasingLayerIds.forEach(function(id) {
              if (map.getLayer(id)) {
                map.setPaintProperty(id, 'line-color', '#94A3B8');
              }
            });

            // Minor streets casing
            var minorCasingIds = ['highway-minor-casing', 'road_minor_casing', 'tunnel-minor-casing', 'bridge-minor-casing'];
            minorCasingIds.forEach(function(id) {
              if (map.getLayer(id)) {
                map.setPaintProperty(id, 'line-color', '#CBD5E1');
              }
            });

            // Scan any remaining transportation line layers with yellow/orange
            layers.forEach(function(l) {
              if (l.type === 'line' && (l['source-layer'] === 'transportation')) {
                var color = map.getPaintProperty(l.id, 'line-color');
                if (typeof color === 'string') {
                  var c = color.toLowerCase();
                  if (c === '#fea' || c === '#fff4c6' || c === '#ffdaa6' || c === '#fc8' || c.indexOf('hsl(26') !== -1 || c.indexOf('hsl(28') !== -1) {
                    map.setPaintProperty(l.id, 'line-color', '#FFFFFF');
                  } else if (c === '#e9ac77') {
                    map.setPaintProperty(l.id, 'line-color', '#94A3B8');
                  }
                }
              }
            });
          } catch(err) {
            console.warn('Error enhancing map colors:', err);
          }
        }

        // ── Single Active Municipality <MapPin /> & Popup ──
        var markersData = ${JSON.stringify(formattedMarkers)};
        var activePinMarker = null;
        var barangayMarkerElements = [];
        var isBarangayPinned = ${Boolean(pinnedBarangay)};

        function clearCityHighlight() {
          isBarangayPinned = true;
          try {
            if (map.getLayer('cebu-boundary-active-fill')) {
              map.setFilter('cebu-boundary-active-fill', ['==', ['get', 'name'], '___NONE___']);
            }
            if (map.getLayer('cebu-boundary-active-line')) {
              map.setFilter('cebu-boundary-active-line', ['==', ['get', 'name'], '___NONE___']);
            }
          } catch(_) {}
        }
        window.clearCityHighlight = clearCityHighlight;

        function updateBarangayMarkers(newList) {
          markersData = newList || [];
          renderBarangayMarkers();
        }
        window.updateBarangayMarkers = updateBarangayMarkers;

        function renderBarangayMarkers() {
          barangayMarkerElements.forEach(function(m) {
            try { m.remove(); } catch(_) {}
          });
          barangayMarkerElements = [];

          if (!markersData || !markersData.length) return;

          markersData.forEach(function(item) {
            // STRICT: Red dots MUST ONLY appear on each barangay, NEVER on the city!
            if (!item.isBarangay && !item.barangay) return;
            if (!item.lat || !item.lng) return;

            var el = document.createElement('div');
            el.className = 'mapcn-barangay-dot-marker';
            var shortLabel = item.barangay || item.name.replace(/^Brgy\.\s*/i, '');
            el.innerHTML = [
              '<div class="mapcn-red-dot-core">',
                '<div class="mapcn-red-dot-pulse"></div>',
              '</div>',
              '<div class="mapcn-barangay-label">' + shortLabel + '</div>'
            ].join('');

            el.addEventListener('click', function(e) {
              e.stopPropagation();
              clearCityHighlight();
              showActivePin('📍 ' + item.name, [item.lng, item.lat]);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'MAP_TAP_COORDS',
                  lng: item.lng,
                  lat: item.lat,
                  name: item.name,
                  barangay: item.barangay,
                  city: item.city
                }));
              }
            });

            var marker = new maplibregl.Marker({
              element: el,
              anchor: 'center'
            })
              .setLngLat([item.lng, item.lat])
              .addTo(map);

            barangayMarkerElements.push(marker);
          });
        }

        function showActivePin(municipalityName, lngLat) {
          if (!municipalityName || !lngLat) return;

          if (activePinMarker) {
            try { activePinMarker.remove(); } catch(_) {}
            activePinMarker = null;
          }

          var el = document.createElement('div');
          el.className = 'mapcn-mappin-wrapper';
          el.innerHTML = [
            '<div class="mapcn-mappin-pin">',
              '<svg width="38" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
                '<defs>',
                  '<linearGradient id="activeRedPinGrad" x1="0%" y1="0%" x2="0%" y2="100%">',
                    '<stop offset="0%" stop-color="#EF4444"/>',
                    '<stop offset="100%" stop-color="#B91C1C"/>',
                  '</linearGradient>',
                  '<filter id="pinShadow" x="-30%" y="-15%" width="160%" height="160%">',
                    '<feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="rgba(185,28,28,0.45)"/>',
                  '</filter>',
                '</defs>',
                '<path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" fill="url(#activeRedPinGrad)" stroke="#7F1D1D" stroke-width="1.3" filter="url(#pinShadow)"/>',
                '<circle cx="12" cy="10" r="4.2" fill="#FFFFFF"/>',
                '<circle cx="12" cy="10" r="2.2" fill="#EF4444"/>',
              '</svg>',
            '</div>',
            '<div class="mapcn-exact-pinpoint-pulse"></div>',
            '<div class="mapcn-exact-pinpoint-red-dot"></div>'
          ].join('');

          var popupContent = [
            '<div class="mapcn-popup-card mapcn-popup-pinned">',
              '<div class="mapcn-popup-pinned-dot"></div>',
              '<div class="mapcn-popup-name">' + municipalityName + '</div>',
            '</div>'
          ].join('');

          var popup = new maplibregl.Popup({
            offset: [0, -42],
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

          // Automatically toggle popup open with municipality name
          if (activePinMarker.getPopup && !activePinMarker.getPopup().isOpen()) {
            activePinMarker.togglePopup();
          }

          el.addEventListener('click', function(e) {
            e.stopPropagation();
            if (activePinMarker && activePinMarker.getPopup() && !activePinMarker.getPopup().isOpen()) {
              activePinMarker.togglePopup();
            }
          });
        }

        function renderMarkers() {
          renderBarangayMarkers();
          if (currentActiveLocation) {
            applyActiveBoundary(currentActiveLocation, false);
          }
        }

        // ── Cebu Municipality & City Boundary Polygons ──
        var boundariesData = ${JSON.stringify(boundariesGeoJSON || null)};
        var currentActiveLocation = ${JSON.stringify(activeLocation || '')};

        function initBoundaries() {
          if (!boundariesData) return;
          try {
            if (!map.getSource('cebu-boundaries')) {
              map.addSource('cebu-boundaries', {
                type: 'geojson',
                data: boundariesData
              });
            }

            // 1. All boundaries invisible fill (purely for click/touch detection)
            if (!map.getLayer('cebu-boundaries-all-fill')) {
              map.addLayer({
                id: 'cebu-boundaries-all-fill',
                type: 'fill',
                source: 'cebu-boundaries',
                paint: {
                  'fill-color': '#000000',
                  'fill-opacity': 0.00001
                }
              });
            }

            // 2. Highlighted active municipality fill (hidden when barangay is pinned)
            if (!map.getLayer('cebu-boundary-active-fill')) {
              map.addLayer({
                id: 'cebu-boundary-active-fill',
                type: 'fill',
                source: 'cebu-boundaries',
                filter: ['==', ['get', 'name'], isBarangayPinned ? '___NONE___' : (currentActiveLocation || '___NONE___')],
                paint: {
                  'fill-color': '#10B981',
                  'fill-opacity': 0.22
                }
              });
            }

            // 3. Highlighted active municipality border (hidden when barangay is pinned)
            if (!map.getLayer('cebu-boundary-active-line')) {
              map.addLayer({
                id: 'cebu-boundary-active-line',
                type: 'line',
                source: 'cebu-boundaries',
                filter: ['==', ['get', 'name'], isBarangayPinned ? '___NONE___' : (currentActiveLocation || '___NONE___')],
                paint: {
                  'line-color': '#059669',
                  'line-width': 2.8,
                  'line-opacity': 0.95
                }
              });
            }

            // Click listener for both polygon fill and general map canvas anywhere in the Philippines
            map.on('click', function(e) {
              var features = map.queryRenderedFeatures(e.point, { layers: ['cebu-boundaries-all-fill'] });
              var clickedName = (features && features.length > 0) ? features[0].properties.name : null;
              var lng = e.lngLat.lng;
              var lat = e.lngLat.lat;

              // Immediately remove green city highlight because a barangay is being pinned
              clearCityHighlight();

              showActivePin(clickedName ? ('📍 ' + clickedName) : '📍 Pinning barangay...', [lng, lat]);

              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'MAP_TAP_COORDS',
                  lng: lng,
                  lat: lat,
                  name: clickedName
                }));
              }
            });

            // Pointer cursor on hover over municipality
            map.on('mouseenter', 'cebu-boundaries-all-fill', function() {
              map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', 'cebu-boundaries-all-fill', function() {
              map.getCanvas().style.cursor = '';
            });
          } catch(err) {
            console.warn('Error initializing boundaries:', err);
          }
        }

        function applyActiveBoundary(name, shouldFly) {
          if (!name) return;
          currentActiveLocation = name;
          try {
            var matchedName = name;
            var pinLng = null;
            var pinLat = null;

            if (boundariesData && boundariesData.features) {
              var target = boundariesData.features.find(function(f) {
                return f.properties && (
                  f.properties.name === name ||
                  f.properties.original_name === name ||
                  (f.properties.name && name && f.properties.name.toLowerCase() === name.toLowerCase()) ||
                  (f.properties.original_name && name && f.properties.original_name.toLowerCase() === name.toLowerCase())
                );
              });
              if (target && target.properties) {
                matchedName = target.properties.name;
                if (target.properties.bbox) {
                  var bb = target.properties.bbox;
                  pinLng = (bb[0] + bb[2]) / 2;
                  pinLat = (bb[1] + bb[3]) / 2;
                  if (shouldFly) {
                    map.fitBounds([[bb[0], bb[1]], [bb[2], bb[3]]], {
                      padding: { top: 40, bottom: 40, left: 30, right: 30 },
                      maxZoom: 13,
                      duration: 850
                    });
                  }
                }
              }
            }

            // Coordinates from markersData if available
            if (markersData && markersData.length > 0) {
              var found = markersData.find(function(m) {
                return m.name && (
                  m.name.toLowerCase() === matchedName.toLowerCase() ||
                  m.name.toLowerCase().includes(matchedName.toLowerCase()) ||
                  matchedName.toLowerCase().includes(m.name.toLowerCase())
                );
              });
              if (found && found.lng && found.lat) {
                pinLng = found.lng;
                pinLat = found.lat;
              }
            }

            if (!isBarangayPinned) {
              if (map.getLayer('cebu-boundary-active-fill')) {
                map.setFilter('cebu-boundary-active-fill', ['==', ['get', 'name'], matchedName]);
              }
              if (map.getLayer('cebu-boundary-active-line')) {
                map.setFilter('cebu-boundary-active-line', ['==', ['get', 'name'], matchedName]);
              }
            } else {
              clearCityHighlight();
            }

            // (NOTE: Cities/municipalities DO NOT receive pins/red dots; only barangays do)
          } catch(err) {
            console.warn('Error applying active boundary:', err);
          }
        }

        window.applyActiveBoundary = applyActiveBoundary;

        map.on('style.load', function() {
          enhanceMapColors();
          initBoundaries();
          renderBarangayMarkers();
          if (currentActiveLocation && !isBarangayPinned) {
            applyActiveBoundary(currentActiveLocation, true);
          }
        });

      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MARKER_CLICK') {
        const target = data.name || data.id;
        if (onMarkerPress) onMarkerPress(target);
        if (onSelectLocation) onSelectLocation(target);
      } else if (data.type === 'BOUNDARY_CLICK') {
        if (onMarkerPress) onMarkerPress(data.name);
        if (onSelectLocation) onSelectLocation(data.name);
      } else if (data.type === 'MAP_TAP_COORDS') {
        if (onPinBarangay) {
          onPinBarangay({ lat: data.lat, lng: data.lng, name: data.name });
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
