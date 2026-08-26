import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = '@ms_user_language_pref';

const LanguageContext = createContext();

// ─────────────────────────────────────────────────────────────────────────────
// APP-WIDE UI STRINGS – English / Tagalog / Cebuano
// Use t(key) in any screen to get the correct translation.
// ─────────────────────────────────────────────────────────────────────────────
const UI_STRINGS = {
  // ── NAV TABS ──────────────────────────────────────────────
  'Diet':      { English: 'Diet',      Tagalog: 'Diyeta',      Cebuano: 'Pagkaon'   },
  'Workout':   { English: 'Workout',   Tagalog: 'Ehersisyo',   Cebuano: 'Ehersisyo' },
  'Dashboard': { English: 'Dashboard', Tagalog: 'Dashboard',   Cebuano: 'Dashboard' },
  'Settings':  { English: 'Settings',  Tagalog: 'Mga Setting', Cebuano: 'Mga Setting' },
  'Scan':      { English: 'Scan',      Tagalog: 'I-scan',      Cebuano: 'I-scan'    },

  // ── MEAL CATEGORIES ───────────────────────────────────────
  'Breakfast': { English: 'Breakfast', Tagalog: 'Almusal',     Cebuano: 'Pamahaw'   },
  'Lunch':     { English: 'Lunch',     Tagalog: 'Tanghalian',  Cebuano: 'Paniudto'  },
  'Snack':     { English: 'Snack',     Tagalog: 'Meryenda',    Cebuano: 'Pama-an'   },
  'Dinner':    { English: 'Dinner',    Tagalog: 'Hapunan',     Cebuano: 'Panihapon' },
  'Meal':      { English: 'Meal',      Tagalog: 'Pagkain',     Cebuano: 'Pagkaon'   },

  // ── DIET SCREEN ───────────────────────────────────────────
  'AI Scheduled Meals':   { English: 'AI Scheduled Meals',  Tagalog: 'AI na Pagkain',      Cebuano: 'AI nga Pagkaon'      },
  'Local Diet':           { English: 'Local Diet',           Tagalog: 'Lokal na Diyeta',    Cebuano: 'Lokal nga Pagkaon'   },
  'Explore':              { English: 'Explore',              Tagalog: 'Tuklasin',           Cebuano: 'Tuklasin'            },
  'Generate AI Meals':    { English: 'Generate AI Meals',    Tagalog: 'Gumawa ng AI na Pagkain', Cebuano: 'Maghimo og AI nga Pagkaon' },
  'Regenerate':           { English: 'Regenerate',           Tagalog: 'I-regenerate',       Cebuano: 'I-regenerate'        },
  'No AI Meals Generated Yet': { English: 'No AI Meals Generated Yet', Tagalog: 'Wala Pang AI na Pagkain', Cebuano: 'Wala Pay AI nga Pagkaon' },
  'Tap below to generate custom meal recommendations calculated for your exact daily macros.': {
    English:  'Tap below to generate custom meal recommendations calculated for your exact daily macros.',
    Tagalog:  'Pindutin sa ibaba upang gumawa ng custom na rekomendasyon ng pagkain para sa iyong pang-araw-araw na macro.',
    Cebuano:  'I-tap sa ubos aron makahimo og custom nga rekomendasyon sa pagkaon alang sa imong adlaw-adlaw nga macro.'
  },
  'View Recipe':   { English: 'View Recipe',   Tagalog: 'Tingnan ang Recipe', Cebuano: 'Tan-awa ang Recipe'  },
  'Log This Meal': { English: 'Log This Meal', Tagalog: 'I-log ang Pagkain', Cebuano: 'I-log kining Pagkaon' },
  'Logged':        { English: 'Logged ✓',      Tagalog: 'Na-log na ✓',       Cebuano: 'Na-log na ✓'         },
  'Smart Rebalancing Active': { English: 'Smart Rebalancing Active', Tagalog: 'Aktibo ang Smart Rebalancing', Cebuano: 'Aktibo ang Smart Rebalancing' },
  'kcal goal!':    { English: 'kcal goal!',    Tagalog: 'kcal na layunin!',  Cebuano: 'kcal nga tumong!'    },
  'Generating personalized AI meals for your goals...': {
    English:  'Generating personalized AI meals for your goals...',
    Tagalog:  'Gumagawa ng personalisadong AI na pagkain para sa iyong mga layunin...',
    Cebuano:  'Naghimo og personalisadong AI nga pagkaon para sa imong mga tumong...'
  },
  'Ingredients': { English: 'Ingredients', Tagalog: 'Mga Sangkap',     Cebuano: 'Mga Sangkap'    },
  'Instructions': { English: 'Instructions', Tagalog: 'Mga Hakbang',    Cebuano: 'Mga Instruksyon' },
  'Calories':     { English: 'Calories',     Tagalog: 'Kalorina',       Cebuano: 'Kalorina'       },
  'Protein':      { English: 'Protein',      Tagalog: 'Protina',        Cebuano: 'Protina'        },
  'Carbs':        { English: 'Carbs',        Tagalog: 'Karbohidrato',   Cebuano: 'Karbohidrato'   },
  'Fats':         { English: 'Fats',         Tagalog: 'Taba',           Cebuano: 'Taba'           },
  'Today':        { English: 'Today',        Tagalog: 'Ngayon',         Cebuano: 'Karong Adlawa'  },
  'Nearby Palengke':  { English: 'Nearby Palengke',  Tagalog: 'Malapit na Palengke',    Cebuano: 'Duol nga Palengke'       },
  'Regional Delicacies': { English: 'Regional Delicacies', Tagalog: 'Mga Rehiyonal na Pagkain', Cebuano: 'Mga Espesyal nga Pagkaon' },
  'Find Markets': { English: 'Find Markets', Tagalog: 'Hanapin ang Palengke', Cebuano: 'Pangitaa ang Palengke' },
  'Search dishes, ingredients...': { English: 'Search dishes, ingredients...', Tagalog: 'Maghanap ng pagkain, sangkap...', Cebuano: 'Pangitaa ang pagkaon, sangkap...' },

  // ── NOTIFICATIONS ─────────────────────────────────────────
  'Notifications': { English: 'Notifications', Tagalog: 'Mga Abiso',    Cebuano: 'Mga Abiso'  },
  'New':           { English: 'New',           Tagalog: 'Bago',         Cebuano: 'Bag-o'      },
  'Recent':        { English: 'Recent',        Tagalog: 'Kamakailan',   Cebuano: 'Bag-o Lang' },
  'Mark Read':     { English: 'Mark Read',     Tagalog: 'Markahan Bilang Nabasa', Cebuano: 'Markahan Nabasa' },
  'Clear All':     { English: 'Clear All',     Tagalog: 'I-clear Lahat',Cebuano: 'I-clear Tanan' },
  "You're all caught up!": { English: "You're all caught up!", Tagalog: 'Lahat ay nabasa na!', Cebuano: 'Nabasa na ang tanan!' },
  "No notifications here. We'll let you know when something important happens.": {
    English:  "No notifications here. We'll let you know when something important happens.",
    Tagalog:  'Wala pang mga abiso. Ipapaalam namin sa iyo kapag may mahalaga.',
    Cebuano:  'Walay mga abiso dinhi. Ipahibalo namo kung adunay importante.'
  },
  'Clear All Notifications': { English: 'Clear All Notifications', Tagalog: 'I-clear Lahat ng Abiso', Cebuano: 'I-clear Tanan nga Abiso' },
  'This will permanently remove all notifications. Are you sure?': {
    English:  'This will permanently remove all notifications. Are you sure?',
    Tagalog:  'Permanenteng matatanggal ang lahat ng abiso. Sigurado ka ba?',
    Cebuano:  'Permanenteng matangtang ang tanan nga abiso. Sigurado ka ba?'
  },
  'Cancel': { English: 'Cancel', Tagalog: 'Kanselahin', Cebuano: 'Kanselahon' },
  'Notifications are personalized based on your behavior, goals, and daily routines to help you maintain consistency.': {
    English:  'Notifications are personalized based on your behavior, goals, and daily routines to help you maintain consistency.',
    Tagalog:  'Ang mga abiso ay naipapersonal batay sa iyong gawi, mga layunin, at pang-araw-araw na gawain.',
    Cebuano:  'Ang mga abiso gi-personalize base sa imong kinaiya, mga tumong, ug adlaw-adlaw nga rutina.'
  },

  // ── SETTINGS ──────────────────────────────────────────────
  'Language & Localization': { English: 'Language & Localization', Tagalog: 'Wika at Lokalisasyon', Cebuano: 'Sinultihan ug Lokalisasyon' },
  'Choose your preferred language for meal names and app content.': {
    English:  'Choose your preferred language for meal names and app content.',
    Tagalog:  'Piliin ang inyong gustong wika para sa mga pangalan ng pagkain at nilalaman ng app.',
    Cebuano:  'Pilia ang imong gusto nga sinultihan para sa mga ngalan sa pagkaon ug sulod sa app.'
  },
  'Language Updated': { English: 'Language Updated', Tagalog: 'Na-update ang Wika', Cebuano: 'Na-update ang Sinultihan' },
  'Meal names will now display in': {
    English:  'Meal names will now display in',
    Tagalog:  'Ang mga pangalan ng pagkain ay ipapakita na sa',
    Cebuano:  'Ang mga ngalan sa pagkaon ipakita na sa'
  },

  // ── FOOD SCANNER ──────────────────────────────────────────
  'Scan Food':    { English: 'Scan Food',    Tagalog: 'I-scan ang Pagkain',    Cebuano: 'I-scan ang Pagkaon'    },
  'Analyzing...': { English: 'Analyzing...', Tagalog: 'Sinusuri...',           Cebuano: 'Gi-analyze...'         },
  'Log Meal':     { English: 'Log Meal',     Tagalog: 'I-log ang Pagkain',     Cebuano: 'I-log ang Pagkaon'     },
  'Scan Again':   { English: 'Scan Again',   Tagalog: 'I-scan Muli',           Cebuano: 'I-scan Pag-usab'       },
  'Take Photo':   { English: 'Take Photo',   Tagalog: 'Kumuha ng Larawan',     Cebuano: 'Kuhaan og Litrato'     },
  'Upload Image': { English: 'Upload Image', Tagalog: 'Mag-upload ng Larawan', Cebuano: 'Mag-upload og Larawan' },

  // ── COMMON ────────────────────────────────────────────────
  'Save':       { English: 'Save',       Tagalog: 'I-save',      Cebuano: 'I-save'      },
  'Close':      { English: 'Close',      Tagalog: 'Isara',       Cebuano: 'Isira'       },
  'Done':       { English: 'Done',       Tagalog: 'Tapos na',    Cebuano: 'Human na'    },
  'Error':      { English: 'Error',      Tagalog: 'Error',       Cebuano: 'Error'       },
  'Success':    { English: 'Success',    Tagalog: 'Tagumpay',    Cebuano: 'Kalampusan'  },
  'Loading...': { English: 'Loading...', Tagalog: 'Nilo-load...', Cebuano: 'Nag-load...' },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('English'); // Default: English ('English' | 'Tagalog' | 'Cebuano')

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLang === 'English' || savedLang === 'Tagalog' || savedLang === 'Cebuano') {
          setLanguageState(savedLang);
        }
      } catch (err) {
        console.log('Error loading saved language:', err);
      }
    };
    loadSavedLanguage();
  }, []);

  const setLanguage = async (newLang) => {
    try {
      setLanguageState(newLang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch (err) {
      console.log('Error saving language:', err);
    }
  };

  // ── t() – Translate any UI string key ──────────────────────
  const t = (key, targetLang = language) => {
    if (!key) return '';
    const entry = UI_STRINGS[key];
    if (entry && entry[targetLang]) return entry[targetLang];
    return key; // Fallback: return the key unchanged
  };

  // Smart Meal Title Translator engine for English, Tagalog, and Cebuano
  const translateMealTitle = (title, targetLang = language) => {
    if (!title || typeof title !== 'string') return title || '';

    // Direct Exact Phrase Dictionary
    const EXACT_TRANSLATIONS = {
      'Luto nga Itlog sa Subak nga Kangkong ug Calamansi Tea': {
        English: 'Boiled Eggs with Water Spinach & Calamansi Tea',
        Tagalog: 'Lutong Itlog sa Kangkong at Calamansi Tea',
        Cebuano: 'Luto nga Itlog sa Subak nga Kangkong ug Calamansi Tea'
      },
      'Gisadong Singkamas ug Scrambled Itlog Bisaya': {
        English: 'Sautéed Jicama & Native Scrambled Eggs',
        Tagalog: 'Ginisang Singkamas at Scrambled na Itlog',
        Cebuano: 'Gisadong Singkamas ug Scrambled Itlog Bisaya'
      },
      'Sinugbang Tyan sa Bangus ug Binisaya nga Humay': {
        English: 'Grilled Milkfish Belly with Native Rice',
        Tagalog: 'Inihaw na Tiyan ng Bangus at Kanin',
        Cebuano: 'Sinugbang Tyan sa Bangus ug Binisaya nga Humay'
      },
      'Kinilaw nga Tangigue ug Sabaw sa Pasil Isda ug Bugas': {
        English: 'Cured Mackerel Ceviche & Pasil Fish Soup with Rice',
        Tagalog: 'Kilawin na Tanigue at Sabaw ng Isda sa Kanin',
        Cebuano: 'Kinilaw nga Tangigue ug Sabaw sa Pasil Isda ug Bugas'
      },
      'Sinugbang Tilapia Fillet ug Salada nga Lato': {
        English: 'Grilled Tilapia Fillet with Sea Grape Salad',
        Tagalog: 'Inihaw na Tilapia Fillet at Salad na Lato',
        Cebuano: 'Sinugbang Tilapia Fillet ug Salada nga Lato'
      },
      'Tinolang Manok Bisaya nga adunay Sayote ug Malunggay': {
        English: 'Native Chicken Soup with Chayote & Moringa',
        Tagalog: 'Tinolang Manok na may Sayote at Malunggay',
        Cebuano: 'Tinolang Manok Bisaya nga adunay Sayote ug Malunggay'
      },
      'Sinigang-Spiced Bangus Flakes with Sinangag & Fried Itlog': {
        English: 'Sinigang-Spiced Bangus Flakes with Sinangag & Fried Egg',
        Tagalog: 'Sinigang na Bangus sa Sinangag at Pritong Itlog',
        Cebuano: 'Sinigang nga Bangus sa Sinangag ug Pritong Itlog'
      },
      'Calama-Garlic Chicken Breast Adobo with Steamed Kamote': {
        English: 'Calamansi-Garlic Chicken Breast Adobo with Steamed Sweet Potato',
        Tagalog: 'Adobong Manok sa Bawang at Nilagang Kamote',
        Cebuano: 'Adobong Manok Bisaya sa Ahos ug Luto nga Kamote'
      },
      'Boiled Saba Banana with Muscovado Drizzle': {
        English: 'Boiled Saba Banana with Muscovado Drizzle',
        Tagalog: 'Nilagang Saging na Saba',
        Cebuano: 'Luto nga Saging Saba sa Muscovado'
      },
      'Pan-Seared Tilapia Fillet in Ginger Tinola Broth with Malunggay': {
        English: 'Pan-Seared Tilapia Fillet in Ginger Tinola Broth with Malunggay',
        Tagalog: 'Inihaw na Tilapia sa Sabaw ng Tinola at Malunggay',
        Cebuano: 'Sinugbang Tilapia sa Sabaw sa Tinola ug Malunggay'
      }
    };

    if (EXACT_TRANSLATIONS[title] && EXACT_TRANSLATIONS[title][targetLang]) {
      return EXACT_TRANSLATIONS[title][targetLang];
    }

    let translated = title;

    if (targetLang === 'Tagalog') {
      // 1. Convert Bisaya words to Tagalog
      translated = translated
        .replace(/Sinugbang/gi, 'Inihaw na')
        .replace(/Gisadong/gi, 'Ginisang')
        .replace(/Kinilaw nga/gi, 'Kilawin na')
        .replace(/Inun-unan na|Inun-unan nga/gi, 'Paksiw na')
        .replace(/Luto nga/gi, 'Lutong')
        .replace(/Sabaw sa/gi, 'Sabaw ng')
        .replace(/Salada nga/gi, 'Salad na')
        .replace(/ ug /gi, ' at ')
        .replace(/ na adunay /gi, ' na may ')
        .replace(/ adunay /gi, ' na may ')
        .replace(/Humay|Bugas/gi, 'Kanin')
        .replace(/Ahos/gi, 'Bawang')
        .replace(/Presko nga/gi, 'Sariwang')
        .replace(/Hilaw nga/gi, 'Sariwang');

      // 2. Convert English AI words to Tagalog
      translated = translated
        .replace(/Pan-Seared/gi, 'Inihaw na')
        .replace(/Grilled/gi, 'Inihaw na')
        .replace(/Steamed/gi, 'Nilagang')
        .replace(/Boiled/gi, 'Nilagang')
        .replace(/Fried/gi, 'Pritong')
        .replace(/Sautéed/gi, 'Ginisang')
        .replace(/Chicken Breast/gi, 'Dibdib ng Manok')
        .replace(/Chicken/gi, 'Manok')
        .replace(/Broth with/gi, 'Sabaw na may')
        .replace(/Broth/gi, 'Sabaw')
        .replace(/Soup/gi, 'Sabaw')
        .replace(/with/gi, 'na may')
        .replace(/In Ginger/gi, 'sa Luya')
        .replace(/Ginger/gi, 'Luya')
        .replace(/Garlic/gi, 'Bawang')
        .replace(/Sweet Potato/gi, 'Kamote')
        .replace(/Drizzle/gi, '');

    } else if (targetLang === 'Cebuano') {
      // 1. Convert English AI words to Cebuano / Bisaya
      translated = translated
        .replace(/Pan-Seared/gi, 'Sinugbang')
        .replace(/Grilled/gi, 'Sinugbang')
        .replace(/Steamed/gi, 'Luto nga')
        .replace(/Boiled/gi, 'Luto nga')
        .replace(/Fried/gi, 'Pritong')
        .replace(/Sautéed/gi, 'Gisadong')
        .replace(/Chicken Breast/gi, 'Dughan sa Manok')
        .replace(/Chicken/gi, 'Manok Bisaya')
        .replace(/Broth with/gi, 'Sabaw ug')
        .replace(/Broth/gi, 'Sabaw')
        .replace(/Soup/gi, 'Sabaw')
        .replace(/with/gi, 'ug')
        .replace(/In Ginger/gi, 'sa Luya')
        .replace(/Ginger/gi, 'Luya')
        .replace(/Garlic/gi, 'Ahos')
        .replace(/Sweet Potato/gi, 'Kamote')
        .replace(/Flakes/gi, 'Bits')
        .replace(/Drizzle/gi, '');

      // 2. Convert Tagalog words to Cebuano
      translated = translated
        .replace(/Inihaw na/gi, 'Sinugbang')
        .replace(/Ginisang/gi, 'Gisadong')
        .replace(/Kilawin na/gi, 'Kinilaw nga')
        .replace(/Paksiw na/gi, 'Inun-unan nga')
        .replace(/Lutong/gi, 'Luto nga')
        .replace(/Sabaw ng/gi, 'Sabaw sa')
        .replace(/Salad na/gi, 'Salada nga')
        .replace(/ at /gi, ' ug ')
        .replace(/ na may /gi, ' nga adunay ')
        .replace(/ Kanin/gi, ' Humay')
        .replace(/Bawang/gi, 'Ahos')
        .replace(/Sariwang/gi, 'Presko nga');

    } else if (targetLang === 'English') {
      // 1. Convert Bisaya words to English
      translated = translated
        .replace(/Sinugbang/gi, 'Grilled')
        .replace(/Gisadong/gi, 'Sautéed')
        .replace(/Tinolang/gi, 'Chicken Soup with')
        .replace(/Kinilaw nga/gi, 'Cured')
        .replace(/Inun-unan na|Inun-unan nga/gi, 'Vinegar Braised')
        .replace(/Luto nga/gi, 'Steamed')
        .replace(/Sabaw sa/gi, 'Soup with')
        .replace(/Salada nga/gi, 'Salad with')
        .replace(/ ug /gi, ' & ')
        .replace(/ na adunay /gi, ' with ')
        .replace(/ adunay /gi, ' with ')
        .replace(/Itlog/gi, 'Egg')
        .replace(/Manok/gi, 'Chicken')
        .replace(/Isda/gi, 'Fish')
        .replace(/Bangus/gi, 'Milkfish')
        .replace(/Baboy/gi, 'Pork')
        .replace(/Kamatis/gi, 'Tomatoes')
        .replace(/Talong/gi, 'Eggplant')
        .replace(/Kalabasa/gi, 'Squash')
        .replace(/Kamote/gi, 'Sweet Potato')
        .replace(/Mais/gi, 'Corn')
        .replace(/Humay|Bugas/gi, 'Rice')
        .replace(/Ahos/gi, 'Garlic')
        .replace(/Luya/gi, 'Ginger')
        .replace(/Presko nga/gi, 'Fresh')
        .replace(/Hilaw nga/gi, 'Raw');

      // 2. Convert Tagalog words to English
      translated = translated
        .replace(/Inihaw na/gi, 'Grilled')
        .replace(/Ginisang/gi, 'Sautéed')
        .replace(/Kilawin na/gi, 'Cured')
        .replace(/Paksiw na/gi, 'Vinegar Braised')
        .replace(/Lutong/gi, 'Steamed')
        .replace(/Sabaw ng/gi, 'Soup with')
        .replace(/Salad na/gi, 'Salad with')
        .replace(/ at /gi, ' & ')
        .replace(/ na may /gi, ' with ')
        .replace(/Kanin/gi, 'Rice')
        .replace(/Bawang/gi, 'Garlic')
        .replace(/Sariwang/gi, 'Fresh');
    }

    return translated;
  };

  const translateMealCategory = (category, targetLang = language) => {
    if (!category || typeof category !== 'string') return 'Meal';
    const cleanCat = category.trim();
    if (targetLang === 'Tagalog') {
      if (cleanCat === 'Breakfast') return 'Almusal';
      if (cleanCat === 'Lunch') return 'Tanghalian';
      if (cleanCat === 'Snack') return 'Meryenda';
      if (cleanCat === 'Dinner') return 'Hapunan';
    } else if (targetLang === 'Cebuano') {
      if (cleanCat === 'Breakfast') return 'Pamahaw';
      if (cleanCat === 'Lunch') return 'Paniudto';
      if (cleanCat === 'Snack') return 'Pama-an';
      if (cleanCat === 'Dinner') return 'Panihapon';
    }
    return cleanCat;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateMealTitle, translateMealCategory }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
