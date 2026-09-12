import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';

/**
 * MapcnMap
 * A modern map component powered by MapLibre GL and OpenFreeMap.
 * Features:
 *   - Vibrant 2D Bright Map (full colors: blue oceans, green parks, crisp roads)
 *   - Immersive 3D Liberty Map (3D building extrusions & 60° tilt)
 *   - Sleek Apple/Google Maps-style [ 2D | 3D ] pill toggle
 *   - MapMarker, MarkerContent, MarkerTooltip, and MarkerPopup
 *   - 100% Free & Open-source (Zero API keys required)
 *
 * Props:
 *   center: [lng, lat] or { lat, lng } (default: [123.8854, 10.3157])
 *   zoom: number (default: 9)
 *   markers: Array<{ id, name, title, lat, lng, latitude, longitude, subtitle, desc, active }>
 *   onMarkerPress: (id: string | number) => void
 *   interactive?: boolean (default: true)
 *   showControls?: boolean (default: true)
 *   showDimensionToggle?: boolean (default: true)
 *   defaultDimension?: '2D' | '3D' (default: '2D')
 *   cardContainer?: boolean (default: true)
 *   height?: number | string (default: 260)
 *   style?: object
 */
export default function MapcnMap({
  center = [123.8854, 10.3157],
  zoom = 9,
  markers = [],
  onMarkerPress,
  interactive = true,
  showControls = true,
  showDimensionToggle = true,
  defaultDimension = '2D',
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

  // Fly to new center when updated from React Native
  useEffect(() => {
    if (webViewRef.current && centerCoords) {
      const script = `
        if (window.map) {
          window.map.flyTo({
            center: ${JSON.stringify(centerCoords)},
            zoom: ${zoom},
            essential: true,
            duration: 800
          });
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [centerCoords[0], centerCoords[1], zoom]);

  const bgColor = isDarkMode ? '#0B0F19' : '#F8FAFC';
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

        /* ── Modern 2D | 3D Segmented Pill Switcher ── */
        .dimension-pill {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 15;
          display: ${showDimensionToggle ? 'flex' : 'none'};
          align-items: center;
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.94)'};
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 20px;
          padding: 3px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          gap: 2px;
        }
        .dim-btn {
          background: transparent;
          border: none;
          color: ${isDarkMode ? '#94A3B8' : '#64748B'};
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 800;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
        }
        .dim-btn.active {
          background: #10B981;
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.55);
        }

        /* ── Map Zoom/Compass Controls ── */
        .maplibregl-ctrl-group {
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)'} !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'} !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35) !important;
          overflow: hidden;
          margin: 10px 10px 0 0 !important;
        }
        .maplibregl-ctrl-group button {
          width: 32px !important;
          height: 32px !important;
          border: none !important;
          border-bottom: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'} !important;
          background: transparent !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .maplibregl-ctrl-group button:last-child {
          border-bottom: none !important;
        }
        .maplibregl-ctrl-icon {
          ${isDarkMode ? 'filter: invert(1);' : ''}
          opacity: 0.85;
        }

        /* ── MapMarker & MarkerContent ── */
        .mapcn-marker-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }
        .mapcn-marker-pin {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #10B981;
          border: 2.5px solid #FFFFFF;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease;
        }
        .mapcn-marker-pin.active {
          background: #059669;
          transform: scale(1.3);
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.85);
          border-color: #6EE7B7;
        }
        .mapcn-marker-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #FFFFFF;
        }

        /* ── MarkerTooltip ── */
        .mapcn-marker-tooltip {
          margin-top: 3px;
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)'};
          color: ${isDarkMode ? '#F8FAFC' : '#0F172A'};
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
          white-space: nowrap;
          pointer-events: none;
        }

        /* ── MarkerPopup ── */
        .maplibregl-popup-content {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .maplibregl-popup-tip {
          border-top-color: ${isDarkMode ? '#0F172A' : '#FFFFFF'} !important;
        }
        .mapcn-popup-card {
          background: ${isDarkMode ? '#0F172A' : '#FFFFFF'};
          color: ${isDarkMode ? '#F8FAFC' : '#0F172A'};
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 12px;
          padding: 10px 14px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
          min-width: 140px;
        }
        .mapcn-popup-name {
          font-size: 13px;
          font-weight: 700;
          color: ${isDarkMode ? '#F8FAFC' : '#0F172A'};
        }
        .mapcn-popup-coords {
          font-size: 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: ${isDarkMode ? '#94A3B8' : '#64748B'};
          margin-top: 2px;
        }
        .mapcn-popup-desc {
          font-size: 11px;
          font-weight: 500;
          color: #10B981;
          margin-top: 4px;
        }

        /* ── Watermark ── */
        .mapcn-watermark {
          position: absolute;
          bottom: 8px;
          right: 8px;
          z-index: 10;
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.88)'};
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'};
          border-radius: 12px;
          padding: 3px 8px;
          font-size: 9px;
          font-weight: 700;
          color: ${isDarkMode ? '#94A3B8' : '#64748B'};
          display: flex;
          align-items: center;
          gap: 4px;
          pointer-events: none;
        }
        .mapcn-watermark .brand {
          color: ${isDarkMode ? '#10B981' : '#059669'};
        }
        .maplibregl-ctrl-attrib { display: none !important; }
      </style>
    </head>
    <body>
      <!-- 2D | 3D Segmented Pill Switcher -->
      <div class="dimension-pill">
        <button class="dim-btn ${defaultDimension === '2D' ? 'active' : ''}" id="btn-2d">2D</button>
        <button class="dim-btn ${defaultDimension === '3D' ? 'active' : ''}" id="btn-3d">3D</button>
      </div>

      <div id="map"></div>

      <div class="mapcn-watermark">
        <span class="brand">▰ OpenFreeMap</span>, © OpenStreetMap ⓘ
      </div>

      <script>
        // OpenFreeMap: Bright (2D colorful) & Liberty (3D buildings)
        var STYLES = {
          '2D': 'https://tiles.openfreemap.org/styles/bright',
          '3D': 'https://tiles.openfreemap.org/styles/liberty'
        };

        var currentDim = "${defaultDimension}";
        var isInitial3D = currentDim === '3D';

        var map = new maplibregl.Map({
          container: 'map',
          style: STYLES[currentDim] || STYLES['2D'],
          center: ${JSON.stringify(centerCoords)},
          zoom: ${zoom},
          pitch: isInitial3D ? 60 : 0,
          bearing: isInitial3D ? -15 : 0,
          interactive: ${interactive},
          attributionControl: false
        });
        window.map = map;

        if (${showControls}) {
          map.addControl(new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true
          }), 'top-right');
        }

        // Render MapMarkers, Tooltips & Popups
        var markersData = ${JSON.stringify(formattedMarkers)};
        var markerInstances = [];

        function renderMarkers() {
          markerInstances.forEach(function(inst) { inst.remove(); });
          markerInstances = [];

          markersData.forEach(function(m) {
            // MarkerContent + MarkerTooltip
            var el = document.createElement('div');
            el.className = 'mapcn-marker-wrapper';
            el.innerHTML = [
              '<div class="mapcn-marker-pin' + (m.active ? ' active' : '') + '">',
                '<div class="mapcn-marker-dot"></div>',
              '</div>',
              '<div class="mapcn-marker-tooltip">' + m.name + '</div>'
            ].join('');

            // MarkerPopup
            var popupContent = [
              '<div class="mapcn-popup-card">',
                '<div class="mapcn-popup-name">' + m.name + '</div>',
                '<div class="mapcn-popup-coords">' + m.lat.toFixed(4) + ', ' + m.lng.toFixed(4) + '</div>',
                (m.subtitle ? '<div class="mapcn-popup-desc">' + m.subtitle + '</div>' : ''),
              '</div>'
            ].join('');

            var popup = new maplibregl.Popup({
              offset: 24,
              closeButton: false,
              closeOnClick: true
            }).setHTML(popupContent);

            el.addEventListener('click', function(e) {
              e.stopPropagation();
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                  type: 'MARKER_CLICK', 
                  id: m.id,
                  name: m.name
                }));
              }
            });

            var inst = new maplibregl.Marker({ element: el })
              .setLngLat([m.lng, m.lat])
              .setPopup(popup)
              .addTo(map);

            markerInstances.push(inst);
          });
        }

        map.on('style.load', function() {
          renderMarkers();
        });
        renderMarkers();

        // Handle 2D | 3D Pill Toggle
        var btn2D = document.getElementById('btn-2d');
        var btn3D = document.getElementById('btn-3d');

        function setDimension(dim) {
          if (currentDim === dim) return;
          currentDim = dim;

          if (dim === '3D') {
            btn3D.classList.add('active');
            btn2D.classList.remove('active');
            map.easeTo({ pitch: 60, bearing: -15, duration: 750 });
            map.setStyle(STYLES['3D']);
          } else {
            btn2D.classList.add('active');
            btn3D.classList.remove('active');
            map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
            map.setStyle(STYLES['2D']);
          }
        }

        if (btn2D && btn3D) {
          btn2D.addEventListener('click', function() { setDimension('2D'); });
          btn3D.addEventListener('click', function() { setDimension('3D'); });
        }
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MARKER_CLICK' && onMarkerPress) {
        onMarkerPress(data.id ?? data.name);
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
