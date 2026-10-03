/**
 * philippineFoodEngine.js
 * Generates goal-aligned 1-day meal plans using authentic famous foods
 * from ANY Philippine location, ensuring the user's progress NEVER stagnates.
 */

import { LOCATION_MEALS } from './cebuPalengkeMeals';

// Rich Regional Philippine Culinary Catalogs
export const PHILIPPINE_REGIONAL_MEALS = {
  'Pampanga': {
    breakfast: [
      { name: 'Lean Kapampangan Beef Tapa with Garlic Brown Rice & Poached Egg', base: 'Beef Tapa' },
      { name: 'Pan-Toasted Tofu & Native Greens Scramble with Calamansi', base: 'Kapampangan Greens' },
      { name: 'Steamed Sweet Kamote with Calamansi-Infused Native Herbal Tea', base: 'Kamote & Tea' },
    ],
    lunch: [
      { name: 'Authentic Kapampangan Lean Chicken & Tofu Sisig with Calamansi', base: 'Kapampangan Sisig' },
      { name: 'Herb-Simmered Pampanga Bringhe (Turmeric Native Rice with Chicken Breast)', base: 'Bringhe' },
      { name: 'Light Pampanga Morcon with Steamed String Beans & Carrots', base: 'Morcon' },
    ],
    snack: [
      { name: 'Warm Roasted Native Peanuts with Calamansi Chilled Water', base: 'Roasted Peanuts' },
      { name: 'Low-Sugar Tibok-Tibok (Carabao Milk Pudding) with Toasted Coconut', base: 'Tibok-Tibok' },
      { name: 'Crispy Singkamas & Cucumber Slices with Spiced Native Vinegar Dip', base: 'Singkamas Dip' },
    ],
    dinner: [
      { name: 'Pampanga Guisadong Bulanglang with Guava Broth & Grilled Tilapia', base: 'Bulanglang sa Bayabas' },
      { name: 'Lean Pork Tenderloin Asado with Braised Tomatoes & Steamed Rice', base: 'Asado Kapampangan' },
      { name: 'Grilled Bangus Belly with Ensaladang Talong and Calamansi', base: 'Grilled Bangus' },
    ],
  },
  'Iloilo': {
    breakfast: [
      { name: 'Ilonggo Garlic Fried Brown Rice with Sunny Native Egg & Salted Danggit', base: 'Ilonggo Silog' },
      { name: 'Steamed Saba Banana with Native Ginger Salabat', base: 'Saba & Ginger' },
      { name: 'Guisadong Alugbati at Kamatis with Soft-Boiled Egg', base: 'Alugbati Scramble' },
    ],
    lunch: [
      { name: 'Heritage La Paz Batchoy (Clear Beef Shank Broth with Lean Meat & Egg)', base: 'La Paz Batchoy' },
      { name: 'Healthy Pancit Molo (Chicken & Prawn Dumpling Soup with Spring Onions)', base: 'Pancit Molo' },
      { name: 'KBL Stew (Kadyos, Lean Baboy, and Green Jackfruit with Batwan Broth)', base: 'Ilonggo KBL' },
    ],
    snack: [
      { name: 'Iloilo Native Buko Juice & Roasted Saba Banana', base: 'Buko & Saba' },
      { name: 'Fresh Guimaras Mango Slices with Chilled Calamansi Water', base: 'Guimaras Mango' },
      { name: 'Baye-Baye Rice Cake Portion with Hot Green Tea', base: 'Baye-Baye' },
    ],
    dinner: [
      { name: 'Laswa (Ilonggo Native Vegetable Soup with Pasayan Shrimp & Squash)', base: 'Ilonggo Laswa' },
      { name: 'Sinugba nga Manok Bisaya with Calamansi and Sinamak Dip', base: 'Sinugba Manok' },
      { name: 'Kinilaw nga Tangigue with Cucumber and Spiced Tuba Vinegar', base: 'Ilonggo Kinilaw' },
    ],
  },
  'Bacolod': {
    breakfast: [
      { name: 'Bacolod Garlic Garlic Rice Bowl with Skinless Chicken Bits & Egg', base: 'Garlic Rice Bowl' },
      { name: 'Toasted Pan de Sal with Native White Cheese & Fresh Calamansi', base: 'Pan de Sal & Cheese' },
      { name: 'Scrambled Eggs with Tomatoes, Onions & Steamed Kamote', base: 'Kamote & Eggs' },
    ],
    lunch: [
      { name: 'Authentic Bacolod Chicken Inasal (Skinless Breast Marinated in Sinamak & Lemongrass)', base: 'Chicken Inasal' },
      { name: 'Bacolod Kansi (Sour Batwan Broth with Lean Beef Shank & Green Jackfruit)', base: 'Bacolod Kansi' },
      { name: 'Grilled Blue Marlin Steak with Bacolod Annatto Spiced Rice', base: 'Grilled Marlin' },
    ],
    snack: [
      { name: 'Single Bacolod Piaya Crisp with Fresh Lemongrass Iced Tea', base: 'Piaya & Tea' },
      { name: 'Steamed Sweet Corn Ear with Pure Buko Water', base: 'Sweet Corn & Buko' },
      { name: 'Ripe Papaya Slices with Squeezed Calamansi Juice', base: 'Papaya Calamansi' },
    ],
    dinner: [
      { name: 'Sinugba nga Baboy (Lean Cut) with Ensaladang Lato and Tomatoes', base: 'Sinugba Baboy' },
      { name: 'Tinolang Isda sa Batwan with Malunggay and Lemongrass Broth', base: 'Tinolang Isda' },
      { name: 'Inasal-Style Grilled Tofu Skewers with Spiced Garlic Vinegar', base: 'Inasal Tofu' },
    ],
  },
  'Davao': {
    breakfast: [
      { name: 'Davao Yellowfin Tuna Flakes Rice Bowl with Poached Native Egg', base: 'Tuna Flakes Bowl' },
      { name: 'Steamed Kamote and Malunggay Omelette with Calamansi Tea', base: 'Kamote Omelette' },
      { name: 'Charred Saging na Saba with Pure Native Cocoa (Tablea) Drink', base: 'Saba & Tablea' },
    ],
    lunch: [
      { name: 'Davao Sinuglaw (Fresh Tuna Kinilaw and Grilled Lean Pork Belly Cubes)', base: 'Davao Sinuglaw' },
      { name: 'Charcoal-Grilled Yellowfin Tuna Panga with Calamansi & Soy Dip', base: 'Tuna Panga' },
      { name: 'Davao Law-oy (Mixed Highland Vegetables in Clear Native Fish Broth)', base: 'Law-oy Stew' },
    ],
    snack: [
      { name: 'Fresh Davao Sweet Pomelo Slices with Chilled Calamansi Water', base: 'Davao Pomelo' },
      { name: 'Boiled Sweet Corn with Coconut Water', base: 'Davao Corn' },
      { name: 'Malagos Dark Chocolate Drink (Sugar-Free) with Roasted Peanuts', base: 'Dark Chocolate' },
    ],
    dinner: [
      { name: 'Grilled Yellowfin Tuna Steak with Ensaladang Talong & Brown Rice', base: 'Tuna Steak' },
      { name: 'Native Chicken Halang-Halang with Crushed Ginger and Chili Greens', base: 'Halang-Halang' },
      { name: 'Sinugbang Bariles with Steamed Kangkong and Tomato Relish', base: 'Sinugba Bariles' },
    ],
  },
  'Baguio': {
    breakfast: [
      { name: 'Highland Poached Eggs with Sautéed Baguio Spinach & Brown Toast', base: 'Highland Eggs' },
      { name: 'Benguet Arabica Oatmeal Bowl with Fresh Strawberries & Honey', base: 'Strawberry Oatmeal' },
      { name: 'Scrambled Native Eggs with Baguio Bell Peppers & Steamed Kamote', base: 'Bell Pepper Scramble' },
    ],
    lunch: [
      { name: 'Heritage Baguio Pinikpikan with Sayote, Malunggay & Lean Native Chicken', base: 'Pinikpikan Stew' },
      { name: 'Baguio Highland Chop Suey with Chicken Breast & Fresh Crisp Veggies', base: 'Highland Chop Suey' },
      { name: 'Grilled Chicken Breast with Baguio Watercress & Strawberry Salad', base: 'Watercress Salad' },
    ],
    snack: [
      { name: 'Fresh Baguio Strawberries with Low-Fat Yogurt', base: 'Strawberries & Yogurt' },
      { name: 'Roasted Benguet Sweet Corn with Hot Ginger Salabat', base: 'Benguet Corn' },
      { name: 'Small Portion Ube Halaya (Sugar-Controlled) with Green Tea', base: 'Ube Portion' },
    ],
    dinner: [
      { name: 'Benguet Vegetable Sinigang with Grilled Salmon Head & Sayote', base: 'Highland Sinigang' },
      { name: 'Stir-Fried Baguio Beans with Lean Beef Tenderloin and Garlic', base: 'Baguio Beans Beef' },
      { name: 'Slow-Simmered Chicken Tinola with Fresh Baguio Chayote & Greens', base: 'Highland Tinola' },
    ],
  },
  'Bicol': {
    breakfast: [
      { name: 'Spicy Native Scrambled Eggs with Tomatoes, Chili & Garlic Brown Rice', base: 'Spicy Egg Bowl' },
      { name: 'Steamed Sweet Kamote with Hot Calamansi Salabat', base: 'Kamote Salabat' },
      { name: 'Grilled Danggit with Sliced Tomatoes, Calamansi and Rice', base: 'Danggit Breakfast' },
    ],
    lunch: [
      { name: 'Healthy Bicol Express (Lean Pork Tenderloin & Chili in Light Coconut Milk)', base: 'Bicol Express' },
      { name: 'Heritage Bicolano Laing (Dried Taro Leaves Simmered in Pure Kakang Gata)', base: 'Bicol Laing' },
      { name: 'Bicolano Pinangat (Steamed Taro Leaf Parcels with Fresh Tuna & Coconut)', base: 'Pinangat sa Gata' },
    ],
    snack: [
      { name: 'Fresh Bicol Pili Nuts (Raw Portion) with Chilled Coconut Water', base: 'Pili Nuts & Buko' },
      { name: 'Steamed Saba Banana with Light Cinnamon Sprinkle', base: 'Steamed Saba' },
      { name: 'Spicy Roasted Corn with Native Calamansi Juice', base: 'Spicy Corn' },
    ],
    dinner: [
      { name: 'Tilmok sa Gata (Fresh White Fish and Grated Young Coconut in Banana Leaf)', base: 'Tilmok' },
      { name: 'Grilled Tilapia with Ensaladang Pako (Native Fiddlehead Fern Salad)', base: 'Ensaladang Pako' },
      { name: 'Sinantol (Spiced Grated Santol in Light Coconut Broth with Lean Chicken)', base: 'Sinantol Chicken' },
    ],
  },
  'Batangas': {
    breakfast: [
      { name: 'Batangas Tapang Taal with Garlic Brown Rice & Poached Egg', base: 'Tapang Taal' },
      { name: 'Kapeng Barako with Boiled Sweet Kamote & Native White Cheese', base: 'Barako & Kamote' },
      { name: 'Scrambled Eggs with Batangas Tomatoes and Red Onions', base: 'Batangas Scramble' },
    ],
    lunch: [
      { name: 'Heritage Batangas Bulalo (Lean Beef Shank Broth with Corn, Pechay & Green Beans)', base: 'Batangas Bulalo' },
      { name: 'Lomi Batangas (Thick Savory Broth with Lean Chicken, Liver & Miki)', base: 'Lomi Batangas' },
      { name: 'Sinaing na Tulingan (Slow-Braised Fish in Clay Pot with Kamias & Pork Fat Rind removed)', base: 'Sinaing na Tulingan' },
    ],
    snack: [
      { name: 'Roasted Native Peanuts with Pure Fresh Buko Water', base: 'Batangas Peanuts' },
      { name: 'Fresh Saba Banana Boiled with a Cup of Kapeng Barako', base: 'Saba & Barako' },
      { name: 'Sliced Batangas Native Mango with Calamansi Dip', base: 'Batangas Mango' },
    ],
    dinner: [
      { name: 'Batangas Goto Special (Tender Beef Flank in Ginger Broth with Calamansi)', base: 'Batangas Goto' },
      { name: 'Inihaw na Bangus with Ensaladang Talong and Calamansi', base: 'Inihaw Bangus' },
      { name: 'Guisadong Sitaw at Kalabasa with Grilled Native Chicken', base: 'Guisadong Gulay' },
    ],
  },
  'NCR': {
    breakfast: [
      { name: 'Metro Manila Beef Bistek Tagalog with Garlic Brown Rice & Fried Egg', base: 'Bistek Silog' },
      { name: 'Arroz Caldo Bowl with Shredded Chicken Breast, Ginger & Hard-Boiled Egg', base: 'Chicken Arroz Caldo' },
      { name: 'Whole Wheat Toast with Smashed Avocado & Soft Native Scramble', base: 'Avocado Scramble' },
    ],
    lunch: [
      { name: 'Healthy Sinigang na Baboy (Lean Pork Tenderloin in Fresh Sampalok Broth & Kangkong)', base: 'Pork Sinigang' },
      { name: 'Fresh Lumpiang Ubod (Heart of Palm Roll with Light Garlic Peanut Sauce)', base: 'Lumpiang Ubod' },
      { name: 'Grilled Chicken Inasal Rice Bowl with Ensaladang Kamatis', base: 'Manila Inasal' },
    ],
    snack: [
      { name: 'Fresh Chilled Buko Juice & Fresh Fruit Medley (Papaya, Melon, Banana)', base: 'Buko & Fruit' },
      { name: 'Single Fresh Hopia Crust with Hot Jasmine Green Tea', base: 'Hopia & Tea' },
      { name: 'Steamed Sweet Corn Ear with Light Sea Salt', base: 'Steamed Corn' },
    ],
    dinner: [
      { name: 'Beef Salpicao (Lean Tenderloin Sautéed with Minced Garlic & Olive Oil)', base: 'Beef Salpicao' },
      { name: 'Ginisang Monggo with Malunggay Leaves & Charred Tilapia Fillet', base: 'Ginisang Monggo' },
      { name: 'Grilled Salmon Belly with Stir-Fried Garlic Kangkong and Calamansi', base: 'Grilled Salmon' },
    ],
  },
  'General Santos': {
    breakfast: [
      { name: 'GenSan Tuna Flakes Tapa with Garlic Rice & Sunny Native Egg', base: 'Tuna Tapa Silog' },
      { name: 'Boiled Saba Banana with Calamansi Salabat and Hard-Boiled Egg', base: 'Saba & Egg' },
      { name: 'Sautéed Kangkong with Poached Egg and Steamed Kamote', base: 'Kangkong Scramble' },
    ],
    lunch: [
      { name: 'GenSan Grilled Tuna Panga Inasal with Calamansi-Chili Sinamak Dip', base: 'Tuna Panga' },
      { name: 'Fresh Yellowfin Tuna Sashimi & Kinilaw with Cucumber Relish', base: 'Tuna Kinilaw' },
      { name: 'Ginataang Bariles (Yellowfin Tuna in Light Coconut Milk with Spinach)', base: 'Ginataang Tuna' },
    ],
    snack: [
      { name: 'Fresh GenSan Sweet Pineapple Slices with Chilled Calamansi Water', base: 'GenSan Pineapple' },
      { name: 'Roasted Native Peanuts with Fresh Buko Juice', base: 'Peanuts & Buko' },
      { name: 'Boiled Sweet Corn on the Cob with Lemon', base: 'Sweet Corn' },
    ],
    dinner: [
      { name: 'Pan-Seared Yellowfin Tuna Steak with Ensaladang Talong & Brown Rice', base: 'Tuna Steak' },
      { name: 'Tinolang Isda (Fresh Yellowfin Tuna in Ginger Lemongrass Broth)', base: 'Tinolang Tuna' },
      { name: 'Grilled Tuna Belly with Garlic Malunggay Greens & Tomatoes', base: 'Grilled Tuna Belly' },
    ],
  },
  'Zamboanga': {
    breakfast: [
      { name: 'Zamboangueño Garlic Brown Rice with Poached Egg & Charred Seafood Flakes', base: 'Zamboanga Silog' },
      { name: 'Steamed Saba Banana with Spiced Native Ginger Tea', base: 'Saba & Ginger' },
      { name: 'Scrambled Native Eggs with Sautéed Tomatoes & Sweet Onion', base: 'Zamboanga Scramble' },
    ],
    lunch: [
      { name: 'Steamed Curacha with Light Alavar Spiced Sauce and Steamed Rice', base: 'Curacha Alavar' },
      { name: 'Zamboanga Chicken Satti (Grilled Skewers with Sweet-Spicy Red Sauce)', base: 'Chicken Satti' },
      { name: 'Tiula Ituk (Tausug Black Beef Stew with Burnt Coconut & Lemongrass)', base: 'Tiula Ituk' },
    ],
    snack: [
      { name: 'Fresh Zamboanga Fruit Knickerbocker Cup (Papaya, Melon, Milk, Gelatin)', base: 'Knickerbocker' },
      { name: 'Chilled Native Coconut Water with Young Flesh', base: 'Zamboanga Buko' },
      { name: 'Steamed Sweet Corn Ear with Light Salt', base: 'Sweet Corn' },
    ],
    dinner: [
      { name: 'Grilled Lapu-Lapu Fillet with Ensalada and Calamansi Vinegar', base: 'Grilled Lapu-Lapu' },
      { name: 'Guisadong Utan with Fresh Shrimp and Native Squash', base: 'Utan Bisaya' },
      { name: 'Chicken Piyanggang (Grilled Chicken in Rich Burnt Coconut Paste)', base: 'Piyanggang' },
    ],
  },
};

/**
 * Sanitizes a dish title for user allergies
 */
function sanitizeDishForUserAllergies(title, mealType, allergies = []) {
  if (!allergies || allergies.length === 0) return title;
  let safeTitle = title;
  const lowerAllergies = allergies.map((a) => String(a).toLowerCase());
  const lowerTitle = safeTitle.toLowerCase();

  const hasSeafoodAllergy = lowerAllergies.some((a) =>
    ['seafood', 'fish', 'shellfish', 'shrimp', 'crab', 'tuna', 'bangus'].some((k) => a.includes(k))
  );
  if (hasSeafoodAllergy) {
    safeTitle = safeTitle.replace(/tangigue|tuna|bangus|tilapia|isda|fish|lapu-lapu|curacha|shrimp|pasayan|crab|diwal|marlin|bariles|tawilis/gi, 'Lean Native Chicken');
  }

  const hasEggAllergy = lowerAllergies.some((a) => a.includes('egg'));
  if (hasEggAllergy) {
    safeTitle = safeTitle.replace(/egg[s]?|poached egg|scrambled egg|sunny native egg/gi, 'Native Greens & Tofu');
  }

  const hasPorkAllergy = lowerAllergies.some((a) => a.includes('pork'));
  if (hasPorkAllergy) {
    safeTitle = safeTitle.replace(/pork|baboy|liempo|sisig|lechon|chicharon|asado|morcon/gi, 'Lean Beef Tenderloin');
  }

  const hasNutAllergy = lowerAllergies.some((a) => a.includes('peanut') || a.includes('nut'));
  if (hasNutAllergy) {
    safeTitle = safeTitle.replace(/peanuts?|pili nuts?|cashew/gi, 'Sweet Corn');
  }

  return safeTitle;
}

/**
 * Finds best matching regional meal catalog for any Philippine city or province
 */
function resolveRegionalCatalog(locationName) {
  const loc = (locationName || '').toLowerCase();

  if (loc.includes('pampanga') || loc.includes('angeles') || loc.includes('san fernando') || loc.includes('tarlac') || loc.includes('bulacan')) {
    return PHILIPPINE_REGIONAL_MEALS['Pampanga'];
  }
  if (loc.includes('iloilo') || loc.includes('guimaras') || loc.includes('antique') || loc.includes('capiz')) {
    return PHILIPPINE_REGIONAL_MEALS['Iloilo'];
  }
  if (loc.includes('bacolod') || loc.includes('negros')) {
    return PHILIPPINE_REGIONAL_MEALS['Bacolod'];
  }
  if (loc.includes('davao') || loc.includes('samal') || loc.includes('digos') || loc.includes('tagum')) {
    return PHILIPPINE_REGIONAL_MEALS['Davao'];
  }
  if (loc.includes('baguio') || loc.includes('benguet') || loc.includes('sagada') || loc.includes('cordillera')) {
    return PHILIPPINE_REGIONAL_MEALS['Baguio'];
  }
  if (loc.includes('bicol') || loc.includes('naga') || loc.includes('legazpi') || loc.includes('albay') || loc.includes('sorsogon')) {
    return PHILIPPINE_REGIONAL_MEALS['Bicol'];
  }
  if (loc.includes('batangas') || loc.includes('lipa') || loc.includes('tagaytay') || loc.includes('cavite') || loc.includes('quezon')) {
    return PHILIPPINE_REGIONAL_MEALS['Batangas'];
  }
  if (loc.includes('gensan') || loc.includes('general santos') || loc.includes('koronadal') || loc.includes('cotabato')) {
    return PHILIPPINE_REGIONAL_MEALS['General Santos'];
  }
  if (loc.includes('zamboanga') || loc.includes('dipolog') || loc.includes('pagadian')) {
    return PHILIPPINE_REGIONAL_MEALS['Zamboanga'];
  }
  if (loc.includes('manila') || loc.includes('quezon city') || loc.includes('makati') || loc.includes('pasig') || loc.includes('taguig') || loc.includes('ncr')) {
    return PHILIPPINE_REGIONAL_MEALS['NCR'];
  }

  // Check Cebu catalogues
  for (const cebuKey of Object.keys(LOCATION_MEALS)) {
    if (loc.includes(cebuKey.toLowerCase())) {
      const cebuCatalog = LOCATION_MEALS[cebuKey];
      return {
        breakfast: cebuCatalog.breakfast.map((name) => ({ name, base: name })),
        lunch: cebuCatalog.lunch.map((name) => ({ name, base: name })),
        snack: cebuCatalog.snack.map((name) => ({ name, base: name })),
        dinner: cebuCatalog.dinner.map((name) => ({ name, base: name })),
      };
    }
  }

  // Default to Cebu City or Central Visayas catalog
  const defaultCebu = LOCATION_MEALS['Cebu City'];
  return {
    breakfast: defaultCebu.breakfast.map((name) => ({ name, base: name })),
    lunch: defaultCebu.lunch.map((name) => ({ name, base: name })),
    snack: defaultCebu.snack.map((name) => ({ name, base: name })),
    dinner: defaultCebu.dinner.map((name) => ({ name, base: name })),
  };
}

/**
 * Generates an optimized, goal-aligned Philippine 1-Day Plan
 * ensuring the user's progress NEVER stagnates.
 */
export function generateGoalAlignedPhilippinePlan({
  location = 'Cebu City',
  totalUserCalories = 2000,
  targetProtein = 150,
  targetCarbs = 225,
  targetFats = 55,
  userAllergies = [],
  guestGoals = {},
  userId = 'anon',
  cityProfile = null,
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const rawGoal = (guestGoals?.goal || 'maintain').toLowerCase();
  const isFatLoss = rawGoal.includes('fat') || rawGoal.includes('lose') || rawGoal.includes('loss');
  const isMuscle = rawGoal.includes('muscle') || rawGoal.includes('gain') || rawGoal.includes('bulk');

  // Seed for daily rotation
  let hash = 0;
  const seedString = `${todayStr}_${location}_${userId}_${rawGoal}`;
  for (let i = 0; i < seedString.length; i++) {
    hash = ((hash << 5) - hash) + seedString.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  const catalog = resolveRegionalCatalog(location);

  // Pick base dishes from catalog
  let rawB = catalog.breakfast[seed % catalog.breakfast.length].name;
  let rawL = catalog.lunch[(seed + 1) % catalog.lunch.length].name;
  let rawS = catalog.snack[(seed + 2) % catalog.snack.length].name;
  let rawD = catalog.dinner[(seed + 3) % catalog.dinner.length].name;

  // If a dynamic city profile was fetched from Supabase/Gemini with famous delicacies,
  // seamlessly inject that city's iconic specialty, delicacies, and market produce into all 4 meals!
  if (Array.isArray(cityProfile?.famousDishes) && cityProfile.famousDishes.length > 0) {
    const dishes = cityProfile.famousDishes;
    if (dishes[0]?.name) rawL = `${dishes[0].name} (${location} Specialty)`;
    if (dishes[1]?.name) rawD = `${dishes[1].name} (${location} Heritage)`;
    if (dishes[2]?.name) rawS = `${dishes[2].name} (${location} Traditional Delicacy)`;
    if (dishes[3]?.name) rawB = `${dishes[3].name} (${location} Breakfast Specialty)`;
  } else if (cityProfile?.specialty) {
    rawL = `${cityProfile.specialty} (${location} Specialty)`;
  }

  // If local palengke items are specified, incorporate them into breakfast and snack if needed
  if (cityProfile?.palengkeItems && typeof cityProfile.palengkeItems === 'string') {
    const palengkeList = cityProfile.palengkeItems.split(',').map((s) => s.trim()).filter(Boolean);
    if (palengkeList.length > 0 && (!cityProfile?.famousDishes || cityProfile.famousDishes.length < 4)) {
      rawB = `${palengkeList[0]} with Garlic Rice & Native Egg (${location} Market Fresh)`;
    }
    if (palengkeList.length > 1 && (!cityProfile?.famousDishes || cityProfile.famousDishes.length < 3)) {
      rawS = `Fresh ${palengkeList[1]} with Buko Water (${location} Harvest)`;
    }
  }

  // Goal-Optimization Transformation
  let bTitle = rawB;
  let lTitle = rawL;
  let sTitle = rawS;
  let dTitle = rawD;

  let goalTag = '⚖️ Maintenance Balanced';
  let goalBadgeDesc = 'Optimized macro ratios for steady daily metabolism';

  if (isFatLoss) {
    goalTag = '🔥 Fat Loss Adapted';
    goalBadgeDesc = 'Lean protein & calorie-deficit portioned to keep weight loss moving';
    lTitle = `Lean ${lTitle.replace(/\(.*?\)/g, '').trim()} (Deficit-Optimized)`;
    dTitle = `Light ${dTitle.replace(/\(.*?\)/g, '').trim()} with Native Fiber Greens`;
    if (!bTitle.toLowerCase().includes('lean') && !bTitle.toLowerCase().includes('poached')) {
      bTitle = `High-Protein ${bTitle}`;
    }
  } else if (isMuscle) {
    goalTag = '💪 Muscle Gain Fuel';
    goalBadgeDesc = 'High-protein surplus to drive lean muscle recovery and gains';
    lTitle = `Double-Protein ${lTitle.replace(/\(.*?\)/g, '').trim()} Power Plate`;
    dTitle = `High-Protein ${dTitle.replace(/\(.*?\)/g, '').trim()} with Clean Carbs`;
    if (!bTitle.toLowerCase().includes('mass') && !bTitle.toLowerCase().includes('extra')) {
      bTitle = `Muscle-Building ${bTitle}`;
    }
  }

  // Sanitize for user allergies
  bTitle = sanitizeDishForUserAllergies(bTitle, 'Breakfast', userAllergies);
  lTitle = sanitizeDishForUserAllergies(lTitle, 'Lunch', userAllergies);
  sTitle = sanitizeDishForUserAllergies(sTitle, 'Snack', userAllergies);
  dTitle = sanitizeDishForUserAllergies(dTitle, 'Dinner', userAllergies);

  // Exact Macro Allocation:
  // Breakfast: 25%, Lunch: 35%, Snack: 15%, Dinner: remaining (25%)
  const bKcal = Math.round(totalUserCalories * 0.25);
  const bProt = Math.round(targetProtein * 0.25);
  const bCarb = Math.round(targetCarbs * 0.25);
  const bFat = Math.round(targetFats * 0.25);

  const lKcal = Math.round(totalUserCalories * 0.35);
  const lProt = Math.round(targetProtein * 0.35);
  const lCarb = Math.round(targetCarbs * 0.35);
  const lFat = Math.round(targetFats * 0.35);

  const sKcal = Math.round(totalUserCalories * 0.15);
  const sProt = Math.round(targetProtein * 0.15);
  const sCarb = Math.round(targetCarbs * 0.15);
  const sFat = Math.round(targetFats * 0.15);

  const dKcal = Math.max(1, totalUserCalories - (bKcal + lKcal + sKcal));
  const dProt = Math.max(0, targetProtein - (bProt + lProt + sProt));
  const dCarb = Math.max(0, targetCarbs - (bCarb + lCarb + sCarb));
  const dFat = Math.max(0, targetFats - (bFat + lFat + sFat));

  const safeLocationSlug = location.toLowerCase().replace(/[^a-z0-9]/g, '');

  return [
    {
      id: `ph-${safeLocationSlug}-breakfast`,
      mealType: 'Breakfast',
      time: '8:00 AM',
      title: bTitle,
      calories: bKcal,
      kcal: bKcal,
      proteinNum: bProt,
      carbsNum: bCarb,
      fatsNum: bFat,
      protein: `${bProt}g`,
      carbs: `${bCarb}g`,
      fats: `${bFat}g`,
      goalTag,
      goalBadgeDesc,
      location,
    },
    {
      id: `ph-${safeLocationSlug}-lunch`,
      mealType: 'Lunch',
      time: '12:30 PM',
      title: lTitle,
      calories: lKcal,
      kcal: lKcal,
      proteinNum: lProt,
      carbsNum: lCarb,
      fatsNum: lFat,
      protein: `${lProt}g`,
      carbs: `${lCarb}g`,
      fats: `${lFat}g`,
      goalTag,
      goalBadgeDesc,
      location,
    },
    {
      id: `ph-${safeLocationSlug}-snack`,
      mealType: 'Snack',
      time: '4:00 PM',
      title: sTitle,
      calories: sKcal,
      kcal: sKcal,
      proteinNum: sProt,
      carbsNum: sCarb,
      fatsNum: sFat,
      protein: `${sProt}g`,
      carbs: `${sCarb}g`,
      fats: `${sFat}g`,
      goalTag,
      goalBadgeDesc,
      location,
    },
    {
      id: `ph-${safeLocationSlug}-dinner`,
      mealType: 'Dinner',
      time: '7:30 PM',
      title: dTitle,
      calories: dKcal,
      kcal: dKcal,
      proteinNum: dProt,
      carbsNum: dCarb,
      fatsNum: dFat,
      protein: `${dProt}g`,
      carbs: `${dCarb}g`,
      fats: `${dFat}g`,
      goalTag,
      goalBadgeDesc,
      location,
    },
  ];
}

export const getDynamicPalengkePlan = generateGoalAlignedPhilippinePlan;
