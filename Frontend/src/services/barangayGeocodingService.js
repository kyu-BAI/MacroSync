/**
 * barangayGeocodingService.js
 * Enables exact Barangay pinning and search across the Philippines.
 * Combines OpenStreetMap reverse-geocoding, Expo Location, and offline barangay catalogs.
 */

import * as Location from 'expo-location';

// Popular barangays for key hubs (instant offline suggestion)
export const POPULAR_BARANGAYS_BY_CITY = {
  'Cebu City': [
    'Lahug',
    'Guadalupe',
    'Mabolo',
    'Banilad',
    'Kasambagan',
    'Talamban',
    'Punta Princesa',
    'Capitol Site',
    'Sambag I',
    'Sambag II',
    'Apas',
    'Basak San Nicolas',
    'Tisa',
    'Labangon',
    'Luz',
  ],
  'Mandaue City': [
    'Guizo',
    'Subangdaku',
    'Tipolo',
    'Bakilid',
    'Centro',
    'Alang-Alang',
    'Banilad (Mandaue)',
    'Cabancalan',
    'Casuntingan',
    'Maguikay',
  ],
  'Lapu-Lapu City': [
    'Pusok',
    'Mactan',
    'Basak (Lapu-Lapu)',
    'Maribago',
    'Marigondon',
    'Pajac',
    'Gun-ob',
    'Poblacion',
  ],
  'Talisay City': [
    'Poblacion',
    'Bulacao',
    'Dumlog',
    'Lawaan I',
    'Lawaan II',
    'San Roque',
    'Tabunok',
  ],
  'Davao City': [
    'Poblacion (Davao)',
    'Bucana',
    'Matina Crossing',
    'Buhangin',
    'Talomo',
    'Agdao',
    'Maa',
  ],
  'Quezon City': [
    'Diliman',
    'Batasan Hills',
    'Commonwealth',
    'Bagong Pag-asa',
    'Cubao',
    'Loyola Heights',
  ],
  'Manila': [
    'Ermita',
    'Malate',
    'Binondo',
    'Quiapo',
    'Sampaloc',
    'Santa Cruz',
    'Tondo',
  ],
};

// Instant offline coordinates for popular barangays
export const POPULAR_BARANGAY_COORDINATES = {
  // Cebu City
  'lahug': { barangay: 'Lahug', city: 'Cebu City', province: 'Cebu', lat: 10.3377, lng: 123.8988 },
  'guadalupe': { barangay: 'Guadalupe', city: 'Cebu City', province: 'Cebu', lat: 10.3275, lng: 123.8804 },
  'mabolo': { barangay: 'Mabolo', city: 'Cebu City', province: 'Cebu', lat: 10.3204, lng: 123.9142 },
  'banilad': { barangay: 'Banilad', city: 'Cebu City', province: 'Cebu', lat: 10.3444, lng: 123.9133 },
  'kasambagan': { barangay: 'Kasambagan', city: 'Cebu City', province: 'Cebu', lat: 10.3282, lng: 123.9114 },
  'talamban': { barangay: 'Talamban', city: 'Cebu City', province: 'Cebu', lat: 10.3705, lng: 123.9174 },
  'punta princesa': { barangay: 'Punta Princesa', city: 'Cebu City', province: 'Cebu', lat: 10.3012, lng: 123.8763 },
  'capitol site': { barangay: 'Capitol Site', city: 'Cebu City', province: 'Cebu', lat: 10.3179, lng: 123.8913 },
  'sambag i': { barangay: 'Sambag I', city: 'Cebu City', province: 'Cebu', lat: 10.3090, lng: 123.8890 },
  'sambag ii': { barangay: 'Sambag II', city: 'Cebu City', province: 'Cebu', lat: 10.3120, lng: 123.8870 },
  'apas': { barangay: 'Apas', city: 'Cebu City', province: 'Cebu', lat: 10.3340, lng: 123.9060 },
  'basak san nicolas': { barangay: 'Basak San Nicolas', city: 'Cebu City', province: 'Cebu', lat: 10.2974, lng: 123.8744 },
  'tisa': { barangay: 'Tisa', city: 'Cebu City', province: 'Cebu', lat: 10.3054, lng: 123.8702 },
  'labangon': { barangay: 'Labangon', city: 'Cebu City', province: 'Cebu', lat: 10.3088, lng: 123.8778 },
  'luz': { barangay: 'Luz', city: 'Cebu City', province: 'Cebu', lat: 10.3242, lng: 123.9048 },

  // Mandaue City
  'guizo': { barangay: 'Guizo', city: 'Mandaue City', province: 'Cebu', lat: 10.3298, lng: 123.9388 },
  'subangdaku': { barangay: 'Subangdaku', city: 'Mandaue City', province: 'Cebu', lat: 10.3218, lng: 123.9298 },
  'tipolo': { barangay: 'Tipolo', city: 'Mandaue City', province: 'Cebu', lat: 10.3255, lng: 123.9324 },
  'bakilid': { barangay: 'Bakilid', city: 'Mandaue City', province: 'Cebu', lat: 10.3312, lng: 123.9360 },
  'centro': { barangay: 'Centro', city: 'Mandaue City', province: 'Cebu', lat: 10.3350, lng: 123.9430 },
  'cabancalan': { barangay: 'Cabancalan', city: 'Mandaue City', province: 'Cebu', lat: 10.3551, lng: 123.9287 },
  'maguikay': { barangay: 'Maguikay', city: 'Mandaue City', province: 'Cebu', lat: 10.3421, lng: 123.9392 },

  // Lapu-Lapu City
  'pusok': { barangay: 'Pusok', city: 'Lapu-Lapu City', province: 'Cebu', lat: 10.3235, lng: 123.9782 },
  'mactan': { barangay: 'Mactan', city: 'Lapu-Lapu City', province: 'Cebu', lat: 10.3072, lng: 124.0150 },
  'maribago': { barangay: 'Maribago', city: 'Lapu-Lapu City', province: 'Cebu', lat: 10.2882, lng: 123.9984 },
  'marigondon': { barangay: 'Marigondon', city: 'Lapu-Lapu City', province: 'Cebu', lat: 10.2743, lng: 123.9765 },
  'poblacion (lapu-lapu)': { barangay: 'Poblacion', city: 'Lapu-Lapu City', province: 'Cebu', lat: 10.3150, lng: 123.9498 },

  // Talisay City
  'tabunok': { barangay: 'Tabunok', city: 'Talisay City', province: 'Cebu', lat: 10.2662, lng: 123.8398 },
  'poblacion (talisay)': { barangay: 'Poblacion', city: 'Talisay City', province: 'Cebu', lat: 10.2520, lng: 123.8480 },
  'dumlog': { barangay: 'Dumlog', city: 'Talisay City', province: 'Cebu', lat: 10.2450, lng: 123.8380 },
  'bulacao': { barangay: 'Bulacao', city: 'Talisay City', province: 'Cebu', lat: 10.2798, lng: 123.8475 },

  // Metro Manila
  'diliman': { barangay: 'Diliman', city: 'Quezon City', province: 'Metro Manila', lat: 14.6549, lng: 121.0645 },
  'cubao': { barangay: 'Cubao', city: 'Quezon City', province: 'Metro Manila', lat: 14.6195, lng: 121.0537 },
  'batasan hills': { barangay: 'Batasan Hills', city: 'Quezon City', province: 'Metro Manila', lat: 14.6869, lng: 121.0963 },
  'binondo': { barangay: 'Binondo', city: 'Manila', province: 'Metro Manila', lat: 14.6000, lng: 120.9747 },
  'malate': { barangay: 'Malate', city: 'Manila', province: 'Metro Manila', lat: 14.5714, lng: 120.9917 },
  'ermita': { barangay: 'Ermita', city: 'Manila', province: 'Metro Manila', lat: 14.5826, lng: 120.9822 },
  'quiapo': { barangay: 'Quiapo', city: 'Manila', province: 'Metro Manila', lat: 14.5988, lng: 120.9856 },
  'bgc': { barangay: 'Fort Bonifacio (BGC)', city: 'Taguig', province: 'Metro Manila', lat: 14.5547, lng: 121.0509 },

  // Davao City
  'matina crossing': { barangay: 'Matina Crossing', city: 'Davao City', province: 'Davao del Sur', lat: 7.0543, lng: 125.5902 },
  'buhangin': { barangay: 'Buhangin', city: 'Davao City', province: 'Davao del Sur', lat: 7.1082, lng: 125.6148 },
  'poblacion (davao)': { barangay: 'Poblacion', city: 'Davao City', province: 'Davao del Sur', lat: 7.0731, lng: 125.6128 },
};

/**
 * Reverse geocodes [lat, lng] into an exact Philippine Barangay & City
 */
export async function reverseGeocodeToBarangay(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }

  // 1. Try OpenStreetMap Nominatim reverse geocoder (has high-precision barangay/suburb breakdown in PH)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MacroSync-App/1.0 (contact@macrosync.app)',
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const addr = data?.address || {};

      const rawBarangay =
        addr.suburb ||
        addr.village ||
        addr.quarter ||
        addr.neighbourhood ||
        addr.residential ||
        addr.hamlet ||
        '';

      const rawCity =
        addr.city ||
        addr.municipality ||
        addr.town ||
        addr.county ||
        '';

      const province = addr.state || addr.region || '';

      const cleanBarangay = rawBarangay.replace(/^barangay\s+/i, '').replace(/^brgy\.?\s*/i, '').trim();
      const cleanCity = rawCity.replace(/\s+city$/i, '').trim();

      if (cleanBarangay && cleanCity) {
        return {
          barangay: cleanBarangay,
          city: `${cleanCity} City`,
          province,
          formattedTitle: `Brgy. ${cleanBarangay}, ${cleanCity}`,
          lat: latitude,
          lng: longitude,
          source: 'osm',
        };
      }
    }
  } catch (osmErr) {
    if (__DEV__) console.log('[Geocoding] OSM reverse geocoding notice:', osmErr?.message);
  }

  // 2. Fallback to Expo Native Location Reverse Geocoding
  try {
    const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geo) {
      const cleanBarangay = (geo.district || geo.name || '').replace(/^barangay\s+/i, '').replace(/^brgy\.?\s*/i, '').trim();
      const cleanCity = geo.city || geo.subregion || 'Cebu City';

      if (cleanBarangay) {
        return {
          barangay: cleanBarangay,
          city: cleanCity,
          province: geo.region || '',
          formattedTitle: `Brgy. ${cleanBarangay}, ${cleanCity}`,
          lat: latitude,
          lng: longitude,
          source: 'native',
        };
      }

      return {
        barangay: '',
        city: cleanCity,
        province: geo.region || '',
        formattedTitle: cleanCity,
        lat: latitude,
        lng: longitude,
        source: 'native-city',
      };
    }
  } catch (nativeErr) {
    if (__DEV__) console.warn('[Geocoding] Native reverse geocode error:', nativeErr);
  }

  return {
    barangay: '',
    city: 'Philippines',
    formattedTitle: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    lat: latitude,
    lng: longitude,
    source: 'coords',
  };
}

/**
 * Searches Philippine Barangays by query text
 */
export async function searchPhilippineBarangays(query) {
  if (!query || query.trim().length < 2) return [];
  const cleanQ = query.trim().toLowerCase();

  // 1. Instant local matches from popular catalog
  const localMatches = [];
  Object.keys(POPULAR_BARANGAY_COORDINATES).forEach((key) => {
    const item = POPULAR_BARANGAY_COORDINATES[key];
    if (
      key.includes(cleanQ) ||
      item.barangay.toLowerCase().includes(cleanQ) ||
      cleanQ.includes(item.barangay.toLowerCase())
    ) {
      localMatches.push({
        name: `Brgy. ${item.barangay}`,
        barangay: item.barangay,
        city: item.city,
        province: item.province,
        display: `Brgy. ${item.barangay}, ${item.city}`,
        lat: item.lat,
        lng: item.lng,
        isInstant: true,
      });
    }
  });

  if (localMatches.length >= 4) {
    return localMatches;
  }

  // 2. Supplement with OpenStreetMap search
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQ + ', Philippines'
    )}&addressdetails=1&limit=6`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MacroSync-App/1.0 (contact@macrosync.app)',
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        const osmResults = list.map((item) => {
          const addr = item.address || {};
          const brgy =
            addr.suburb ||
            addr.village ||
            addr.quarter ||
            addr.neighbourhood ||
            item.name;

          const city = addr.city || addr.municipality || addr.town || '';
          const province = addr.state || addr.region || '';

          const cleanB = brgy.replace(/^barangay\s+/i, '').replace(/^brgy\.?\s*/i, '').trim();
          const cleanC = city.trim();

          return {
            name: `Brgy. ${cleanB}`,
            barangay: cleanB,
            city: cleanC || 'Philippines',
            province,
            display: `Brgy. ${cleanB}${cleanC ? `, ${cleanC}` : ''}${province ? `, ${province}` : ''}`,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            isInstant: false,
          };
        });

        // Merge and deduplicate by barangay name
        const combined = [...localMatches];
        osmResults.forEach((osm) => {
          if (!combined.some((c) => c.barangay.toLowerCase() === osm.barangay.toLowerCase())) {
            combined.push(osm);
          }
        });
        return combined;
      }
    }
  } catch (err) {
    if (__DEV__) console.log('[Geocoding] Barangay search notice:', err?.message);
  }

  return localMatches;
}

/**
 * Returns an array of barangay markers for a given city with exact coordinates
 */
export function getBarangayMarkersForCity(cityName) {
  if (!cityName) return [];
  const cleanCity = cityName.toLowerCase().replace(/\s+city$/i, '').trim();
  const markers = [];

  Object.keys(POPULAR_BARANGAY_COORDINATES).forEach((k) => {
    const item = POPULAR_BARANGAY_COORDINATES[k];
    const itemCity = item.city.toLowerCase().replace(/\s+city$/i, '').trim();
    if (itemCity.includes(cleanCity) || cleanCity.includes(itemCity)) {
      markers.push({
        id: `brgy-${k}`,
        name: `Brgy. ${item.barangay}`,
        barangay: item.barangay,
        city: item.city,
        province: item.province,
        lat: item.lat,
        lng: item.lng,
        isBarangay: true,
      });
    }
  });

  return markers;
}
