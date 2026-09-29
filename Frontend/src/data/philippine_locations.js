/**
 * philippine_locations.js
 * Comprehensive directory of Philippine cities, culinary hubs, and municipalities
 * covering Luzon, Visayas, Mindanao, NCR, and all 53 Cebu LGUs.
 */

import { CEBU_LOCATIONS, CEBU_CITY_COORDINATES } from './cebu_locations';

export const PHILIPPINE_REGIONS = [
  'All',
  'Luzon',
  'Visayas',
  'Mindanao',
  'NCR',
  'Cebu',
];

export const POPULAR_CULINARY_HUBS = [
  { name: 'Pampanga (San Fernando)', specialty: 'Authentic Sisig & Bringhe', region: 'Luzon' },
  { name: 'Iloilo City', specialty: 'La Paz Batchoy & Pancit Molo', region: 'Visayas' },
  { name: 'Bacolod City', specialty: 'Chicken Inasal & Kansi', region: 'Visayas' },
  { name: 'Davao City', specialty: 'Sinuglaw & Grilled Yellowfin Tuna', region: 'Mindanao' },
  { name: 'Cebu City', specialty: 'Lechon sa Sugbo & Ngohiong', region: 'Cebu' },
  { name: 'Baguio City', specialty: 'Pinikpikan & Strawberry Highland Bowl', region: 'Luzon' },
  { name: 'Naga City (Bicol)', specialty: 'Bicol Express & Laing sa Gata', region: 'Luzon' },
  { name: 'Batangas City', specialty: 'Batangas Bulalo & Lomi Batangas', region: 'Luzon' },
  { name: 'Tagaytay City', specialty: 'Bulalo Tagaytay & Fresh Tawilis', region: 'Luzon' },
  { name: 'Manila', specialty: 'Bistek Tagalog & Fresh Lumpia', region: 'NCR' },
  { name: 'General Santos City', specialty: 'Tuna Panga Inasal & Fresh Sashimi', region: 'Mindanao' },
  { name: 'Zamboanga City', specialty: 'Curacha with Alavar Sauce & Satti', region: 'Mindanao' },
];

export const PHILIPPINE_LOCATIONS = [
  // === POPULAR PHILIPPINE CULINARY HUBS & PROVINCIAL CAPITALS ===
  {
    name: 'Pampanga (San Fernando)',
    province: 'Pampanga',
    region: 'Luzon',
    specialty: 'Authentic Sisig & Bringhe',
    marketTitle: 'San Fernando Old Public Market & Pampanga Food Hub',
    palengkeItems: 'Pork, Kangkong, Calamansi, Onions, Native Eggs, Tofu',
    lat: 15.0343,
    lng: 120.6896,
  },
  {
    name: 'Angeles City',
    province: 'Pampanga',
    region: 'Luzon',
    specialty: 'Sizzling Sisig & Tokwa’t Baboy',
    marketTitle: 'Pampang Public Market (Angeles City)',
    palengkeItems: 'Pork cuts, Tofu, Calamansi, Siling Labuyo, Onions',
    lat: 15.1450,
    lng: 120.5887,
  },
  {
    name: 'Iloilo City',
    province: 'Iloilo',
    region: 'Visayas',
    specialty: 'La Paz Batchoy & Pancit Molo',
    marketTitle: 'Iloilo Central Market & Super Fish Port',
    palengkeItems: 'Fresh Miki, Beef Shank, Chicharon, Kadyos, Calamansi',
    lat: 10.7202,
    lng: 122.5621,
  },
  {
    name: 'Bacolod City',
    province: 'Negros Occidental',
    region: 'Visayas',
    specialty: 'Chicken Inasal & Kansi',
    marketTitle: 'Burgos Public Market (Bacolod City)',
    palengkeItems: 'Native Chicken, Batwan, Beef Shank, Sinamak, Garlic',
    lat: 10.6766,
    lng: 122.9570,
  },
  {
    name: 'Davao City',
    province: 'Davao del Sur',
    region: 'Mindanao',
    specialty: 'Sinuglaw & Grilled Yellowfin Tuna',
    marketTitle: 'Bankerohan Public Market (Davao City)',
    palengkeItems: 'Yellowfin Tuna Belly, Sinuglaw Pork, Pomelo, Durian, Kangkong',
    lat: 7.1907,
    lng: 125.6128,
  },
  {
    name: 'Baguio City',
    province: 'Benguet',
    region: 'Luzon',
    specialty: 'Pinikpikan & Strawberry Highland Bowl',
    marketTitle: 'Baguio City Public Market (Maharlika)',
    palengkeItems: 'Fresh Strawberries, Sayote, Highland Cabbage, Native Etag, Honey',
    lat: 16.4023,
    lng: 120.5960,
  },
  {
    name: 'Naga City (Bicol)',
    province: 'Camarines Sur',
    region: 'Luzon',
    specialty: 'Bicol Express & Laing sa Gata',
    marketTitle: 'Naga City People’s Mall',
    palengkeItems: 'Dried Gabi Leaves, Fresh Kakang Gata, Siling Labuyo, Pork Tenderloin',
    lat: 13.6218,
    lng: 123.1948,
  },
  {
    name: 'Legazpi City (Bicol)',
    province: 'Albay',
    region: 'Luzon',
    specialty: 'Pinangat & Spicy Bicolano Express',
    marketTitle: 'Legazpi City Public Market (LCC Terminal)',
    palengkeItems: 'Taro Leaves, Coconut Milk, Fresh Sili, Native Fish, Lemongrass',
    lat: 13.1391,
    lng: 123.7438,
  },
  {
    name: 'Batangas City',
    province: 'Batangas',
    region: 'Luzon',
    specialty: 'Batangas Bulalo & Lomi Batangas',
    marketTitle: 'Batangas City Public Market',
    palengkeItems: 'Beef Shank, Bone Marrow, Fresh Miki, Calamansi, Atsuete, Garlic',
    lat: 13.7565,
    lng: 121.0583,
  },
  {
    name: 'Lipa City',
    province: 'Batangas',
    region: 'Luzon',
    specialty: 'Lomi Special & Batangas Goto',
    marketTitle: 'Lipa City Public Market',
    palengkeItems: 'Beef Tripe, Lomi Noodles, Liver, Kapeng Barako, Eggs',
    lat: 13.9419,
    lng: 121.1644,
  },
  {
    name: 'Tagaytay City',
    province: 'Cavite',
    region: 'Luzon',
    specialty: 'Bulalo Tagaytay & Fresh Tawilis',
    marketTitle: 'Mahogany Beef Market (Tagaytay)',
    palengkeItems: 'Fresh Beef Shank, Tawilis, Local Pineapples, Sweet Corn, Pechay',
    lat: 14.1153,
    lng: 120.9621,
  },
  {
    name: 'Manila',
    province: 'Metro Manila',
    region: 'NCR',
    specialty: 'Bistek Tagalog & Fresh Lumpia',
    marketTitle: 'Divisoria & Quinta Market (Quiapo)',
    palengkeItems: 'Beef Tenderloin, Calamansi, Ubod, Soy Sauce, Onions, Garlic',
    lat: 14.5995,
    lng: 120.9842,
  },
  {
    name: 'Quezon City',
    province: 'Metro Manila',
    region: 'NCR',
    specialty: 'Pork Sinigang & Crispy Tofu Sisig',
    marketTitle: 'Balintawak Public Market & Nepa Q-Mart',
    palengkeItems: 'Pork/Tofu, Sampalok Broth, Kangkong, Radish, Sitaw, Tomatoes',
    lat: 14.6760,
    lng: 121.0437,
  },
  {
    name: 'Makati City',
    province: 'Metro Manila',
    region: 'NCR',
    specialty: 'Artisan Healthy Filipino Bowls',
    marketTitle: 'Salcedo & Legazpi Community Markets',
    palengkeItems: 'Brown Rice, Organic Greens, Lean Chicken Breast, Calamansi, Tofu',
    lat: 14.5547,
    lng: 121.0244,
  },
  {
    name: 'Pasig City',
    province: 'Metro Manila',
    region: 'NCR',
    specialty: 'Pancit Habhab & Nilagang Baka',
    marketTitle: 'Pasig City Mega Market',
    palengkeItems: 'Miki Noodles, Beef Flank, Sayote, Pechay Baguio, Calamansi',
    lat: 14.5764,
    lng: 121.0851,
  },
  {
    name: 'Taguig City',
    province: 'Metro Manila',
    region: 'NCR',
    specialty: 'Tipas Hopia & Modern Pinoy Macro Bowls',
    marketTitle: 'Taguig People’s Market & FTI Agri-Hub',
    palengkeItems: 'Lean Chicken, Eggs, Mongo, Kangkong, Fresh Herbs',
    lat: 14.5176,
    lng: 121.0509,
  },
  {
    name: 'Zamboanga City',
    province: 'Zamboanga del Sur',
    region: 'Mindanao',
    specialty: 'Curacha with Alavar Sauce & Satti',
    marketTitle: 'Zamboanga Waterfront Port & Central Market',
    palengkeItems: 'Curacha (Spanner Crab), Alavar Spices, Chicken Satti, Tuba Vinegar',
    lat: 6.9214,
    lng: 122.0790,
  },
  {
    name: 'Cagayan de Oro',
    province: 'Misamis Oriental',
    region: 'Mindanao',
    specialty: 'Sinuglaw & Pastel de Camiguin',
    marketTitle: 'Cogon Public Market & Carmen Market',
    palengkeItems: 'Fresh Tuna, Pork Liempo, Suha, Native Ginger, Cucumber',
    lat: 8.4542,
    lng: 124.6319,
  },
  {
    name: 'General Santos City',
    province: 'South Cotabato',
    region: 'Mindanao',
    specialty: 'Tuna Panga Inasal & Fresh Sashimi',
    marketTitle: 'General Santos Fish Port Complex',
    palengkeItems: 'Export-Grade Yellowfin Tuna, Tuna Belly, Calamansi, Garlic, Saba',
    lat: 6.1164,
    lng: 125.1716,
  },
  {
    name: 'Tacloban City',
    province: 'Leyte',
    region: 'Visayas',
    specialty: 'Waray Sinigang & Binagol',
    marketTitle: 'Tacloban Supermarket & Fish Port',
    palengkeItems: 'Fresh Reef Fish, Taro (Talyan), Coconut Milk, Kamias, Sitaw',
    lat: 11.2444,
    lng: 125.0039,
  },
  {
    name: 'Ormoc City',
    province: 'Leyte',
    region: 'Visayas',
    specialty: 'Ormoc Sweet Queen Pineapple & Inun-unan',
    marketTitle: 'Ormoc City Public Market',
    palengkeItems: 'Queen Pineapple, Fresh Mackerel, Native Vinegar, Bittergourd',
    lat: 11.0050,
    lng: 124.6075,
  },
  {
    name: 'Dumaguete City',
    province: 'Negros Oriental',
    region: 'Visayas',
    specialty: 'Silvanas & Budbod Kabog',
    marketTitle: 'Dumaguete Public Market & Rizal Boulevard',
    palengkeItems: 'Kabog (Millet), Native Eggs, Cashew Nuts, Bangus, Malunggay',
    lat: 9.3068,
    lng: 123.3054,
  },
  {
    name: 'Tagbilaran City (Bohol)',
    province: 'Bohol',
    region: 'Visayas',
    specialty: 'Chicken Binakol & Boholano Kalamay',
    marketTitle: 'Tagbilaran City Central Market',
    palengkeItems: 'Native Chicken, Young Coconut Water, Ginger, Lemongrass, Glutinous Rice',
    lat: 9.6444,
    lng: 123.8556,
  },
  {
    name: 'Vigan City',
    province: 'Ilocos Sur',
    region: 'Luzon',
    specialty: 'Vigan Empanada & Pinakbet with Bagnet',
    marketTitle: 'Vigan Public Market',
    palengkeItems: 'Vigan Longganisa, Green Papaya, Native Eggs, Ampalaya, Talong, Okra',
    lat: 17.5747,
    lng: 120.3869,
  },
  {
    name: 'Laoag City',
    province: 'Ilocos Norte',
    region: 'Luzon',
    specialty: 'Ilocano Poqui-Poqui & Dinengdeng',
    marketTitle: 'Laoag City Commercial Complex',
    palengkeItems: 'Roasted Eggplant, Native Eggs, Tomatoes, Malunggay, Saluyot',
    lat: 18.1960,
    lng: 120.5927,
  },
  {
    name: 'Dagupan City',
    province: 'Pangasinan',
    region: 'Luzon',
    specialty: 'Boneless Bangus Dagupan & Pigar-Pigar',
    marketTitle: 'Malimgas Public Market (Dagupan)',
    palengkeItems: 'Boneless Bangus, Carabao Beef, Cabbage, Onions, Calamansi',
    lat: 16.0433,
    lng: 120.3333,
  },
  {
    name: 'Puerto Princesa',
    province: 'Palawan',
    region: 'Luzon',
    specialty: 'Chao Long Noodles & Fresh Seafood Kinilaw',
    marketTitle: 'Puerto Princesa Old & New Public Market',
    palengkeItems: 'Fresh Lapu-Lapu, Beef Shank, Mint, Mung Bean Sprouts, Calamansi',
    lat: 9.7392,
    lng: 118.7353,
  },
  {
    name: 'Roxas City (Capiz)',
    province: 'Capiz',
    region: 'Visayas',
    specialty: 'Seafood Capital Steamed Crabs & Diwal',
    marketTitle: 'Teodoro Arcenas Trade Center (TATC)',
    palengkeItems: 'Diwal (Angel Wings Clams), Prawns, Mud Crabs, Calamansi, Ginger',
    lat: 11.5853,
    lng: 122.7511,
  },
  {
    name: 'Calamba City',
    province: 'Laguna',
    region: 'Luzon',
    specialty: 'Buko Pie & Kesong Puti',
    marketTitle: 'Calamba Public Market',
    palengkeItems: 'Carabao Milk, Young Coconut, Native Rice, Tilapia from Laguna Lake',
    lat: 14.2117,
    lng: 121.1656,
  },
  {
    name: 'Lucena City',
    province: 'Quezon',
    region: 'Luzon',
    specialty: 'Pancit Habhab & Lucban Longganisa',
    marketTitle: 'Lucena Public Market',
    palengkeItems: 'Miki Lucban, Oregano Pork, Sukang Irok, Chayote, Carrots',
    lat: 13.9314,
    lng: 121.6172,
  },
  {
    name: 'Antipolo City',
    province: 'Rizal',
    region: 'Luzon',
    specialty: 'Roasted Cashews & Suman sa Ibos',
    marketTitle: 'Antipolo Public Market',
    palengkeItems: 'Fresh Cashews, Glutinous Rice, Pure Honey, Native Mangoes',
    lat: 14.5842,
    lng: 121.1763,
  },
  {
    name: 'Iligan City',
    province: 'Lanao del Norte',
    region: 'Mindanao',
    specialty: 'Lechon de Iligan & Halang-Halang',
    marketTitle: 'Pala-o Public Market (Iligan)',
    palengkeItems: 'Native Chicken, Coconut Milk, Chili, Lemongrass, Beef Flank',
    lat: 8.2280,
    lng: 124.2452,
  },
  {
    name: 'Butuan City',
    province: 'Agusan del Norte',
    region: 'Mindanao',
    specialty: 'Palagsing & Nilagpang na Isda',
    marketTitle: 'Langihan Public Market (Butuan)',
    palengkeItems: 'Sago Starch, Char-grilled Tilapia, Tomatoes, Calamansi, Native Greens',
    lat: 8.9492,
    lng: 125.5436,
  },
  {
    name: 'Cotabato City',
    province: 'Maguindanao',
    region: 'Mindanao',
    specialty: 'Pastil (Maguindanaoan Steamed Rice with Kagikit)',
    marketTitle: 'Cotabato Mega Market',
    palengkeItems: 'Shredded Chicken, Native Rice, Banana Leaves, Garlic, Soy Sauce',
    lat: 7.2236,
    lng: 124.2464,
  },
  {
    name: 'Koronadal City',
    province: 'South Cotabato',
    region: 'Mindanao',
    specialty: 'Hinatukan na Manok & Organic Salad Greens',
    marketTitle: 'Koronadal Commercial Center Public Market',
    palengkeItems: 'Free-range Chicken, Coconut Milk, Ginger, Native Squash',
    lat: 6.5033,
    lng: 124.8489,
  },
  {
    name: 'Malaybalay City',
    province: 'Bukidnon',
    region: 'Mindanao',
    specialty: 'Highland Bukidnon Beef & Sweet Corn',
    marketTitle: 'Malaybalay City Public Market',
    palengkeItems: 'Grass-fed Beef, Sweet Corn, Highland Cabbage, Arabica Coffee',
    lat: 8.1575,
    lng: 125.1278,
  },
];

// Append all 53 Cebu LGUs to ensure 100% full coverage
CEBU_LOCATIONS.forEach((cebuTown) => {
  const coords = CEBU_CITY_COORDINATES[cebuTown] || { lat: 10.3157, lng: 123.8854 };
  const existing = PHILIPPINE_LOCATIONS.find((l) => l.name.toLowerCase() === cebuTown.toLowerCase());
  if (!existing) {
    PHILIPPINE_LOCATIONS.push({
      name: cebuTown,
      province: 'Cebu',
      region: 'Cebu',
      specialty: cebuTown.includes('Carcar')
        ? 'Chicharon & Ampaw sa Carcar'
        : cebuTown.includes('Lapu-Lapu')
          ? 'Sutukil Seafood Trilogy'
          : cebuTown.includes('Talisay')
            ? 'Inasal sa Talisay'
            : cebuTown.includes('Balamban')
              ? 'Liempo sa Balamban'
              : cebuTown.includes('Argao')
                ? 'Torta & Sikwate sa Argao'
                : 'Palengke Seafood & Fresh Produce',
      marketTitle: `${cebuTown} Public Market`,
      palengkeItems: 'Fresh Fish, Native Greens, Calamansi, Kamote, Chicken',
      lat: coords.lat,
      lng: coords.lng,
    });
  }
});

// Coordinate lookup dictionary
export const PHILIPPINE_CITY_COORDINATES = PHILIPPINE_LOCATIONS.reduce((acc, loc) => {
  acc[loc.name] = { lat: loc.lat, lng: loc.lng };
  return acc;
}, {});

/**
 * Normalizes any free-form location text into the closest matched Philippine city/municipality
 */
export function normalizeToPhilippineLocation(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const clean = rawText.trim().toLowerCase();

  // 1. Direct match
  const direct = PHILIPPINE_LOCATIONS.find(
    (l) => l.name.toLowerCase() === clean || (l.province && l.province.toLowerCase() === clean)
  );
  if (direct) return direct.name;

  // 2. Keyword substring matching
  const matched = PHILIPPINE_LOCATIONS.find((l) => {
    const lName = l.name.toLowerCase();
    const cleanNoCity = clean.replace(/\s+(city|municipality|province)\b/gi, '').trim();
    const locNoCity = lName.replace(/\s+(city|municipality|province)\b/gi, '').trim();
    return clean.includes(locNoCity) || lName.includes(cleanNoCity);
  });

  return matched ? matched.name : null;
}

/**
 * Searches Philippine locations by query and optional region filter
 */
export function searchPhilippineLocations(query = '', regionFilter = 'All') {
  const q = query.trim().toLowerCase();

  return PHILIPPINE_LOCATIONS.filter((item) => {
    // Region check
    if (regionFilter !== 'All') {
      if (regionFilter === 'Cebu' && item.region !== 'Cebu') return false;
      if (regionFilter === 'Visayas' && item.region !== 'Visayas' && item.region !== 'Cebu') return false;
      if (regionFilter !== 'Cebu' && regionFilter !== 'Visayas' && item.region !== regionFilter) return false;
    }

    if (!q) return true;

    return (
      item.name.toLowerCase().includes(q) ||
      (item.province && item.province.toLowerCase().includes(q)) ||
      (item.specialty && item.specialty.toLowerCase().includes(q)) ||
      (item.palengkeItems && item.palengkeItems.toLowerCase().includes(q))
    );
  });
}
