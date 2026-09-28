/**
 * cityFoodService.js
 * Fetches local food profiles for Philippine cities/municipalities.
 * Flow: Supabase cache → Gemini AI generation → fallback static data
 */

import API_URL from '../screens/config/api';

// Static fallback for offline mode — the original 18 Cebu cities
const STATIC_FALLBACK = {
  'Cebu City': {
    marketTitle: 'Carbon Market & Pasil Fish Port (Cebu City)',
    palengkeItems: 'Pasil Fresh Fish, Singkamas, Pork Belly, Kangkong, Calamansi',
    lat: 10.3157, lng: 123.8854,
    specialty: 'Lechon sa Sugbo',
    famousDishes: [
      { name: 'Pasil Tuslob Buwa', desc: 'Frothy pig brain & liver stew cooked with onions & chili, dipped with puso (hanging rice).' },
      { name: 'Cebuano Ngohiong', desc: 'Crispy five-spice fried lumpia stuffed with ubod/singkamas, served with garlic brown dip.' },
      { name: 'Lechon sa Sugbo', desc: 'World-famous herb & lemongrass stuffed charcoal roasted pork with super crispy skin.' },
      { name: 'Ginabot (Chicharon Bulaklak)', desc: 'Deep-fried pork mesentery, a legendary Cebuano night market street food staple.' },
    ],
  },
  'Lapu-Lapu City': {
    marketTitle: 'Mactan Public Market & Saang Pier (Lapu-Lapu City)',
    palengkeItems: 'Tangigue, Saang, Bakasi, Calamansi, Fresh Lato',
    lat: 10.3103, lng: 123.9494,
    specialty: 'Sutukil Seafood Trilogy',
    famousDishes: [
      { name: 'Sutukil Seafood Trilogy', desc: 'Iconic 3-way seafood meal: Sugba (Grilled), Tula (Fish Soup), and Kinilaw (Raw Cured).' },
      { name: 'Linarang na Bakasi sa Cordova', desc: 'Cordova moray eel stew cooked with kamias souring broth, black beans, and chili.' },
      { name: 'Presko nga Saang sa Mactan', desc: 'Steamed local sea snails dipped in spicy native tuba vinegar and ginger.' },
    ],
  },
  'Carcar City': {
    marketTitle: 'Carcar City Public Market (Palengke sa Carcar)',
    palengkeItems: 'Native Pork, Ampaw, Chicharon, Kangkong, Squash, Sitaw',
    lat: 10.1044, lng: 123.6419,
    specialty: 'Chicharon sa Carcar',
    famousDishes: [
      { name: 'Chicharon sa Carcar', desc: 'Famous crunchy pork cracklings crafted with thick savory meat & fat layers.' },
      { name: 'Ampaw sa Carcar', desc: 'Puffed rice crispy square treats bound with sweet native syrup and peanuts.' },
      { name: 'Humba sa Carcar', desc: 'Tender pork belly braised with fermented black beans, banana blossoms, and tuba sugar.' },
    ],
  },
};

/**
 * Fetches a city food profile.
 * Tries the backend API first (Supabase cache → Gemini AI).
 * Falls back to static data if city is in the static list.
 * Returns null if nothing found.
 *
 * @param {string} cityName - Name of the city or municipality
 * @returns {Promise<object|null>} City food profile or null
 */
export async function getCityFoodProfile(cityName) {
  if (!cityName) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `${API_URL}/api/city-food?city=${encodeURIComponent(cityName)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data?.profile) return data.profile;
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn(`[CityFoodService] API error for "${cityName}":`, err.message);
    }
  }

  // Offline fallback: return static data if available
  if (STATIC_FALLBACK[cityName]) {
    console.log(`[CityFoodService] Using static fallback for "${cityName}"`);
    return STATIC_FALLBACK[cityName];
  }

  return null;
}

/**
 * Fetches all pre-seeded city profiles from Supabase (for map markers).
 * Returns an array of { city_name, lat, lng, specialty } for marker pins.
 *
 * @returns {Promise<Array>} Array of city marker data
 */
export async function getAllCityMarkers() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${API_URL}/api/city-food/markers`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return data?.markers || [];
    }
  } catch (err) {
    console.warn('[CityFoodService] Failed to load markers:', err.message);
  }

  // Fallback: build markers from static data
  return Object.entries(STATIC_FALLBACK).map(([name, profile]) => ({
    city_name: name,
    lat: profile.lat,
    lng: profile.lng,
    specialty: profile.specialty || profile.famousDishes?.[0]?.name || '',
  }));
}
