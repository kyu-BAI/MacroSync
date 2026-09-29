// Regional Cebuano Dishes and Allergy Safety Engine
import { CEBU_LOCATIONS } from './cebu_locations';

// Regional Cebuano Dishes Catalog
export const LOCATION_MEALS = {
  'Cebu City': {
    breakfast: [
      'Luto nga Itlog sa Subak nga Kangkong ug Calamansi Tea',
      'Gisadong Singkamas ug Scrambled Itlog Bisaya',
      'Sinugbang Tyan sa Bangus ug Binisaya nga Humay'
    ],
    lunch: [
      'Kinilaw nga Tangigue ug Sabaw sa Pasil Isda ug Bugas',
      'Sinugbang Tilapia Fillet ug Salada nga Lato',
      'Tinolang Manok Bisaya nga adunay Sayote ug Malunggay'
    ],
    snack: [
      'Hilaw nga Singkamas ug Tumparik nga Calamansi',
      'Luto nga Mais ug Barato nga Tubig sa Buko',
      'Giatas nga Pipino ug Calamansi Juice'
    ],
    dinner: [
      'Sinugbang Isda sa Palengke ug Salada nga Kamatis',
      'Gisadong Kangkong ug Halang nga Halang Isda',
      'Utan Bisaya nga Kalabasa, Malunggay ug Manok'
    ]
  },
  'Lapu-Lapu City': {
    breakfast: [
      'Sinugbang Bangus ug Presko nga Lato sa Calamansi',
      'Luto nga Itlog Bisaya sa Giatas nga Kangkong',
      'Gisadong Kamatis sa Palengke ug Puti sa Itlog'
    ],
    lunch: [
      'Sutukil Seafood Plate (Sinugba, Tinola, ug Kinilaw)',
      'Sinugbang Tangigue Steak ug Kamatis sa Mactan',
      'Halang-Halang nga Manok Bisaya sa Gata'
    ],
    snack: [
      'Presko nga Buko Juice ug Luto nga Mais sa Karsada',
      'Salada nga Lato ug Aslum nga Calamansi',
      'Sinugbang Mais sa Mactan Market'
    ],
    dinner: [
      'Sinugbang Tanguigue Steak ug Relish sa Kamatis',
      'Sinigang nga Isda sa Subak nga Utan Bisaya',
      'Gisadong Talong ug Sinugbang Daghang Manok'
    ]
  },
  'Mandaue City': {
    breakfast: [
      'Gisadong Kamatis ug Scrambled Itlog sa Calamansi',
      'Luto nga Kamote Slices ug Luto nga Itlog',
      'Gisadong Kangkong sa Ahos ug Itlog'
    ],
    lunch: [
      'Tinolang Manok Bisaya sa Sayote ug Malunggay',
      'Pan-Seared Isda Fillet ug Salada nga Talong',
      'Sinugbang Pork Chop ug Sabaw sa Utan'
    ],
    snack: [
      'Luto nga Kamote sa Mandaue ug Presko nga Buko',
      'Sinugbang Yellow Mais sa Palengke',
      'Mangga sa Cebu ug Salabat (Ginger Tea)'
    ],
    dinner: [
      'Gisadong Talong ug Sinugbang Tilapia',
      'Sabaw sa Manok Bisaya, Kalabasa ug Sitaw',
      'Sinugbang Bangus ug Presko nga Greens'
    ]
  },
  'Talisay City': {
    breakfast: [
      'Luto nga Itlog ug Presko nga Pipino sa Calamansi',
      'Luto nga Kamote ug Scrambled Itlog',
      'Gisadong Kamatis sa Ahos ug Puti sa Itlog'
    ],
    lunch: [
      'Inun-unan na Isda sa Sukang Tuba ug Talong',
      'Sinugbang Baboy nga Lean cut ug Sabaw sa Kangkong',
      'Tinolang Manok Bisaya sa Malunggay'
    ],
    snack: [
      'Sinugbang Yellow Mais sa Talisay Market',
      'Tuba nga Buko Water ug Pipino Slices',
      'Inasal nga Kamote Chips sa Hurno'
    ],
    dinner: [
      'Sinugbang Baboy sa Binisaya nga Greens',
      'Sinugbang Tilapia ug Relish sa Kamatis',
      'Sabaw sa Kalabasa ug Sinugbang Manok'
    ]
  },
  'Carcar City': {
    breakfast: [
      'Gisadong Itlog Bisaya, Kamatis ug Alugbati',
      'Luto nga Kamote Slices ug Calamansi Tea',
      'Gisadong Sitaw ug Luto nga Itlog'
    ],
    lunch: [
      'Binisayang Humba sa Carcar ug Utan Bisaya',
      'Tinolang Manok Bisaya sa Sayote',
      'Kinilaw nga Isda sa Sukang Tuba ug Greens'
    ],
    snack: [
      'Presko nga Juice sa Calamansi ug Sinugbang Mais',
      'Giatas nga Pipino sa Sukang Tuba',
      'Luto nga Yellow Mais sa Carcar'
    ],
    dinner: [
      'Sinugbang Pork Chop sa Sabaw sa Kalabasa',
      'Gisadong Talong ug Sinugbang Isda',
      'Utan Bisayanga Sabaw sa Kamatis ug Sitaw'
    ]
  },
  'Argao': {
    breakfast: [
      'Batirol nga Sikwate ug Luto nga Itlog Bisaya',
      'Luto nga Itlog sa Gisadong Kangkong',
      'Luto nga Kamote Slices ug Puti sa Itlog'
    ],
    lunch: [
      'Chiu-Chiu nga Baboy sa Argao ug Sabaw sa Alugbati',
      'Tinolang Manok Bisaya sa Malunggay',
      'Sinugbang Isda Fillet ug Salada nga Kamatis'
    ],
    snack: [
      'Mangga sa Argao ug Binisayang Salabat',
      'Tuba Buko Water ug Luto nga Mais',
      'Salada nga Pipino sa Calamansi'
    ],
    dinner: [
      'Sinugbang Manok Bisaya ug Gisadong Talong',
      'Sabaw sa Alugbati, Kalabasa ug Isda',
      'Sinugbang Pork Chop ug Presko nga Greens'
    ]
  },
  'Bogo City': {
    breakfast: [
      'Gisadong Kamatis ug Pipino sa Itlog Bisaya',
      'Lugaw nga Mais sa Bogo ug Luto nga Itlog',
      'Salada nga Pipino ug Gisadong Itlog'
    ],
    lunch: [
      'Kinilaw nga Tangigue sa Bogo ug Luto nga Mais',
      'Sinugbang Tangigue Steak ug Relish sa Kamatis',
      'Tinolang Manok Bisaya sa Sayote'
    ],
    snack: [
      'Sinugbang Sweet Corn sa Bogo Market',
      'Luto nga Yellow Mais ug Tubig sa Calamansi',
      'Giatas nga Kamatis sa Calamansi'
    ],
    dinner: [
      'Gisadong Utan Bisaya ug Sinugbang Daghang Manok',
      'Gisadong Greens sa Palengke ug Steamed Tangigue',
      'Sinugbang Tangigue ug Salada nga Pipino'
    ]
  },
  'San Remigio': {
    breakfast: [
      'Presko nga Lato (Grapes Seaweed) Salad ug Luto nga Itlog',
      'Sinugbang Tyan sa Bangus ug Ahos nga Humay',
      'Luto nga Itlog sa Gisadong Kangkong ug Calamansi'
    ],
    lunch: [
      'Sinugbang Tilapia sa Kangkong Soup ug Mais',
      'Sinugbang Lato Bowl ug Halang nga Calamansi Dip',
      'Sinugbang Bangus sa Dahon sa Saging ug Sabaw sa Kalabasa'
    ],
    snack: [
      'Presko nga Juice sa Calamansi ug Luto nga Mais',
      'Tugob nga Buko Water ug Mangga Slices',
      'Luto nga Sweet Corn sa San Remigio'
    ],
    dinner: [
      'Laing nga Dahon sa Gabi sa Gata ug Sinugbang Bangus',
      'Sabaw sa Kalabasa ug Kangkong sa Tilapia',
      'Sinugbang Bangus ug Binisayang Utan Stew'
    ]
  },
  'Daanbantayan': {
    breakfast: [
      'Luto nga Ube Kamote, Itlog Bisaya ug Kape',
      'Gihurnong Kamote Bowl ug Binisayang Salabat',
      'Luto nga Kamote Slices ug Scrambled Itlog'
    ],
    lunch: [
      'Inun-unan na Bodboron sa Sukang Tuba ug Talong',
      'Sinugbang Tulingan ug Salada nga Talong',
      'Halang-Halang nga Manok Bisaya sa Daanbantayan'
    ],
    snack: [
      'Gihurnong Kamote Slices sa Palengke',
      'Luto nga Ube Kamote sa Daanbantayan',
      'Kamote Chips (Walay Manteka) ug Salabat'
    ],
    dinner: [
      'Sabaw sa Tulingan sa Luya ug Kalabasa',
      'Inun-unan nga Isda ug Luto nga Greens',
      'Sinugbang Bodboron ug Sabaw sa Luya'
    ]
  },
  'Bantayan Island': {
    breakfast: [
      'Luto nga Kasag (Blue Crab) ug Itlog sa Calamansi',
      'Sinugbang Isda Fillet ug Presko nga Greens',
      'Luto nga Itlog sa Gisadong Kangkong'
    ],
    lunch: [
      'Sinugbang Isda sa Santa Fe ug Salada nga Lato',
      'Sinigang nga Isda sa Binisayang Utan',
      'Tinolang Manok Bisaya sa Sayote'
    ],
    snack: [
      'Presko nga Buko Water ug Calamansi Spritz',
      'Luto nga Sweet Corn sa Bantayan',
      'Mangga Slices ug Salabat'
    ],
    dinner: [
      'Sinigang na Isda sa Binisayang Greens',
      'Sinugbang Isda sa Dagat ug Kamatis',
      'Sabaw sa Kalabasa ug Malunggay'
    ]
  },
  'Camotes Islands': {
    breakfast: [
      'Luto nga Balanghoy (Cassava) ug Itlog Bisaya',
      'Luto nga Kamote ug Gisadong Itlog',
      'Presko nga Kamatis ug Pipino Salad'
    ],
    lunch: [
      'Halang-Halang nga Manok Bisaya sa Gata ug Luya',
      'Sinugbang Isda sa Dagat ug Gisadong Kangkong',
      'Sabaw sa Utan Bisaya ug Brown Rice'
    ],
    snack: [
      'Presko nga Buko Water ug Unod sa Buko',
      'Gihurnong Balanghoy Slices',
      'Presko nga Mangga sa Camotes'
    ],
    dinner: [
      'Sinugbang Isda sa Dagat ug Kangkong',
      'Sabaw sa Manok Bisaya ug Kapaya',
      'Gisadong Talong ug Luto nga Humay'
    ]
  },
  'Toledo City': {
    breakfast: [
      'Scrambled Itlog sa Gisadong Sitaw ug Kamatis',
      'Luto nga Kamote ug Luto nga Itlog',
      'Luto nga Itlog sa Gisadong Kangkong'
    ],
    lunch: [
      'Gisadong Ulang (Fresh River Prawns) sa Ahos ug Kamatis',
      'Sinugbang Tilapia sa Kamayan ug Sabaw sa Kalabasa',
      'Tinolang Manok Bisaya sa Sayote'
    ],
    snack: [
      'Luto nga Yellow Mais ug Salabat',
      'Presko nga Calamansi Juice ug Pipino',
      'Tuba Buko Water'
    ],
    dinner: [
      'Sinugbang Pork Chop ug Binisayang Utan Stew',
      'Pan-Seared Tilapia ug Sabaw sa Kalabasa',
      'Sabaw sa Sitaw, Kalabasa ug Manok'
    ]
  },
  'Balamban': {
    breakfast: [
      'Luto nga Itlog sa Gisadong Malunggay ug Kamatis',
      'Luto nga Kamote Slices ug Scrambled Itlog',
      'Omelette sa Itlog Bisaya sa Ahos ug Dahon'
    ],
    lunch: [
      'Balamban Sinugbang Liempo sa Tanglad ug Sabaw sa Sayote',
      'Tinolang Manok Bisaya sa Kapaya ug Malunggay',
      'Sinugbang Isda Fillet ug Binisayang Greens'
    ],
    snack: [
      'Sinugbang Kamote Slices ug Calamansi Juice',
      'Tuba Buko Water sa Balamban',
      'Luto nga Yellow Mais'
    ],
    dinner: [
      'Tinolang Manok Bisaya sa Kapaya ug Malunggay',
      'Sinugbang Pork Tenderloin ug Utan',
      'Sabaw sa Malunggay ug Kalabasa'
    ]
  },
  'Moalboal': {
    breakfast: [
      'Salada nga Pipino ug Kamatis sa Luto nga Itlog',
      'Luto nga Kamote ug Luto nga Itlog',
      'Binisayang Calamansi Tea ug Scrambled Itlog'
    ],
    lunch: [
      'Sinugbang Tangigue Steak sa Calamansi Dip ug Humay',
      'Kinilaw nga Mackerel sa Sukang Tuba ug Greens',
      'Halang-Halang nga Manok Bisaya sa Moalboal'
    ],
    snack: [
      'Tuba Coconut Shake (Walay Asukal)',
      'Presko nga Mangga Slices',
      'Giatas nga Pipino Water'
    ],
    dinner: [
      'Kinilaw nga Mackerel sa Binisayang Greens',
      'Sinugbang Tangigue Steak ug Gisadong Kangkong',
      'Sabaw sa Utan Bisaya ug Brown Rice'
    ]
  },
  'Oslob': {
    breakfast: [
      'Gisadong Dahon sa Kamote (Kamote Tops) ug Luto nga Itlog',
      'Luto nga Itlog ug Presko nga Kamatis',
      'Luto nga Ube Kamote ug Kape'
    ],
    lunch: [
      'Sinigang nga Tangigue sa Oslob ug Utan Bisaya',
      'Sinugbang Isda Fillet ug Relish sa Kamatis',
      'Tinolang Manok Bisaya sa Sayote'
    ],
    snack: [
      'Presko nga Mangga sa Oslob ug Buko Juice',
      'Luto nga Sweet Corn',
      'Calamansi Juice'
    ],
    dinner: [
      'Sinugbang Isda Fillet ug Sabaw sa Kalabasa',
      'Sinigang na Tangigue sa Presko nga Greens',
      'Gisadong Dahon sa Kamote ug Sinugbang Manok'
    ]
  },
  'Danao City': {
    breakfast: [
      'Scrambled Itlog Bisaya sa Gisadong Kamatis',
      'Luto nga Kamote Slices ug Calamansi Tea',
      'Luto nga Itlog sa Kangkong'
    ],
    lunch: [
      'Inasal nga Bangus sa Danao ug Garlic Kangkong',
      'Tinolang Manok Bisaya sa Sayote',
      'Gisadong Talong ug Sinugbang Isda'
    ],
    snack: [
      'Presko nga Luto nga Sweet Corn ug Buko Water',
      'Giatas nga Pipino Slices',
      'Sinugbang Mais sa Danao'
    ],
    dinner: [
      'Gisadong Talong ug Sinugbang Tilapia',
      'Inasal nga Bangus Fillet ug Sabaw sa Kalabasa',
      'Utan Bisayanga Sabaw sa Danao'
    ]
  },
  'Liloan': {
    breakfast: [
      'Presko nga Lato Salad sa Liloan ug Luto nga Itlog',
      'Luto nga Kamote ug Luto nga Itlog',
      'Gisadong Kamatis sa Puti sa Itlog'
    ],
    lunch: [
      'Sabaw sa Manok Bisaya, Sayote ug Malunggay',
      'Sinugbang Isda Fillet ug Relish sa Kamatis',
      'Bowl sa Lato Seaweed ug Brown Rice'
    ],
    snack: [
      'Tuba Buko Juice ug Presko nga Mangga',
      'Luto nga Yellow Mais',
      'Calamansi Water'
    ],
    dinner: [
      'Sinugbang Isda Fillet ug Relish sa Kamatis',
      'Sabaw sa Manok Bisaya sa Malunggay',
      'Gisadong Kangkong ug Luto nga Humay'
    ]
  },
  'Dalaguete': {
    breakfast: [
      'Scrambled Itlog sa Presko nga Broccoli ug Karots',
      'Luto nga Itlog sa Gisadong Sayote ug Kamatis',
      'Luto nga Kamote sa Dalaguete ug Puti sa Itlog'
    ],
    lunch: [
      'Gisadong Utan sa Mantalongon (Sayote & Repolyo) ug Sinugbang Pork Chop',
      'Tinolang Manok Bisaya sa Sayote ug Broccoli',
      'Sabaw sa Sayote ug Gusok sa Baboy'
    ],
    snack: [
      'Presko nga Karots ug Sayote Sticks sa Calamansi Dip',
      'Tuba Buko Water',
      'Sinugbang Yellow Mais'
    ],
    dinner: [
      'Sabaw sa Sayote ug Gusok sa Baboy sa Brown Rice',
      'Gisadong Utan sa Mantalongon ug Sinugbang Manok',
      'Gisadong Repolyo ug Karots sa Pork Chop'
    ]
  },
  'Barili': {
    breakfast: [
      'Luto nga Itlog Bisaya sa Gisadong Kamatis ug Calamansi',
      'Luto nga Kamote ug Scrambled Itlog sa Barili',
      'Luto nga Itlog sa Gisadong Greens'
    ],
    lunch: [
      'Kinalan nga Manok Bisaya sa Kalabasa ug Sitaw',
      'Pan-Seared Tilapia Fillet ug Sabaw sa Utan',
      'Sinugbang Pork Tenderloin ug Salada nga Talong'
    ],
    snack: [
      'Tuba Buko Water sa Barili ug Luto nga Mais',
      'Presko nga Mangga Slices',
      'Giatas nga Pipino Dip'
    ],
    dinner: [
      'Pan-Seared Tilapia Fillet ug Sabaw sa Utan',
      'Kinalan nga Manok Bisaya sa Kalabasa',
      'Gisadong Sitaw ug Kalabasa sa Manok'
    ]
  }
};

// Normalize town/city string to canonical Cebu LGU name
export const normalizeToCebuLGU = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return null;
  const clean = rawName
    .replace(/^city of\s+/i, '')
    .replace(/\s+city$/i, '')
    .replace(/^municipality of\s+/i, '')
    .replace(/,\s*cebu.*$/i, '')
    .trim()
    .toLowerCase();

  if (!clean) return null;

  // 1. Direct match against canonical CEBU_LOCATIONS
  for (const loc of CEBU_LOCATIONS) {
    const locClean = loc
      .replace(/\s*\(camotes\)/i, '')
      .replace(/\s+city$/i, '')
      .trim()
      .toLowerCase();

    if (clean === locClean || clean === loc.toLowerCase()) {
      return loc;
    }
  }

  // 2. Special aliases & colloquial variants
  if (clean === 'lapu lapu' || clean === 'lapulapu') return 'Lapu-Lapu City';
  if (clean === 'sta fe' || clean === 'sta. fe') return 'Santa Fe';
  if (clean === 'cebu') return 'Cebu City';
  if (clean === 'san francisco') return 'San Francisco (Camotes)';
  if (clean === 'pilar') return 'Pilar (Camotes)';
  if (clean === 'poro') return 'Poro (Camotes)';
  if (clean === 'tudela') return 'Tudela (Camotes)';

  // 3. Substring / fuzzy match
  const found = CEBU_LOCATIONS.find((loc) => {
    const l = loc.toLowerCase();
    const lClean = l.replace(/\s*\(camotes\)/i, '').replace(/\s+city$/i, '').trim();
    return l.includes(clean) || clean.includes(lClean);
  });

  return found || null;
};

// Filter out allergens (seafood, egg, pork) and replace with safe alternatives
export const sanitizeMealForUserAllergies = (mealTitle, mealType, userAllergies = []) => {
  if (!userAllergies || userAllergies.length === 0) return mealTitle;
  
  const lower = mealTitle.toLowerCase();
  const allergiesLower = userAllergies.map(a => String(a).toLowerCase());

  const hasSeafoodAllergy = allergiesLower.some(a => 
    a.includes('seafood') || a.includes('fish') || a.includes('shellfish') || a.includes('shrimp') || a.includes('crab')
  );
  const hasEggAllergy = allergiesLower.some(a => a.includes('egg'));
  const hasPorkAllergy = allergiesLower.some(a => a.includes('pork'));

  let safeTitle = mealTitle;

  // 1. Seafood / Fish Filter
  const isSeafoodMeal = [
    'fish', 'bangus', 'tilapia', 'tangigue', 'tanguigue', 'lato', 
    'seaweed', 'sutukil', 'kinilaw', 'inun-unan', 'bodboron', 
    'tulingan', 'crab', 'eel', 'bakasi', 'seafood'
  ].some(kw => lower.includes(kw));

  if (hasSeafoodAllergy && isSeafoodMeal) {
    if (mealType === 'Breakfast') safeTitle = 'Sautéed Native Tomatoes & Malunggay with Steamed Kamote';
    else if (mealType === 'Lunch') safeTitle = 'Grilled Native Chicken Breast with Highland Sayote & Rice';
    else if (mealType === 'Snack') safeTitle = 'Steamed Sweet Corn & Cold Buko Water';
    else safeTitle = 'Native Chicken Tinola with Squash & Kangkong Soup';
  }

  // 2. Egg Filter
  const isEggMeal = ['egg', 'scramble', 'omelette', 'poached'].some(kw => lower.includes(kw));
  if (hasEggAllergy && isEggMeal) {
    if (mealType === 'Breakfast') safeTitle = 'Steamed Kamote Slices & Calamansi Tea with Native Greens';
    else safeTitle = safeTitle.replace(/egg[s]?|omelette|scramble|poached/gi, 'Native Greens');
  }

  // 3. Pork Filter
  const isPorkMeal = ['pork', 'humba', 'liempo', 'chicharon', 'tuslob buwa', 'chiu-chiu'].some(kw => lower.includes(kw));
  if (hasPorkAllergy && isPorkMeal) {
    safeTitle = safeTitle.replace(/pork|humba|liempo|chicharon|tuslob buwa|chiu-chiu/gi, 'Grilled Native Chicken');
  }

  return safeTitle;
};

// Generate rotating daily 4-meal plan based on date seed
export const getDynamicPalengkePlan = ({
  location = 'Cebu City',
  totalUserCalories = 2000,
  targetProtein = 150,
  targetCarbs = 225,
  targetFats = 55,
  userAllergies = [],
  guestGoals = {},
  userId = 'anon'
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const userGoalStr = guestGoals?.goal || 'maintain';
  const userKeyStr = userId || 'anon';
  
  // Deterministic seed generation (changes daily, consistent within same day)
  let hash = 0;
  const seedString = `${todayStr}_${location}_${userKeyStr}_${userGoalStr}`;
  for (let i = 0; i < seedString.length; i++) {
    hash = ((hash << 5) - hash) + seedString.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  const locData = LOCATION_MEALS[location] || LOCATION_MEALS['Cebu City'];
  
  // Select meal items from location catalogue using daily seed offset
  let bTitle = locData.breakfast[seed % locData.breakfast.length];
  let lTitle = locData.lunch[(seed + 1) % locData.lunch.length];
  let sTitle = locData.snack[(seed + 2) % locData.snack.length];
  let dTitle = locData.dinner[(seed + 3) % locData.dinner.length];

  // Apply allergy safety substitutions
  bTitle = sanitizeMealForUserAllergies(bTitle, 'Breakfast', userAllergies);
  lTitle = sanitizeMealForUserAllergies(lTitle, 'Lunch', userAllergies);
  sTitle = sanitizeMealForUserAllergies(sTitle, 'Snack', userAllergies);
  dTitle = sanitizeMealForUserAllergies(dTitle, 'Dinner', userAllergies);

  // Calorie & macro distribution ratio:
  // Breakfast: 25%, Lunch: 35%, Snack: 15%, Dinner: remaining (25%)
  const bKcal = Math.round(totalUserCalories * 0.25);
  const bProt = Math.round(targetProtein * 0.25);
  const bCarb = Math.round(targetCarbs * 0.25);
  const bFat  = Math.round(targetFats * 0.25);

  const lKcal = Math.round(totalUserCalories * 0.35);
  const lProt = Math.round(targetProtein * 0.35);
  const lCarb = Math.round(targetCarbs * 0.35);
  const lFat  = Math.round(targetFats * 0.35);

  const sKcal = Math.round(totalUserCalories * 0.15);
  const sProt = Math.round(targetProtein * 0.15);
  const sCarb = Math.round(targetCarbs * 0.15);
  const sFat  = Math.round(targetFats * 0.15);

  const dKcal = Math.max(1, totalUserCalories - (bKcal + lKcal + sKcal));
  const dProt = Math.max(0, targetProtein - (bProt + lProt + sProt));
  const dCarb = Math.max(0, targetCarbs - (bCarb + lCarb + sCarb));
  const dFat  = Math.max(0, targetFats - (bFat + lFat + sFat));

  const safeLocationSlug = location.toLowerCase().replace(/[^a-z0-9]/g, '');

  return [
    {
      id: `palengke-${safeLocationSlug}-breakfast`,
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
      fats: `${bFat}g`
    },
    {
      id: `palengke-${safeLocationSlug}-lunch`,
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
      fats: `${lFat}g`
    },
    {
      id: `palengke-${safeLocationSlug}-snack`,
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
      fats: `${sFat}g`
    },
    {
      id: `palengke-${safeLocationSlug}-dinner`,
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
      fats: `${dFat}g`
    }
  ];
};
