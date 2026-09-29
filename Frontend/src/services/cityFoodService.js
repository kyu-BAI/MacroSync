/**
 * cityFoodService.js
 * Fetches local food profiles for Philippine cities/municipalities.
 * Flow: Supabase cache → Gemini AI generation → fallback static data
 */

import API_URL from '../screens/config/api';

// Static fallback for offline mode — iconic Philippine culinary capitals
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
  'Pampanga (San Fernando)': {
    marketTitle: 'San Fernando Old Public Market & Pampanga Food Hub',
    palengkeItems: 'Pork, Kangkong, Calamansi, Onions, Native Eggs, Tofu',
    lat: 15.0343, lng: 120.6896,
    specialty: 'Authentic Kapampangan Sisig',
    famousDishes: [
      { name: 'Sizzling Sisig', desc: 'The crown jewel of Pampanga—crisped seasoned pork cheek, chicken liver, onions, and calamansi.' },
      { name: 'Pampanga Bringhe', desc: 'Pinoy fiesta rice slow-cooked with coconut milk, native turmeric, chicken, and boiled eggs.' },
      { name: 'Tibok-Tibok', desc: 'Silky delicate pudding handcrafted with fresh carabao milk and latik coconut curd.' },
    ],
  },
  'Iloilo City': {
    marketTitle: 'Iloilo Central Market & Super Fish Port',
    palengkeItems: 'Fresh Miki, Beef Shank, Chicharon, Kadyos, Calamansi',
    lat: 10.7202, lng: 122.5621,
    specialty: 'Original La Paz Batchoy',
    famousDishes: [
      { name: 'La Paz Batchoy', desc: 'World-renowned noodle soup in rich pork and bone marrow broth, topped with pork cracklings and egg.' },
      { name: 'Pancit Molo', desc: 'Silky pork and shrimp wonton dumplings in aromatic chicken broth garnished with toasted garlic.' },
      { name: 'KBL (Kadyos, Baboy, Langka)', desc: 'Iconic sour stew flavored with batwan fruit, tender pork, pigeon peas, and jackfruit.' },
    ],
  },
  'Bacolod City': {
    marketTitle: 'Burgos Public Market (Bacolod City)',
    palengkeItems: 'Native Chicken, Batwan, Beef Shank, Sinamak, Garlic',
    lat: 10.6766, lng: 122.9570,
    specialty: 'Authentic Bacolod Chicken Inasal',
    famousDishes: [
      { name: 'Chicken Inasal', desc: 'Charcoal-grilled chicken marinated in calamansi, sinamak vinegar, ginger, and basted with annatto oil.' },
      { name: 'Bacolod Kansi', desc: 'Cross between bulalo and sinigang—savory beef bone marrow simmered in sour native batwan fruit.' },
      { name: 'Bacolod Piaya', desc: 'Flaky unleavened flatbread stuffed with sweet muscovado sugar and toasted sesame seeds.' },
    ],
  },
  'Davao City': {
    marketTitle: 'Bankerohan Public Market (Davao City)',
    palengkeItems: 'Yellowfin Tuna Belly, Sinuglaw Pork, Pomelo, Durian, Kangkong',
    lat: 7.1907, lng: 125.6128,
    specialty: 'Davao Sinuglaw & Grilled Yellowfin Tuna',
    famousDishes: [
      { name: 'Davao Sinuglaw', desc: 'Masterful pairing of fresh tuna kinilaw and charcoal-grilled pork belly with spiced tuba vinegar.' },
      { name: 'Grilled Tuna Panga', desc: 'Charbroiled succulent yellowfin tuna jaw brushed with savory calamansi and soy glaze.' },
      { name: 'Malagos Dark Chocolate & Pomelo', desc: 'Award-winning single-origin Davao chocolate and world-famous sweet Davao pomelos.' },
    ],
  },
  'Baguio City': {
    marketTitle: 'Baguio City Public Market (Maharlika)',
    palengkeItems: 'Fresh Strawberries, Sayote, Highland Cabbage, Native Etag, Honey',
    lat: 16.4023, lng: 120.5960,
    specialty: 'Pinikpikan & Strawberry Highland Delicacies',
    famousDishes: [
      { name: 'Cordilleran Pinikpikan with Etag', desc: 'Traditional highland chicken soup simmered with cured smoked pork (etag) and chayote.' },
      { name: 'Highland Strawberry Salad Bowl', desc: 'Crisp fresh Benguet greens tossed with handpicked strawberries, walnuts, and honey vinaigrette.' },
      { name: 'Benguet Vegetable Chop Suey', desc: 'Super fresh mountain-grown cauliflower, carrots, snow peas, and bell peppers.' },
    ],
  },
  'Naga City (Bicol)': {
    marketTitle: 'Naga City People’s Mall (Bicol)',
    palengkeItems: 'Dried Gabi Leaves, Fresh Kakang Gata, Siling Labuyo, Pork Tenderloin',
    lat: 13.6218, lng: 123.1948,
    specialty: 'Spicy Bicol Express & Laing sa Gata',
    famousDishes: [
      { name: 'Authentic Bicol Express', desc: 'Fiery stew of tender pork simmered with copious fresh siling labuyo, garlic, and coconut cream.' },
      { name: 'Bicolano Laing', desc: 'Slow-cooked dried taro leaves steeped in rich coconut milk, shrimp paste, and native spices.' },
      { name: 'Pinangat sa Camalig', desc: 'Pouches of shredded taro leaves and fish or pork tied with banana leaf and cooked in thick gata.' },
    ],
  },
  'Batangas City': {
    marketTitle: 'Batangas City Public Market',
    palengkeItems: 'Beef Shank, Bone Marrow, Fresh Miki, Calamansi, Atsuete, Garlic',
    lat: 13.7565, lng: 121.0583,
    specialty: 'Batangas Bulalo & Lomi Batangas',
    famousDishes: [
      { name: 'Batangas Beef Bulalo', desc: 'Slow-simmered beef shank and bone marrow in crystal-clear broth with sweet corn and pechay.' },
      { name: 'Lomi Batangas', desc: 'Thick eggy noodle soup laden with pork liver, meatballs, and chicharon, eaten with calamansi-soy-chili.' },
      { name: 'Tapang Taal', desc: 'Garlicky sweet-savory cured pork or beef slices seared crisp in native oil.' },
    ],
  },
  'Manila': {
    marketTitle: 'Divisoria & Quinta Market (Quiapo)',
    palengkeItems: 'Beef Tenderloin, Calamansi, Ubod, Soy Sauce, Onions, Garlic',
    lat: 14.5995, lng: 120.9842,
    specialty: 'Bistek Tagalog & Fresh Lumpia',
    famousDishes: [
      { name: 'Bistek Tagalog', desc: 'Marinated beef slices braised with calamansi juice, soy sauce, and smothered in sweet onion rings.' },
      { name: 'Fresh Lumpiang Ubod', desc: 'Soft homemade crepe filled with sautéed heart of palm, carrots, and sweet garlic-peanut sauce.' },
      { name: 'Sinigang na Baboy sa Sampalok', desc: 'Classic Manila comfort soup of tender pork in tart, aromatic tamarind broth with kangkong and radish.' },
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
  const cleanKey = Object.keys(STATIC_FALLBACK).find(
    (k) =>
      k.toLowerCase() === cityName.toLowerCase() ||
      cityName.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(cityName.toLowerCase())
  );
  if (cleanKey && STATIC_FALLBACK[cleanKey]) {
    console.log(`[CityFoodService] Using fuzzy static fallback "${cleanKey}" for "${cityName}"`);
    return STATIC_FALLBACK[cleanKey];
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

  // Fallback: return empty array so no default city markers pop up
  return [];
}
