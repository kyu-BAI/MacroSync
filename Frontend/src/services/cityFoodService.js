/**
 * cityFoodService.js
 * Fetches local food profiles for Philippine cities/municipalities.
 * Flow: Supabase cache → Gemini AI generation → fallback static data
 */

import API_URL from '../screens/config/api';
import { PHILIPPINE_LOCATIONS } from '../data/philippine_locations';

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
  'Daanbantayan': {
    marketTitle: 'Daanbantayan Public Market & Fish Landing',
    palengkeItems: 'Bodboron, Tulingan, Purple Kamote, Eggplant, Native Ginger',
    lat: 11.2589, lng: 124.0153,
    specialty: 'Inun-unan nga Bodboron',
    famousDishes: [
      { name: 'Inun-unan nga Bodboron', desc: 'Small ocean fish simmered gently in native vinegar, ginger, and green peppers.' },
      { name: 'Linat-ang Tulingan sa Daanbantayan', desc: 'Rich tuna-like fish stewed with native ginger, dried kamias, and tomatoes.' },
    ],
  },
  'San Remigio': {
    marketTitle: 'San Remigio Municipal Public Market',
    palengkeItems: 'Bangus, Tilapia, Fresh Lato, Kangkong, Squash, Gabi Leaves',
    lat: 11.0772, lng: 123.9356,
    specialty: 'Presko nga Salada nga Lato',
    famousDishes: [
      { name: 'Presko nga Salada nga Lato', desc: 'Crunchy grape seaweed tossed with native tomatoes, calamansi juice, and onions.' },
      { name: 'Sinugbang Bangus sa Dahon sa Saging', desc: 'Charcoal-grilled milkfish stuffed with tomatoes and onions, wrapped in banana leaf.' },
    ],
  },
  'Bogo City': {
    marketTitle: 'Bogo City Public Market (Palengke sa Bogo)',
    palengkeItems: 'Tangigue, Sweet Corn, Native Tomatoes, Cucumber, Calamansi',
    lat: 11.0517, lng: 124.0055,
    specialty: 'Pintos sa Bogo',
    famousDishes: [
      { name: 'Pintos sa Bogo', desc: 'Famous sweet corn tamales mixed with coconut milk, steamed inside fresh corn husks.' },
      { name: 'Kinilaw nga Tangigue sa Amihanan', desc: 'Fresh Spanish mackerel cured in native coconut vinegar, ginger, and chilies.' },
    ],
  },
  'Bantayan Island': {
    marketTitle: 'Bantayan Island Fish Landing & Santa Fe Market',
    palengkeItems: 'Dried Danggit, Blue Crab, Shellfish, Calamansi, Young Coconut',
    lat: 11.1681, lng: 123.7222,
    specialty: 'Buwad nga Danggit sa Bantayan',
    famousDishes: [
      { name: 'Buwad nga Danggit sa Bantayan', desc: 'World-renowned crispy rabbitfish dried under the island sun, dipped in vinegar.' },
      { name: 'Nilung-ag nga Kasag sa Bantayan', desc: 'Freshly caught ocean blue swimmer crabs steamed with ginger and calamansi.' },
      { name: 'Buwad nga Pusit', desc: 'Crispy sun-dried squid toasted over coals until golden and fragrant.' },
    ],
  },
  'Mandaue City': {
    marketTitle: 'Mandaue City Public Market',
    palengkeItems: 'Native Chicken, Kangkong, Sayote, Eggplant, Sweet Rice',
    lat: 10.3333, lng: 123.9333,
    specialty: 'Bibingka sa Mandaue',
    famousDishes: [
      { name: 'Bibingka sa Mandaue', desc: 'Heritage baked rice cake made with tuba yeast, coconut milk, and banana leaves.' },
      { name: 'Tagaktak sa Mandaue', desc: 'Crispy net-like sweet rice flour treat fried to golden perfection.' },
      { name: 'Utan Bisaya sa Mandaue', desc: 'Clear vegetable soup seasoned with fried tuyô/danggit and fresh local greens.' },
    ],
  },
  'Talisay City': {
    marketTitle: 'Talisay City Public Market (Poblacion)',
    palengkeItems: 'Pork Belly, Inun-unan Fish, Kangkong, Cucumber, Native Tomatoes',
    lat: 10.2447, lng: 123.8494,
    specialty: 'Inasal nga Lechon sa Talisay',
    famousDishes: [
      { name: 'Inasal nga Lechon sa Talisay', desc: 'Home of the original Cebu Lechon Festival, famed for rich savory herb-infused pork.' },
      { name: 'Inun-unan nga Bisaya', desc: 'Fish braised in native tuba vinegar, garlic, ginger, finger chilies, and eggplant.' },
    ],
  },
  'Argao': {
    marketTitle: 'Argao Public Market & Heritage District',
    palengkeItems: 'Native Sikwate (Cacao), Torta, Native Pork, Alugbati, Eggplant',
    lat: 9.8808, lng: 123.5975,
    specialty: 'Torta sa Argao',
    famousDishes: [
      { name: 'Torta sa Argao', desc: 'Heritage Spanish-era cake baked with tuba yeast, lard, egg yolks, and grated cheese.' },
      { name: 'Batirol nga Sikwate sa Argao', desc: 'Rich hot chocolate frothed with a batirol using 100% native cacao tablea.' },
      { name: 'Chiu-Chiu nga Baboy sa Argao', desc: 'Traditional Argao braised pork belly stewed with spices and native herbs.' },
    ],
  },
  'Balamban': {
    marketTitle: 'Balamban Public Market & Herb Port',
    palengkeItems: 'Stuffed Liempo, Native Chicken, Malunggay, Sayote',
    lat: 10.5042, lng: 123.7194,
    specialty: 'Sinugbang Liempo sa Balamban',
    famousDishes: [
      { name: 'Sinugbang Liempo sa Balamban', desc: 'Famous pork belly rolled and stuffed with secret herbs, scallions, and lemongrass.' },
      { name: 'Tinolang Manok sa Balamban', desc: 'Free-range chicken stewed with green papaya, ginger, and fresh malunggay.' },
    ],
  },
  'Toledo City': {
    marketTitle: 'Toledo City Public Market',
    palengkeItems: 'River Prawns, Tilapia, Corn Grit, Squash, Sitaw',
    lat: 10.3772, lng: 123.6406,
    specialty: 'Gisadong Ulang sa Toledo',
    famousDishes: [
      { name: 'Gisadong Ulang sa Toledo', desc: 'Large freshwater river prawns sautéed in garlic, butter, and native tomatoes.' },
      { name: 'Sinugbang Tilapia sa Kamayan', desc: 'Fresh river tilapia grilled over charcoal, served with calamansi soy dip.' },
    ],
  },
  'Moalboal': {
    marketTitle: 'Moalboal Public Market & Beach Fish Landing',
    palengkeItems: 'Tuna Steak, Mackerel, Buko Water, Calamansi, Cucumber',
    lat: 9.9575, lng: 123.4,
    specialty: 'Sinugbang Tangigue Steak sa Moalboal',
    famousDishes: [
      { name: 'Sinugbang Tangigue Steak sa Moalboal', desc: 'Thick yellowfin tuna steak seared over high heat, drizzled with calamansi dip.' },
      { name: 'Kinilaw nga Mackerel sa Baybayon', desc: 'Freshly caught mackerel cured in coconut vinegar, cucumber, and ginger.' },
    ],
  },
  'Oslob': {
    marketTitle: 'Oslob Municipal Market',
    palengkeItems: 'Tangigue, Kamote Tops, Sinigang Greens, Calamansi, Mango',
    lat: 9.535, lng: 123.4319,
    specialty: 'Sinigang nga Tangigue sa Oslob',
    famousDishes: [
      { name: 'Sinigang nga Tangigue sa Oslob', desc: 'Sour fish soup made with fresh king mackerel, native tomatoes, and greens.' },
      { name: 'Salada nga Dahon sa Kamote', desc: 'Blanched sweet potato leaves tossed with calamansi, onions, and native tomatoes.' },
    ],
  },
  'Danao City': {
    marketTitle: 'Danao City Central Market',
    palengkeItems: 'Kalamay, Bangus, Kangkong, Eggplant, Tomatoes',
    lat: 10.5256, lng: 124.0264,
    specialty: 'Kalamay sa Danao',
    famousDishes: [
      { name: 'Kalamay sa Danao', desc: 'Famous sticky sweet coconut & glutinous rice delicacy packaged in coconut shells.' },
      { name: 'Inasal nga Bangus sa Danao', desc: 'Whole milkfish deboned and stuffed with savory meat, raisins, and spices.' },
    ],
  },
  'Liloan': {
    marketTitle: 'Liloan Public Market',
    palengkeItems: 'Lato, Fresh Fish, Native Chicken, Sayote, Masi',
    lat: 10.4, lng: 123.9833,
    specialty: 'Rosquillos sa Titay (Liloan)',
    famousDishes: [
      { name: 'Rosquillos sa Titay (Liloan)', desc: 'The original ring-shaped crisp biscuit created in Liloan back in 1907.' },
      { name: 'Masi sa Liloan', desc: 'Soft glutinous rice balls filled with a sweet molten peanut and brown sugar center.' },
    ],
  },
  'Dalaguete': {
    marketTitle: 'Dalaguete Vegetable Trading Post (Mantalongon)',
    palengkeItems: 'Highland Sayote, Broccoli, Carrots, Cabbage, Pork Chops',
    lat: 9.7619, lng: 123.535,
    specialty: 'Gisadong Utan sa Mantalongon',
    famousDishes: [
      { name: 'Gisadong Utan sa Mantalongon', desc: 'Crispy stir-fried Sayote, Broccoli, Carrots & Cabbage from the Vegetable Basket of Cebu.' },
      { name: 'Linat-ang Baboy ug Sayote', desc: 'Hearty highland pork soup simmered with freshly harvested sayote and ginger.' },
    ],
  },
  'Barili': {
    marketTitle: 'Barili Public Market & Dairy Farm Center',
    palengkeItems: 'Carabao Milk, Pastillas, Native Eggs, Native Chicken, Squash',
    lat: 10.1133, lng: 123.5083,
    specialty: 'Presko nga Gatas sa Kabaw ug Pastillas',
    famousDishes: [
      { name: 'Presko nga Gatas sa Kabaw ug Pastillas', desc: 'Creamy fresh water-buffalo milk and handcrafted sweet milk candies.' },
      { name: 'Kinalan nga Manok Bisaya sa Barili', desc: 'Slow-simmered native farm chicken with fresh yellow squash and sitaw.' },
    ],
  },
  'Cordova': {
    marketTitle: 'Cordova Public Market & Roro Pier',
    palengkeItems: 'Bakasi (Reef Eel), Saang Snails, Tuba Vinegar, Kamias, Tangigue',
    lat: 10.2522, lng: 123.9511,
    specialty: 'Linarang nga Bakasi & Saang',
    famousDishes: [
      { name: 'Linarang nga Bakasi sa Cordova', desc: 'World-famous moray eel stew cooked with sour kamias, fermented black beans, and chili.' },
      { name: 'Presko nga Saang sa Cordova', desc: 'Steamed local sea conch snails dipped in spicy native coconut tuba vinegar.' },
    ],
  },
  'Catmon': {
    marketTitle: 'Catmon Public Market & Highway Bakery Hub',
    palengkeItems: 'Millet Grain (Kabog), Native Cacao, Sugar, Fresh Fish, Calamansi',
    lat: 10.6869, lng: 124.0164,
    specialty: 'Budbud Kabog & Native Sikwate',
    famousDishes: [
      { name: 'Budbud Kabog sa Catmon', desc: 'Heritage sweet rice cake made from heirloom wild millet seeds wrapped in banana leaf.' },
      { name: 'Tinolang Isda sa Catmon', desc: 'Fresh reef fish simmered with ginger, lemongrass, and native malunggay leaves.' },
    ],
  },
  'Consolacion': {
    marketTitle: 'Consolacion Public Market',
    palengkeItems: 'Native Chicken, Ginger, Chili, Pork Tenderloin, Sayote, Sitaw',
    lat: 10.3803, lng: 123.9575,
    specialty: 'Halang-Halang nga Manok & Sarok Delicacies',
    famousDishes: [
      { name: 'Halang-Halang nga Manok sa Consolacion', desc: 'Fiery shredded chicken simmered in rich spicy coconut milk with chili and ginger.' },
      { name: 'Nilat-ang Baka sa Consolacion', desc: 'Slow-cooked tender beef with corn on the cob and native cabbage in savory broth.' },
    ],
  },
  'Compostela': {
    marketTitle: 'Compostela Municipal Market',
    palengkeItems: 'Carabao Milk Cheese (Q-ueseo), Pan de Sal, Tilapia, Native Eggs',
    lat: 10.4578, lng: 124.0119,
    specialty: 'Q-ueseo (Native White Cheese)',
    famousDishes: [
      { name: 'Q-ueseo sa Compostela', desc: 'Traditional soft white artisan cheese crafted from fresh carabao milk and vinegar curds.' },
      { name: 'Sinugbang Tilapia sa Compostela', desc: 'Charcoal-grilled freshwater tilapia seasoned with calamansi and native spices.' },
    ],
  },
  'Minglanilla': {
    marketTitle: 'Minglanilla Central Public Market',
    palengkeItems: 'Chicken Inasal, Fresh Fish, Calamansi, Native Greens, Kamote',
    lat: 10.2444, lng: 123.7961,
    specialty: 'Inasal sa Minglanilla & Fresh Seafood',
    famousDishes: [
      { name: 'Inasal nga Manok sa Minglanilla', desc: 'Savory grilled chicken marinated in lemongrass, annatto, and native calamansi.' },
      { name: 'Sinugbang Bangus sa Lipata', desc: 'Stuffed grilled milkfish served with fresh tomato and onion relish.' },
    ],
  },
  'Tuburan': {
    marketTitle: 'Tuburan Public Market & Coffee Farm Center',
    palengkeItems: 'Tuburan Coffee Beans, Freshwater Fish, Sweet Corn, Saba, Kangkong',
    lat: 10.7247, lng: 123.8647,
    specialty: 'Tuburan Organic Highland Coffee',
    famousDishes: [
      { name: 'Tuburan Highland Coffee & Steamed Saba', desc: 'Philippine first commercial organic coffee with natural earthy notes and boiled saba.' },
      { name: 'Sinugbang Tilapia sa Molobolo Springs', desc: 'Fresh mountain spring tilapia grilled over charcoal with native dip.' },
    ],
  },
  'Badian': {
    marketTitle: 'Badian Public Market & Kawasan Port',
    palengkeItems: 'Giant River Prawns (Ulang), Bangus, Tilapia, Kamote, Calamansi',
    lat: 9.8703, lng: 123.3975,
    specialty: 'Fresh River Prawns (Ulang) & Kawasan Sinugba',
    famousDishes: [
      { name: 'Gisadong Ulang sa Badian', desc: 'Sweet freshwater river prawns sautéed in native garlic, butter, and ripe tomatoes.' },
      { name: 'Sinugbang Isda sa Kawasan', desc: 'Catch of the day grilled fresh and served with soy-calamansi and hanging rice.' },
    ],
  },
  'Alegria': {
    marketTitle: 'Alegria Municipal Public Market',
    palengkeItems: 'Fresh Tangigue, Native Vegetables, Sayote, Coconut, Calamansi',
    lat: 9.7597, lng: 123.3444,
    specialty: 'Kinilaw nga Tangigue & Binisayang Utan',
    famousDishes: [
      { name: 'Kinilaw nga Tangigue sa Alegria', desc: 'Ultra-fresh Spanish mackerel cured in coconut tuba vinegar with ginger and bird’s eye chili.' },
      { name: 'Utan Bisaya sa Alegria', desc: 'Healthful clear soup of local squash, string beans, and moringa leaves.' },
    ],
  },
  'Alcantara': {
    marketTitle: 'Alcantara Municipal Market',
    palengkeItems: 'Tulingan, Inun-unan Fish, Native Greens, Kamote Tops, Calamansi',
    lat: 9.9769, lng: 123.4072,
    specialty: 'Inun-unan nga Isda & Native Greens',
    famousDishes: [
      { name: 'Inun-unan nga Tulingan sa Alcantara', desc: 'Small tuna simmered in natural tuba vinegar, ginger, and wild native eggplants.' },
      { name: 'Salada nga Kamote Tops', desc: 'Blanched sweet potato leaves tossed with tomatoes and calamansi vinaigrette.' },
    ],
  },
  'Aloguinsan': {
    marketTitle: 'Aloguinsan Public Market (Bojo River)',
    palengkeItems: 'Mangrove Crabs, Balanghoy (Cassava), Wild Greens, Sweet Corn',
    lat: 10.2297, lng: 123.5519,
    specialty: 'Bojo River Mangrove Crab & Balanghoy',
    famousDishes: [
      { name: 'Nilung-ag nga Kasag sa Bojo', desc: 'Sweet river mangrove crabs steamed simply with native ginger and calamansi.' },
      { name: 'Gihurnong Balanghoy sa Aloguinsan', desc: 'Toasted native cassava cakes sweetened with coconut sugar.' },
    ],
  },
  'Asturias': {
    marketTitle: 'Asturias Central Public Market',
    palengkeItems: 'Native Chicken, Cassava, Bingka, Coconut, Ginger, Malunggay',
    lat: 10.5708, lng: 123.7164,
    specialty: 'Binisayang Halang-Halang & Bingka sa Asturias',
    famousDishes: [
      { name: 'Halang-Halang nga Manok sa Asturias', desc: 'Spicy chicken broth enriched with fresh coconut milk, crushed ginger, and chili leaves.' },
      { name: 'Bingka sa Asturias', desc: 'Clay-oven baked native rice bibingka toasted over coconut husks.' },
    ],
  },
  'Boljoon': {
    marketTitle: 'Boljoon Municipal Heritage Market',
    palengkeItems: 'Tulingan, Tangigue, Alugbati, Tomatoes, Seaweed, Calamansi',
    lat: 9.6369, lng: 123.4847,
    specialty: 'Ili Rock Fresh Catch & Tulingan Kinilaw',
    famousDishes: [
      { name: 'Kinilaw nga Tulingan sa Boljoon', desc: 'Fresh deep-sea tuna cured with spiced tuba vinegar, ginger, and shallots.' },
      { name: 'Sabaw sa Alugbati ug Isda', desc: 'Nutritious native spinach and grilled fish soup.' },
    ],
  },
  'Borbon': {
    marketTitle: 'Borbon Public Market',
    palengkeItems: 'Silot Young Coconut, Bodboron Fish, Sweet Corn, Kamote',
    lat: 10.8419, lng: 124.0367,
    specialty: 'Silot Buko & Sinugbang Bodboron',
    famousDishes: [
      { name: 'Sinugbang Bodboron sa Borbon', desc: 'Plump ocean fish grilled over charcoal with coarse sea salt.' },
      { name: 'Silot Buko Shake (No Sugar)', desc: 'Hydrating fresh young coconut water and tender meat.' },
    ],
  },
  'Carmen': {
    marketTitle: 'Carmen Public Market & Safari District',
    palengkeItems: 'Fresh Sea Catch, Native Pork, Local Greens, Calamansi, Mango',
    lat: 10.5833, lng: 124.0236,
    specialty: 'Sinugbang Isda & Palengke Greens sa Carmen',
    famousDishes: [
      { name: 'Sinugbang Isda sa Carmen', desc: 'Fresh local coastal fish grilled to perfection with spicy calamansi soy dip.' },
      { name: 'Utan Bisaya nga adunay Malunggay', desc: 'Wholesome clear vegetable stew packed with local micronutrients.' },
    ],
  },
  'Dumanjug': {
    marketTitle: 'Dumanjug Central Market',
    palengkeItems: 'Bisayang Manok, Organic Pork, Banana Blossoms, Calamansi',
    lat: 10.0617, lng: 123.4983,
    specialty: 'Bisayang Manok sa Dumanjug & Roasted Lechon',
    famousDishes: [
      { name: 'Bisayang Manok sa Dumanjug', desc: 'Free-range native chicken slow-roasted with lemongrass and native garlic.' },
      { name: 'Humba nga Bisaya sa Dumanjug', desc: 'Tender braised pork with banana blossoms and sweet tuba syrup.' },
    ],
  },
  'Ginatilan': {
    marketTitle: 'Ginatilan Municipal Market',
    palengkeItems: 'Inambakan Fish, Glutinous Rice, Coconut Milk, Calamansi, Sayote',
    lat: 9.6053, lng: 123.3517,
    specialty: 'Sinulog Rice Delicacy & Inambakan Fish',
    famousDishes: [
      { name: 'Sinugbang Isda sa Inambakan Falls', desc: 'Fresh fish grilled riverside with native dipping sauce and sweet corn.' },
      { name: 'Sinulog Rice Delicacy sa Ginatilan', desc: 'Traditional steamed sticky rice treat wrapped in banana leaves.' },
    ],
  },
  'Madridejos': {
    marketTitle: 'Madridejos Fish Port & Market',
    palengkeItems: 'Dried Squid (Buwad Pusit), Blue Crabs, Danggit, Calamansi',
    lat: 11.2725, lng: 123.7317,
    specialty: 'Buwad Pusit & Danggit sa Madridejos',
    famousDishes: [
      { name: 'Buwad Pusit sa Madridejos', desc: 'Sun-dried island squid toasted crisp over charcoal, paired with spiced vinegar.' },
      { name: 'Nilung-ag nga Alimango sa Lawis', desc: 'Sweet ocean mangrove crabs steamed with native ginger and calamansi.' },
    ],
  },
  'Malabuyoc': {
    marketTitle: 'Malabuyoc Public Market',
    palengkeItems: 'Spring Catch Fish, Highland Greens, Kamote, Calamansi, Tomatoes',
    lat: 9.6644, lng: 123.3444,
    specialty: 'Mainit Springs Fresh Catch & Native Greens',
    famousDishes: [
      { name: 'Sinugbang Tulingan sa Malabuyoc', desc: 'Charcoal-grilled tuna seasoned with sea salt and served with fresh tomato relish.' },
      { name: 'Utan Bisaya sa Malabuyoc', desc: 'Clear mountain broth with squash, moringa, and string beans.' },
    ],
  },
  'Medellin': {
    marketTitle: 'Medellin Public Market',
    palengkeItems: 'Sugarcane Juice, Biko, Sweet Corn, Pork Cuts, Kangkong',
    lat: 11.1306, lng: 123.9639,
    specialty: 'Medellin Biko & Sugarcane Delicacies',
    famousDishes: [
      { name: 'Biko sa Medellin', desc: 'Sticky sweet brown rice cake rich with coconut milk and topped with toasted latik.' },
      { name: 'Sinugbang Pork Tenderloin', desc: 'Lean pork cut grilled over coals with sweet sugarcane-infused marinade.' },
    ],
  },
  'Naga City': {
    marketTitle: 'Naga City Central Market & Boardwalk',
    palengkeItems: 'Tangigue, Chicken Inasal, Pork Belly, Chicharon, Calamansi',
    lat: 10.2089, lng: 123.7578,
    specialty: 'Naga Boardwalk Seafood & Chicharon',
    famousDishes: [
      { name: 'Sinugbang Tangigue sa Boardwalk', desc: 'Fresh king mackerel grilled by the bay, served with calamansi soy sauce.' },
      { name: 'Inasal nga Manok sa Naga', desc: 'Golden annatto-glazed grilled chicken skewer.' },
    ],
  },
  'Pinamungajan': {
    marketTitle: 'Pinamungajan Municipal Market',
    palengkeItems: 'Tañon Strait Bangus, Native Fish, Calamansi, Kamote Tops',
    lat: 10.2689, lng: 123.5856,
    specialty: 'Tañon Strait Bangus Inasal',
    famousDishes: [
      { name: 'Bangus Inasal sa Pinamungajan', desc: 'Deboned milkfish marinated in calamansi and garlic, grilled golden.' },
      { name: 'Kinilaw nga Isda sa Pinamungajan', desc: 'Cured fresh catch with native vinegar, ginger, and chili.' },
    ],
  },
  'Ronda': {
    marketTitle: 'Ronda Public Market',
    palengkeItems: 'Pork Belly, Tuba Vinegar, Native Greens, Sweet Corn, Calamansi',
    lat: 9.9197, lng: 123.4478,
    specialty: 'Ronda Humba sa Tuba',
    famousDishes: [
      { name: 'Humba sa Tuba sa Ronda', desc: 'Tender braised pork belly slow-simmered in fermented palm tuba vinegar.' },
      { name: 'Gisadong Kangkong sa Ahos', desc: 'Stir-fried water spinach with toasted native garlic.' },
    ],
  },
  'Samboan': {
    marketTitle: 'Samboan Public Market',
    palengkeItems: 'Native Chicken, River Tilapia, Sayote, Malunggay, Ginger',
    lat: 9.5317, lng: 123.3083,
    specialty: 'Aguinid River Catch & Native Chicken Tinola',
    famousDishes: [
      { name: 'Tinolang Manok sa Aguinid', desc: 'Aromatic native chicken soup with ginger, green papaya, and moringa leaves.' },
      { name: 'Sinugbang Tilapia sa Samboan', desc: 'Fresh river tilapia grilled over open flame with calamansi relish.' },
    ],
  },
  'San Fernando': {
    marketTitle: 'San Fernando Public Market',
    palengkeItems: 'Pork Cuts, Chicharon, Fresh Coastal Fish, Native Greens',
    lat: 10.1611, lng: 123.7094,
    specialty: 'San Fernando Sinugba & Chicharon',
    famousDishes: [
      { name: 'Sinugbang Baboy sa San Fernando', desc: 'Charcoal-grilled lean pork chops with spicy native vinegar dip.' },
      { name: 'Utan Bisaya nga adunay Isda', desc: 'Clear vegetable stew flavored with fried fish broth.' },
    ],
  },
  'Santa Fe': {
    marketTitle: 'Santa Fe Public Market (Bantayan)',
    palengkeItems: 'Scallops, Danggit, Blue Crabs, Shellfish, Young Coconut',
    lat: 11.1556, lng: 123.8056,
    specialty: 'Santa Fe Baked Scallops & Buwad Danggit',
    famousDishes: [
      { name: 'Grilled Scallops sa Santa Fe', desc: 'Sweet ocean scallops grilled in their shells with garlic and butter.' },
      { name: 'Buwad Danggit sa Pamahaw', desc: 'Crispy sun-dried rabbitfish served with garlic rice and egg.' },
    ],
  },
  'Santander': {
    marketTitle: 'Santander Pier & Public Market',
    palengkeItems: 'Yellowfin Tuna, Fresh Lato, Calamansi, Cucumber, Kamote',
    lat: 9.4217, lng: 123.3361,
    specialty: 'Tañon Strait Tuna & Fresh Lato Salad',
    famousDishes: [
      { name: 'Kinilaw nga Tuna sa Santander', desc: 'Southern Cebu yellowfin tuna cured fresh with coconut tuba vinegar and ginger.' },
      { name: 'Salada nga Lato sa Calamansi', desc: 'Pop-in-your-mouth sea grapes with diced onions and calamansi juice.' },
    ],
  },
  'Sibonga': {
    marketTitle: 'Sibonga Public Market',
    palengkeItems: 'Carabao Milk Pastillas, Native Chicken, Vegetables, Sweet Corn',
    lat: 10.0167, lng: 123.6167,
    specialty: 'Pastillas de Leche sa Sibonga & Native Stew',
    famousDishes: [
      { name: 'Pastillas de Leche sa Sibonga', desc: 'Sweet, creamy melt-in-your-mouth milk confection from local dairy carabaos.' },
      { name: 'Kinalan nga Manok sa Sibonga', desc: 'Farm chicken stewed with yellow squash and native long beans.' },
    ],
  },
  'Sogod': {
    marketTitle: 'Sogod Municipal Market',
    palengkeItems: 'Fresh Sea Catch, Sweet Corn, Buko Water, Calamansi, Tomatoes',
    lat: 10.7486, lng: 124.0042,
    specialty: 'Sogod Bay Fresh Seafood & Sweet Corn',
    famousDishes: [
      { name: 'Sinugbang Isda sa Sogod', desc: 'Sweet ocean fish caught in Sogod Bay, grilled fresh over hot coconut coals.' },
      { name: 'Luto nga Mais sa Karsada', desc: 'Steamed native yellow corn on the cob.' },
    ],
  },
  'Tabogon': {
    marketTitle: 'Tabogon Public Market',
    palengkeItems: 'Bodboron Fish, Sweet Corn, Native Tomatoes, Calamansi, Kamote',
    lat: 10.9333, lng: 124.0333,
    specialty: 'Tabogon Sweet Corn & Inun-unan nga Bodboron',
    famousDishes: [
      { name: 'Inun-unan nga Bodboron sa Tabogon', desc: 'Fresh small mackerel simmered in native palm vinegar, ginger, and chili.' },
      { name: 'Sweet Corn sa Tabogon', desc: 'Locally grown tender sweet corn harvested fresh daily.' },
    ],
  },
  'Tabuelan': {
    marketTitle: 'Tabuelan Public Market (Maravilla)',
    palengkeItems: 'Tulingan Fish, Lato Seaweed, Calamansi, Buko Water, Sayote',
    lat: 10.9619, lng: 123.8647,
    specialty: 'Maravilla Fresh Tulingan & Seaweed Salad',
    famousDishes: [
      { name: 'Sinugbang Tulingan sa Maravilla', desc: 'White beach coastal tuna grilled over embers with spicy calamansi soy dip.' },
      { name: 'Salada nga Lato sa Baybayon', desc: 'Crisp ocean sea grapes tossed with tomatoes and native vinegar.' },
    ],
  },
  'San Francisco (Camotes)': {
    marketTitle: 'San Francisco Public Market (Camotes)',
    palengkeItems: 'Cassava, Coconut Crab, Fresh Fish, Buko, Native Chicken',
    lat: 10.6556, lng: 124.3111,
    specialty: 'Soli-Soli Cassava Treats & Island Seafood',
    famousDishes: [
      { name: 'Gihurnong Cassava sa Camotes', desc: 'Island-grown sweet cassava baked with pure coconut milk and young coconut strips.' },
      { name: 'Sinugbang Isda sa Santiago Bay', desc: 'Fresh reef fish grilled beachfront with spicy coconut vinegar.' },
    ],
  },
  'Poro (Camotes)': {
    marketTitle: 'Poro Central Public Market',
    palengkeItems: 'Fresh Fish, Buko, Native Chicken, Cassava, Malunggay',
    lat: 10.6319, lng: 124.4083,
    specialty: 'Halang-Halang nga Manok sa Gata sa Camotes',
    famousDishes: [
      { name: 'Halang-Halang nga Manok sa Camotes', desc: 'Native island chicken stewed in rich coconut cream with bird’s eye chili.' },
      { name: 'Sinigang nga Isda sa Tuba', desc: 'Sour fish soup made with island palm vinegar and greens.' },
    ],
  },
};

/**
 * Fetches a city food profile.
 * Tries the backend API first (Supabase cache → pre-seeded data → Gemini AI).
 * Falls back to static data if city is in the static list.
 * Falls back to PHILIPPINE_LOCATIONS directory if not in static list.
 *
 * @param {string} cityName - Name of the city or municipality
 * @returns {Promise<object|null>} City food profile or null
 */
export async function getCityFoodProfile(cityName) {
  if (!cityName) return null;

  // 1. Instant zero-latency check against STATIC_FALLBACK (contains all 53 Cebu LGUs & PH hubs)
  if (STATIC_FALLBACK[cityName]) {
    return STATIC_FALLBACK[cityName];
  }

  const cleanQ = cityName
    .toLowerCase()
    .replace(/\s*\(camotes\)/g, '')
    .replace(/^city of\s+/g, '')
    .replace(/\s+city$/g, '')
    .replace(/^municipality of\s+/g, '')
    .replace(/,\s*(cebu|philippines).*$/g, '')
    .trim();

  const cleanKey = Object.keys(STATIC_FALLBACK).find((k) => {
    const kClean = k
      .toLowerCase()
      .replace(/\s*\(camotes\)/g, '')
      .replace(/^city of\s+/g, '')
      .replace(/\s+city$/g, '')
      .replace(/^municipality of\s+/g, '')
      .trim();

    return (
      kClean === cleanQ ||
      k.toLowerCase() === cityName.toLowerCase() ||
      cityName.toLowerCase().includes(kClean) ||
      kClean.includes(cleanQ)
    );
  });

  if (cleanKey && STATIC_FALLBACK[cleanKey]) {
    return STATIC_FALLBACK[cleanKey];
  }

  // 2. Query backend API (Supabase cache / Gemini AI) with a resilient 5s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

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
    const isCanceled =
      err.name === 'AbortError' ||
      err.message?.includes('canceled') ||
      err.message?.includes('cancelled') ||
      err.message?.includes('aborted');

    if (!isCanceled && __DEV__) {
      console.warn(`[CityFoodService] API notice for "${cityName}":`, err.message);
    }
  }

  // 3. Robust fallback to PHILIPPINE_LOCATIONS directory
  if (Array.isArray(PHILIPPINE_LOCATIONS)) {
    const dirMatch = PHILIPPINE_LOCATIONS.find((l) => {
      const lName = (l.name || '').toLowerCase();
      const lNameClean = lName.replace(/\s+city$/i, '').trim();
      return (
        lName === cleanQ ||
        lNameClean === cleanQ ||
        lName.includes(cleanQ) ||
        cleanQ.includes(lNameClean)
      );
    });

    if (dirMatch) {
      return {
        marketTitle: dirMatch.marketTitle || `${dirMatch.name} Public Market`,
        palengkeItems: dirMatch.palengkeItems || 'Fresh Fish, Native Greens, Calamansi, Kamote, Eggs',
        lat: dirMatch.lat,
        lng: dirMatch.lng,
        specialty: dirMatch.specialty || `${dirMatch.name} Palengke Specialty`,
        famousDishes: [
          {
            name: dirMatch.specialty || `${dirMatch.name} Delicacy`,
            desc: `Iconic culinary specialty famous in ${dirMatch.name}, ${dirMatch.province || 'Philippines'}.`,
          },
          {
            name: `Sinugba ug Inun-unan sa ${dirMatch.name}`,
            desc: `Fresh local palengke seafood braised in native palm vinegar, ginger, and local herbs.`,
          },
        ],
      };
    }
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
    const isCanceled =
      err.name === 'AbortError' ||
      err.message?.includes('canceled') ||
      err.message?.includes('cancelled') ||
      err.message?.includes('aborted');

    if (!isCanceled) {
      console.warn('[CityFoodService] Failed to load markers:', err.message);
    }
  }

  // Fallback: return static fallback keys as markers if needed
  return Object.entries(STATIC_FALLBACK).map(([city_name, data]) => ({
    city_name,
    lat: data.lat,
    lng: data.lng,
    specialty: data.specialty || '',
  }));
}
