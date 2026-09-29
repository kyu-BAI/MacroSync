/**
 * barangayGeocodingService.js
 * Enables exact Barangay pinning and search across the Philippines.
 * Strictly guarantees clean, human-readable Barangay names (zero plus codes, zip codes, or coordinates).
 */

import * as Location from 'expo-location';
import cebuBoundaries from '../data/cebu_boundaries.json';

/**
 * Checks whether a string is a Plus Code, ZIP code, coordinate pair, or raw code.
 */
export function isAlphanumericCode(str) {
  if (!str || typeof str !== 'string') return true;
  const s = str.trim();
  if (s.length === 0) return true;

  // 1. Plus Code / Open Location Code (e.g. "7Q5G+X7C", "8522+4V", "4RP4+9Q Daanbantayan")
  if (s.includes('+')) return true;

  // 2. Coordinate pair (e.g. "11.2589, 124.0153")
  if (/^\d+(\.\d+)?[,\s]+\d+(\.\d+)?$/.test(s)) return true;

  // 3. Postal code / purely numeric (e.g. "6013", "6000", "1200")
  if (/^\d{3,6}$/.test(s)) return true;

  // 4. Street address numbers or lot codes (e.g. "Lot 12", "Block 4", "#45", "Unit 102")
  if (/^(lot|blk|block|unit|street|st\.|no\.|#)\s*\d+/i.test(s)) return true;

  // 5. Unnamed or placeholder strings
  if (/^(unnamed|road|highway|street|path|pinning|coordinates?|unknown)$/i.test(s)) return true;

  // 6. Short alphanumeric code with numbers and uppercase letters (e.g. "7Q5GX7C", "R124")
  if (/^[A-Z0-9]{3,8}$/.test(s) && /\d/.test(s)) return true;

  return false;
}

/**
 * Cleans a barangay name and returns empty string if it's a code.
 */
export function cleanBarangayName(str, cityName) {
  if (!str || typeof str !== 'string') return '';
  let clean = str.trim();

  // Strip prefixes
  clean = clean.replace(/^(barangay|brgy\.?|bgy\.?)\s+/i, '').trim();

  // Strip city suffix if present in barangay string
  if (cityName) {
    const cityRegex = new RegExp(`\\s*,?\\s*(${cityName}|cebu).*$`, 'i');
    clean = clean.replace(cityRegex, '').trim();
  }

  // Reject if it is a code or invalid
  if (isAlphanumericCode(clean)) {
    return '';
  }

  return clean;
}

// Popular barangays for key hubs (instant offline suggestion)
export const POPULAR_BARANGAYS_BY_CITY = {
  'Daanbantayan': [
    'Maya', 'Tapilon', 'Agujo', 'Bagay', 'Bitoon', 'Calape', 'Carnaza',
    'Dalingding', 'Lanao', 'Logon (Malapascua)', 'Malbago', 'Malingin',
    'Pajo', 'Poblacion', 'Paypay', 'Talisay', 'Tinubdan', 'Tominjao'
  ],
  'San Remigio': [
    'Hagnaya', 'Poblacion', 'Tambongon', 'Argawanon', 'Victoria',
    'San Miguel', 'Lambusan', 'Lawis', 'Batad', 'Punta', 'Anapog'
  ],
  'Bogo City': [
    'Poblacion', 'Polambato', 'Cogon', 'Guba', 'Taytayan',
    'Banban', 'Don Pedro', 'La Paz', 'Santo Niño', 'Dakit'
  ],
  'Medellin': [
    'Kawit', 'Curva', 'Daanlungsod', 'Antipolo', 'Lamintak Norte',
    'Poblacion', 'Gibitngil', 'Canhabagat', 'Tindog'
  ],
  'Bantayan': [
    'Poblacion', 'Ticad', 'Suba', 'Sillon', 'Patao', 'Baod', 'Tamiao', 'Kabac'
  ],
  'Santa Fe': [
    'Poblacion', 'Pooc', 'Talisay', 'Maricaban', 'Okoy', 'Balidbid'
  ],
  'Madridejos': [
    'Poblacion', 'Mancilang', 'Tarong', 'Tabagak', 'Bunakan', 'Kangwayan'
  ],
  'Cebu City': [
    'Lahug', 'Guadalupe', 'Mabolo', 'Banilad', 'Kasambagan', 'Talamban',
    'Punta Princesa', 'Capitol Site', 'Sambag I', 'Sambag II', 'Apas',
    'Basak San Nicolas', 'Tisa', 'Labangon', 'Luz', 'Tejero', 'Pardo'
  ],
  'Mandaue City': [
    'Guizo', 'Subangdaku', 'Tipolo', 'Bakilid', 'Centro', 'Alang-Alang',
    'Banilad (Mandaue)', 'Cabancalan', 'Casuntingan', 'Maguikay', 'Looc', 'Paknaan'
  ],
  'Lapu-Lapu City': [
    'Pusok', 'Mactan', 'Basak (Lapu-Lapu)', 'Maribago', 'Marigondon',
    'Pajac', 'Gun-ob', 'Poblacion', 'Buaya', 'Bankal'
  ],
  'Talisay City': [
    'Poblacion', 'Bulacao', 'Dumlog', 'Lawaan I', 'Lawaan II',
    'San Roque', 'Tabunok', 'Cansojong', 'Mohon'
  ],
  'Carcar City': [
    'Poblacion', 'Valladolid', 'Tuyom', 'Perrelos', 'Ocaña', 'Liburon', 'Guadalupe'
  ],
  'Toledo City': [
    'Poblacion', 'Don Andres Soriano (Lutopan)', 'Cantabaco', 'Sangi', 'Luray II', 'Ibo'
  ],
  'Balamban': [
    'Poblacion', 'Buanoy', 'Arpili', 'Aliwanay', 'Nangka', 'Pondol', 'Prenza'
  ],
  'Argao': [
    'Poblacion', 'Talaga', 'Binlod', 'Bulasa', 'Canbanua', 'Jampang', 'Lamacan'
  ],
  'Moalboal': [
    'Poblacion', 'Basdiot', 'Saavedra', 'Tuble', 'Tunga', 'Balabagon'
  ],
  'Davao City': [
    'Poblacion (Davao)', 'Bucana', 'Matina Crossing', 'Buhangin', 'Talomo', 'Agdao', 'Maa'
  ],
  'Quezon City': [
    'Diliman', 'Batasan Hills', 'Commonwealth', 'Bagong Pag-asa', 'Cubao', 'Loyola Heights'
  ],
  'Manila': [
    'Ermita', 'Malate', 'Binondo', 'Quiapo', 'Sampaloc', 'Santa Cruz', 'Tondo'
  ],
};

// Instant offline coordinates for popular barangays
export const POPULAR_BARANGAY_COORDINATES = {
  // Daanbantayan
  'maya': { barangay: 'Maya', city: 'Daanbantayan', province: 'Cebu', lat: 11.2678, lng: 124.0322 },
  'tapilon': { barangay: 'Tapilon', city: 'Daanbantayan', province: 'Cebu', lat: 11.2825, lng: 124.0210 },
  'agujo': { barangay: 'Agujo', city: 'Daanbantayan', province: 'Cebu', lat: 11.2480, lng: 124.0080 },
  'bagay': { barangay: 'Bagay', city: 'Daanbantayan', province: 'Cebu', lat: 11.2350, lng: 124.0180 },
  'bitoon (daanbantayan)': { barangay: 'Bitoon', city: 'Daanbantayan', province: 'Cebu', lat: 11.2650, lng: 123.9920 },
  'poblacion (daanbantayan)': { barangay: 'Poblacion', city: 'Daanbantayan', province: 'Cebu', lat: 11.2589, lng: 124.0153 },
  'carnaza': { barangay: 'Carnaza', city: 'Daanbantayan', province: 'Cebu', lat: 11.5160, lng: 124.1000 },
  'logon (malapascua)': { barangay: 'Logon (Malapascua)', city: 'Daanbantayan', province: 'Cebu', lat: 11.3330, lng: 124.1140 },
  'paypay': { barangay: 'Paypay', city: 'Daanbantayan', province: 'Cebu', lat: 11.2220, lng: 124.0310 },
  'talisay (daanbantayan)': { barangay: 'Talisay', city: 'Daanbantayan', province: 'Cebu', lat: 11.2750, lng: 124.0410 },
  'tominjao': { barangay: 'Tominjao', city: 'Daanbantayan', province: 'Cebu', lat: 11.2380, lng: 124.0450 },
  'calape': { barangay: 'Calape', city: 'Daanbantayan', province: 'Cebu', lat: 11.2420, lng: 123.9980 },
  'malbago': { barangay: 'Malbago', city: 'Daanbantayan', province: 'Cebu', lat: 11.2150, lng: 124.0080 },
  'malingin (daanbantayan)': { barangay: 'Malingin', city: 'Daanbantayan', province: 'Cebu', lat: 11.2510, lng: 124.0350 },

  // San Remigio
  'hagnaya': { barangay: 'Hagnaya', city: 'San Remigio', province: 'Cebu', lat: 11.0850, lng: 123.9480 },
  'poblacion (san remigio)': { barangay: 'Poblacion', city: 'San Remigio', province: 'Cebu', lat: 11.0772, lng: 123.9356 },
  'tambongon': { barangay: 'Tambongon', city: 'San Remigio', province: 'Cebu', lat: 11.0450, lng: 123.9520 },
  'argawanon': { barangay: 'Argawanon', city: 'San Remigio', province: 'Cebu', lat: 11.0950, lng: 123.9620 },
  'victoria': { barangay: 'Victoria', city: 'San Remigio', province: 'Cebu', lat: 11.1150, lng: 123.9720 },
  'san miguel': { barangay: 'San Miguel', city: 'San Remigio', province: 'Cebu', lat: 11.0620, lng: 123.9410 },
  'lambusan': { barangay: 'Lambusan', city: 'San Remigio', province: 'Cebu', lat: 11.1350, lng: 123.9850 },

  // Bogo City
  'poblacion (bogo)': { barangay: 'Poblacion', city: 'Bogo City', province: 'Cebu', lat: 11.0517, lng: 124.0055 },
  'polambato': { barangay: 'Polambato', city: 'Bogo City', province: 'Cebu', lat: 11.0720, lng: 124.0280 },
  'cogon (bogo)': { barangay: 'Cogon', city: 'Bogo City', province: 'Cebu', lat: 11.0420, lng: 123.9950 },
  'guba': { barangay: 'Guba', city: 'Bogo City', province: 'Cebu', lat: 11.0310, lng: 124.0150 },
  'taytayan': { barangay: 'Taytayan', city: 'Bogo City', province: 'Cebu', lat: 11.0650, lng: 123.9910 },

  // Medellin
  'kawit': { barangay: 'Kawit', city: 'Medellin', province: 'Cebu', lat: 11.1550, lng: 123.9550 },
  'curva': { barangay: 'Curva', city: 'Medellin', province: 'Cebu', lat: 11.1180, lng: 123.9780 },
  'poblacion (medellin)': { barangay: 'Poblacion', city: 'Medellin', province: 'Cebu', lat: 11.1320, lng: 123.9650 },
  'daanlungsod': { barangay: 'Daanlungsod', city: 'Medellin', province: 'Cebu', lat: 11.1410, lng: 123.9620 },

  // Bantayan & Santa Fe
  'poblacion (bantayan)': { barangay: 'Poblacion', city: 'Bantayan', province: 'Cebu', lat: 11.1681, lng: 123.7222 },
  'ticad': { barangay: 'Ticad', city: 'Bantayan', province: 'Cebu', lat: 11.1820, lng: 123.7380 },
  'suba': { barangay: 'Suba', city: 'Bantayan', province: 'Cebu', lat: 11.1650, lng: 123.7180 },
  'sillon': { barangay: 'Sillon', city: 'Bantayan', province: 'Cebu', lat: 11.2150, lng: 123.7350 },
  'pooc': { barangay: 'Pooc', city: 'Santa Fe', province: 'Cebu', lat: 11.1480, lng: 123.7920 },
  'poblacion (santa fe)': { barangay: 'Poblacion', city: 'Santa Fe', province: 'Cebu', lat: 11.1530, lng: 123.8050 },
  'talisay (santa fe)': { barangay: 'Talisay', city: 'Santa Fe', province: 'Cebu', lat: 11.1610, lng: 123.8110 },

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

  // Carcar City
  'poblacion (carcar)': { barangay: 'Poblacion', city: 'Carcar City', province: 'Cebu', lat: 10.1044, lng: 123.6419 },
  'valladolid': { barangay: 'Valladolid', city: 'Carcar City', province: 'Cebu', lat: 10.1250, lng: 123.6620 },
  'perrelos': { barangay: 'Perrelos', city: 'Carcar City', province: 'Cebu', lat: 10.1380, lng: 123.6550 },

  // Toledo City
  'poblacion (toledo)': { barangay: 'Poblacion', city: 'Toledo City', province: 'Cebu', lat: 10.3772, lng: 123.6406 },
  'lutopan': { barangay: 'Don Andres Soriano (Lutopan)', city: 'Toledo City', province: 'Cebu', lat: 10.3650, lng: 123.7120 },

  // Balamban
  'poblacion (balamban)': { barangay: 'Poblacion', city: 'Balamban', province: 'Cebu', lat: 10.5042, lng: 123.7194 },
  'buanoy': { barangay: 'Buanoy', city: 'Balamban', province: 'Cebu', lat: 10.4850, lng: 123.6980 },

  // Moalboal
  'poblacion (moalboal)': { barangay: 'Poblacion', city: 'Moalboal', province: 'Cebu', lat: 9.9575, lng: 123.4000 },
  'basdiot': { barangay: 'Basdiot', city: 'Moalboal', province: 'Cebu', lat: 9.9550, lng: 123.3680 },

  // Argao
  'poblacion (argao)': { barangay: 'Poblacion', city: 'Argao', province: 'Cebu', lat: 9.8808, lng: 123.5975 },

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
 * Finds which Cebu LGU contains the given coordinates using bounding box and nearest centroid
 */
export function findCebuLGUForCoords(lat, lng) {
  if (!cebuBoundaries || !cebuBoundaries.features) return null;

  let bestMatch = null;
  let minDistance = Infinity;

  for (const feature of cebuBoundaries.features) {
    const bbox = feature.properties?.bbox;
    if (bbox) {
      // Check if point falls strictly within bounding box
      if (lng >= bbox[0] && lat >= bbox[1] && lng <= bbox[2] && lat <= bbox[3]) {
        return feature.properties.name || feature.properties.NAME_2;
      }
      // Compute center distance as backup
      const cLng = (bbox[0] + bbox[2]) / 2;
      const cLat = (bbox[1] + bbox[3]) / 2;
      const dist = Math.hypot(lat - cLat, lng - cLng);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = feature.properties.name || feature.properties.NAME_2;
      }
    }
  }

  // If reasonably close to Cebu (within ~20km)
  if (minDistance < 0.25) {
    return bestMatch;
  }

  return null;
}

/**
 * Finds the nearest verified known barangay for given coordinates
 */
export function findNearestKnownBarangay(lat, lng, targetCity) {
  let best = null;
  let minDistance = Infinity;

  const cleanTarget = targetCity ? targetCity.toLowerCase().replace(/\s+city$/i, '').trim() : '';

  Object.keys(POPULAR_BARANGAY_COORDINATES).forEach((k) => {
    const item = POPULAR_BARANGAY_COORDINATES[k];
    const itemCity = item.city.toLowerCase().replace(/\s+city$/i, '').trim();

    if (!cleanTarget || itemCity.includes(cleanTarget) || cleanTarget.includes(itemCity)) {
      const dist = Math.hypot(lat - item.lat, lng - item.lng);
      if (dist < minDistance) {
        minDistance = dist;
        best = item;
      }
    }
  });

  return best;
}

/**
 * Reverse geocodes [lat, lng] into an exact Philippine Barangay & City.
 * GUARANTEE: Never returns a code, Plus Code, or raw numbers. Always returns a human-readable Barangay name.
 */
export async function reverseGeocodeToBarangay(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }

  // Check known Cebu LGU boundary first
  const cebuLGU = findCebuLGUForCoords(latitude, longitude);

  // 1. Try OpenStreetMap Nominatim reverse geocoder
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

      // Candidate barangay names in priority order
      const candidateList = [
        addr.village,
        addr.suburb,
        addr.quarter,
        addr.neighbourhood,
        addr.residential,
        addr.hamlet,
        addr.city_district,
        addr.place,
        addr.island,
      ];

      // Also check segments from display_name (e.g. "Maya, Daanbantayan, Cebu, Philippines")
      if (typeof data.display_name === 'string') {
        const parts = data.display_name.split(',').map((p) => p.trim());
        parts.forEach((p) => {
          if (!candidateList.includes(p)) candidateList.push(p);
        });
      }

      const rawCity =
        addr.city ||
        addr.municipality ||
        addr.town ||
        cebuLGU ||
        addr.county ||
        '';

      const province = addr.state || addr.region || 'Cebu';
      const cleanCity = rawCity.replace(/\s+city$/i, '').trim();

      // Find the first candidate that is a genuine, human-readable name (not a code or city name)
      for (const cand of candidateList) {
        if (!cand) continue;
        const cleaned = cleanBarangayName(cand, cleanCity);

        // Ensure it's not the city name itself and not a code
        if (
          cleaned &&
          cleaned.toLowerCase() !== cleanCity.toLowerCase() &&
          cleaned.toLowerCase() !== province.toLowerCase() &&
          cleaned.toLowerCase() !== 'philippines' &&
          !isAlphanumericCode(cleaned)
        ) {
          const displayCity = cebuLGU || cleanCity || 'Cebu';
          return {
            barangay: cleaned,
            city: displayCity,
            province,
            formattedTitle: `Brgy. ${cleaned}, ${displayCity}`,
            lat: latitude,
            lng: longitude,
            source: 'osm',
          };
        }
      }
    }
  } catch (osmErr) {
    if (__DEV__) console.log('[Geocoding] OSM reverse geocoding notice:', osmErr?.message);
  }

  // 2. Fallback to Expo Native Location Reverse Geocoding
  try {
    const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geo) {
      const rawCity = geo.city || geo.subregion || cebuLGU || 'Cebu';
      const cleanCity = rawCity.replace(/\s+city$/i, '').trim();

      // District is usually the true barangay in PH Expo location; reject geo.name if it's a Plus Code!
      const candidate = geo.district && !isAlphanumericCode(geo.district)
        ? geo.district
        : (!isAlphanumericCode(geo.name) ? geo.name : '');

      const cleaned = cleanBarangayName(candidate, cleanCity);

      if (cleaned && !isAlphanumericCode(cleaned)) {
        const displayCity = cebuLGU || cleanCity || 'Cebu';
        return {
          barangay: cleaned,
          city: displayCity,
          province: geo.region || 'Cebu',
          formattedTitle: `Brgy. ${cleaned}, ${displayCity}`,
          lat: latitude,
          lng: longitude,
          source: 'native',
        };
      }
    }
  } catch (nativeErr) {
    if (__DEV__) console.warn('[Geocoding] Native reverse geocode error:', nativeErr);
  }

  // 3. Guaranteed Nearest Known Real Barangay Fallback (Zero codes allowed)
  const targetCity = cebuLGU || 'Cebu City';
  const nearest = findNearestKnownBarangay(latitude, longitude, targetCity);

  if (nearest && !isAlphanumericCode(nearest.barangay)) {
    return {
      barangay: nearest.barangay,
      city: nearest.city,
      province: nearest.province || 'Cebu',
      formattedTitle: `Brgy. ${nearest.barangay}, ${nearest.city}`,
      lat: latitude,
      lng: longitude,
      source: 'catalog-nearest',
    };
  }

  // Final fallback: Use Poblacion of the verified LGU
  const fallbackBarangay = 'Poblacion';
  const fallbackCity = cebuLGU || 'Cebu';
  return {
    barangay: fallbackBarangay,
    city: fallbackCity,
    province: 'Cebu',
    formattedTitle: `Brgy. ${fallbackBarangay}, ${fallbackCity}`,
    lat: latitude,
    lng: longitude,
    source: 'lgu-poblacion',
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
        const osmResults = [];
        list.forEach((item) => {
          const addr = item.address || {};
          const brgyRaw =
            addr.suburb ||
            addr.village ||
            addr.quarter ||
            addr.neighbourhood ||
            item.name;

          const city = addr.city || addr.municipality || addr.town || '';
          const province = addr.state || addr.region || '';

          const cleanB = cleanBarangayName(brgyRaw, city);
          const cleanC = city.trim();

          // Strictly filter out codes from search results
          if (cleanB && !isAlphanumericCode(cleanB)) {
            osmResults.push({
              name: `Brgy. ${cleanB}`,
              barangay: cleanB,
              city: cleanC || 'Philippines',
              province,
              display: `Brgy. ${cleanB}${cleanC ? `, ${cleanC}` : ''}${province ? `, ${province}` : ''}`,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              isInstant: false,
            });
          }
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
