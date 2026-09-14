import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../screens/config/api';

const LANGUAGE_STORAGE_KEY = '@ms_user_language_pref';
const TRANSLATIONS_CACHE_PREFIX = '@ms_remote_translations_';

const LanguageContext = createContext();

// ─────────────────────────────────────────────────────────────────────────────
// ESSENTIAL OFFLINE BASELINE STRINGS
// Guarantees zero-blank UI even on clean install with no internet connection.
// ─────────────────────────────────────────────────────────────────────────────
const CORE_FALLBACK_STRINGS = {
  'Diet': { English: 'Diet', Tagalog: 'Diyeta', Cebuano: 'Pagkaon' },
  'Workout': { English: 'Workout', Tagalog: 'Ehersisyo', Cebuano: 'Ehersisyo' },
  'Dashboard': { English: 'Dashboard', Tagalog: 'Dashboard', Cebuano: 'Dashboard' },
  'Settings': { English: 'Settings', Tagalog: 'Mga Setting', Cebuano: 'Mga Setting' },
  'Scan': { English: 'Scan', Tagalog: 'I-scan', Cebuano: 'I-scan' },

  'Breakfast': { English: 'Breakfast', Tagalog: 'Almusal', Cebuano: 'Pamahaw' },
  'Lunch': { English: 'Lunch', Tagalog: 'Tanghalian', Cebuano: 'Paniudto' },
  'Snack': { English: 'Snack', Tagalog: 'Meryenda', Cebuano: 'Merienda' },
  'Dinner': { English: 'Dinner', Tagalog: 'Hapunan', Cebuano: 'Panihapon' },
  'Meal': { English: 'Meal', Tagalog: 'Pagkain', Cebuano: 'Pagkaon' },

  'AI Scheduled Meals': { English: 'AI Scheduled Meals', Tagalog: 'AI na Pagkain', Cebuano: 'AI nga Pagkaon' },
  'Local Diet': { English: 'Local Diet', Tagalog: 'Lokal na Diyeta', Cebuano: 'Lokal nga Pagkaon' },
  'Explore': { English: 'Explore', Tagalog: 'Tuklasin', Cebuano: 'Tuklasin' },
  'Generate AI Meals': { English: 'Generate AI Meals', Tagalog: 'Gumawa ng AI na Pagkain', Cebuano: 'Maghimo og AI nga Pagkaon' },
  'Regenerate': { English: 'Regenerate', Tagalog: 'I-regenerate', Cebuano: 'I-regenerate' },
  'No AI Meals Generated Yet': { English: 'No AI Meals Generated Yet', Tagalog: 'Wala Pang AI na Pagkain', Cebuano: 'Wala Pay AI nga Pagkaon' },
  'Tap below to generate custom meal recommendations calculated for your exact daily macros.': {
    English: 'Tap below to generate custom meal recommendations calculated for your exact daily macros.',
    Tagalog: 'Pindutin sa ibaba upang gumawa ng custom na rekomendasyon ng pagkain para sa iyong pang-araw-araw na macro.',
    Cebuano: 'I-tap sa ubos aron makahimo og custom nga rekomendasyon sa pagkaon alang sa imong adlaw-adlaw nga macro.'
  },
  'View Recipe': { English: 'View Recipe', Tagalog: 'Tingnan ang Recipe', Cebuano: 'Tan-awa ang Recipe' },
  'Log This Meal': { English: 'Log This Meal', Tagalog: 'I-log ang Pagkain', Cebuano: 'I-log kining Pagkaon' },
  'Logged': { English: 'Logged ✓', Tagalog: 'Na-log na ✓', Cebuano: 'Na-log na ✓' },
  'Smart Rebalancing Active': { English: 'Smart Rebalancing Active', Tagalog: 'Aktibo ang Smart Rebalancing', Cebuano: 'Aktibo ang Smart Rebalancing' },
  'kcal goal!': { English: 'kcal goal!', Tagalog: 'kcal na layunin!', Cebuano: 'kcal nga tumong!' },
  'Ingredients': { English: 'Ingredients', Tagalog: 'Mga Sangkap', Cebuano: 'Mga Sangkap' },
  'Instructions': { English: 'Instructions', Tagalog: 'Mga Hakbang', Cebuano: 'Mga Instruksyon' },
  'Calories': { English: 'Calories', Tagalog: 'Kalorina', Cebuano: 'Kalorina' },
  'Protein': { English: 'Protein', Tagalog: 'Protina', Cebuano: 'Protina' },
  'Carbs': { English: 'Carbs', Tagalog: 'Karbohidrato', Cebuano: 'Karbohidrato' },
  'Fats': { English: 'Fats', Tagalog: 'Taba', Cebuano: 'Taba' },
  'Today': { English: 'Today', Tagalog: 'Ngayon', Cebuano: 'Karong Adlawa' },

  'Language & Localization': { English: 'Language & Localization', Tagalog: 'Wika at Lokalisasyon', Cebuano: 'Sinultihan ug Lokalisasyon' },
  'Choose your preferred language for meal names and app content.': {
    English: 'Choose your preferred language for meal names and app content.',
    Tagalog: 'Piliin ang inyong gustong wika para sa mga pangalan ng pagkain at nilalaman ng app.',
    Cebuano: 'Pilia ang imong gusto nga sinultihan para sa mga ngalan sa pagkaon ug sulod sa app.'
  },
  'Language Updated': { English: 'Language Updated', Tagalog: 'Na-update ang Wika', Cebuano: 'Na-update ang Sinultihan' },
  'Meal names will now display in': {
    English: 'Meal names will now display in',
    Tagalog: 'Ang mga pangalan ng pagkain ay ipapakita na sa',
    Cebuano: 'Ang mga ngalan sa pagkaon ipakita na sa'
  },

  'Scan Food': { English: 'Scan Food', Tagalog: 'I-scan ang Pagkain', Cebuano: 'I-scan ang Pagkaon' },
  'Analyzing...': { English: 'Analyzing...', Tagalog: 'Sinusuri...', Cebuano: 'Gi-analyze...' },
  'Log Meal': { English: 'Log Meal', Tagalog: 'I-log ang Pagkain', Cebuano: 'I-log ang Pagkaon' },
  'Scan Again': { English: 'Scan Again', Tagalog: 'I-scan Muli', Cebuano: 'I-scan Pag-usab' },

  'Save': { English: 'Save', Tagalog: 'I-save', Cebuano: 'I-save' },
  'Close': { English: 'Close', Tagalog: 'Isara', Cebuano: 'Isira' },
  'Done': { English: 'Done', Tagalog: 'Tapos na', Cebuano: 'Human na' },
  'Error': { English: 'Error', Tagalog: 'Error', Cebuano: 'Error' },
  'Success': { English: 'Success', Tagalog: 'Tagumpay', Cebuano: 'Kalampusan' },
  'Loading...': { English: 'Loading...', Tagalog: 'Nilo-load...', Cebuano: 'Nag-load...' }
};

const CORE_FALLBACK_MEALS = {
  'Chicken Adobo': { English: 'Chicken Adobo', Tagalog: 'Adobong Manok', Cebuano: 'Adobong Manok' },
  'Pork Adobo': { English: 'Pork Adobo', Tagalog: 'Adobong Baboy', Cebuano: 'Adobong Baboy' },
  'Pork Sinigang': { English: 'Pork Sinigang (Sour Pork Soup)', Tagalog: 'Sinigang na Baboy', Cebuano: 'Sinigang nga Baboy' },
  'Chicken Sinigang': { English: 'Chicken Sinigang', Tagalog: 'Sinigang na Manok', Cebuano: 'Sinigang nga Manok' },
  'Tortang Talong': { English: 'Eggplant Omelette (Tortang Talong)', Tagalog: 'Tortang Talong', Cebuano: 'Tortang Talong' },
  'Ginisang Monggo': { English: 'Sautéed Mung Bean Soup (Ginisang Monggo)', Tagalog: 'Ginisang Monggo', Cebuano: 'Gisadong Monggos' },
  'Beef Bulalo': { English: 'Beef Bone Marrow Soup (Bulalo)', Tagalog: 'Bulalo ng Baka', Cebuano: 'Bulalo nga Baka' },
  'Pork Sisig': { English: 'Sizzling Pork Sisig', Tagalog: 'Sisig na Baboy', Cebuano: 'Sisig nga Baboy' },
  'Chicken Inasal': { English: 'Grilled Chicken Inasal', Tagalog: 'Inihaw na Manok (Inasal)', Cebuano: 'Inasal nga Manok' }
};

const CORE_FALLBACK_CATEGORIES = {
  'Breakfast': { English: 'Breakfast', Tagalog: 'Almusal', Cebuano: 'Pamahaw' },
  'Lunch': { English: 'Lunch', Tagalog: 'Tanghalian', Cebuano: 'Paniudto' },
  'Snack': { English: 'Snack', Tagalog: 'Meryenda', Cebuano: 'Merienda' },
  'Dinner': { English: 'Dinner', Tagalog: 'Hapunan', Cebuano: 'Panihapon' },
  'Meal': { English: 'Meal', Tagalog: 'Pagkain', Cebuano: 'Pagkaon' }
};

// Global memory cache across sessions
const memoryCatalogCache = {
  English: null,
  Tagalog: null,
  Cebuano: null
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('English');
  const [dynamicCatalog, setDynamicCatalog] = useState({
    strings: {},
    meal_titles: {},
    categories: {}
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const activeLangRef = useRef(language);
  activeLangRef.current = language;

  // ── 1. OTA Background Fetcher ──────────────────────────────
  const fetchRemoteTranslations = useCallback(async (targetLang) => {
    if (!targetLang) return;
    try {
      setIsSyncing(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${API_URL}/translations/${encodeURIComponent(targetLang)}`, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.strings) {
          memoryCatalogCache[targetLang] = data;
          if (activeLangRef.current === targetLang) {
            setDynamicCatalog(data);
          }
          await AsyncStorage.setItem(`${TRANSLATIONS_CACHE_PREFIX}${targetLang}`, JSON.stringify(data));
        }
      }
    } catch (err) {
      if (__DEV__) console.log("OTA translation sync notice:", err?.message || err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // ── 2. Load Language & Cached Translations on Mount ────────
  useEffect(() => {
    let isMounted = true;

    const initializeLocalization = async () => {
      try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        const resolvedLang = (savedLang === 'Tagalog' || savedLang === 'Cebuano') ? savedLang : 'English';
        
        if (isMounted) {
          setLanguageState(resolvedLang);
        }

        // Check memory cache first
        if (memoryCatalogCache[resolvedLang]) {
          if (isMounted) setDynamicCatalog(memoryCatalogCache[resolvedLang]);
        } else {
          // Check local AsyncStorage cache (0ms instant load)
          const cachedRaw = await AsyncStorage.getItem(`${TRANSLATIONS_CACHE_PREFIX}${resolvedLang}`);
          if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            if (parsed && parsed.strings) {
              memoryCatalogCache[resolvedLang] = parsed;
              if (isMounted) setDynamicCatalog(parsed);
            }
          }
        }

        // Silent background update to pick up new remote changes
        fetchRemoteTranslations(resolvedLang);
      } catch (err) {
        if (__DEV__) console.log("Error initializing localization:", err);
      }
    };

    initializeLocalization();

    return () => { isMounted = false; };
  }, [fetchRemoteTranslations]);

  // ── 3. Switch Language ─────────────────────────────────────
  const setLanguage = async (newLang) => {
    try {
      setLanguageState(newLang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);

      // Instantly apply memory or cached translations for this new language
      if (memoryCatalogCache[newLang]) {
        setDynamicCatalog(memoryCatalogCache[newLang]);
      } else {
        const cachedRaw = await AsyncStorage.getItem(`${TRANSLATIONS_CACHE_PREFIX}${newLang}`);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed && parsed.strings) {
            memoryCatalogCache[newLang] = parsed;
            setDynamicCatalog(parsed);
          }
        }
      }

      // Sync fresh translations from backend
      fetchRemoteTranslations(newLang);
    } catch (err) {
      console.log('Error saving language:', err);
    }
  };

  // ── 4. Dynamic t() – Translate any UI string key ───────────
  const t = useCallback((key, targetLang = language) => {
    if (!key) return '';

    // 1. Check dynamic remote catalog
    if (targetLang === language && dynamicCatalog.strings && dynamicCatalog.strings[key]) {
      return dynamicCatalog.strings[key];
    }
    if (memoryCatalogCache[targetLang]?.strings?.[key]) {
      return memoryCatalogCache[targetLang].strings[key];
    }

    // 2. Check offline core fallback
    const fallbackEntry = CORE_FALLBACK_STRINGS[key];
    if (fallbackEntry && fallbackEntry[targetLang]) {
      return fallbackEntry[targetLang];
    }

    return key;
  }, [language, dynamicCatalog]);

  // ── 5. Dynamic Meal Title Translator ───────────────────────
  const translateMealTitle = useCallback((title, targetLang = language) => {
    if (!title || typeof title !== 'string') return title || '';

    // 1. Check dynamic remote catalog meal titles
    if (targetLang === language && dynamicCatalog.meal_titles && dynamicCatalog.meal_titles[title]) {
      return dynamicCatalog.meal_titles[title];
    }
    if (memoryCatalogCache[targetLang]?.meal_titles?.[title]) {
      return memoryCatalogCache[targetLang].meal_titles[title];
    }

    // Case-insensitive match in dynamic meal titles
    const lowerTitle = title.toLowerCase();
    const activeMeals = (targetLang === language ? dynamicCatalog.meal_titles : memoryCatalogCache[targetLang]?.meal_titles) || {};
    for (const k in activeMeals) {
      if (k.toLowerCase() === lowerTitle) {
        return activeMeals[k];
      }
    }

    // 2. Check offline core fallback meals
    if (CORE_FALLBACK_MEALS[title] && CORE_FALLBACK_MEALS[title][targetLang]) {
      return CORE_FALLBACK_MEALS[title][targetLang];
    }

    for (const k in CORE_FALLBACK_MEALS) {
      if (k.toLowerCase() === lowerTitle) {
        return CORE_FALLBACK_MEALS[k][targetLang];
      }
    }

    // 3. Fallback linguistic rules
    let translated = title;
    if (targetLang === 'Tagalog') {
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
        .replace(/Hilaw nga/gi, 'Sariwang')
        .replace(/Pan-Seared/gi, 'Inihaw na')
        .replace(/Grilled/gi, 'Inihaw na')
        .replace(/Steamed/gi, 'Nilagang')
        .replace(/Boiled/gi, 'Nilagang')
        .replace(/Fried/gi, 'Pritong')
        .replace(/Sautéed/gi, 'Ginisang')
        .replace(/Chicken Breast/gi, 'Dibdib ng Manok')
        .replace(/Chicken/gi, 'Manok')
        .replace(/Pork Belly/gi, 'Liempo ng Baboy')
        .replace(/Pork/gi, 'Baboy')
        .replace(/Fish/gi, 'Isda')
        .replace(/Beef/gi, 'Baka')
        .replace(/Eggs|Egg/gi, 'Itlog')
        .replace(/Rice/gi, 'Kanin')
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
      translated = translated
        .replace(/Pan-Seared/gi, 'Sinugbang')
        .replace(/Grilled/gi, 'Sinugbang')
        .replace(/Steamed/gi, 'Luto nga')
        .replace(/Boiled/gi, 'Luto nga')
        .replace(/Fried/gi, 'Pritong')
        .replace(/Sautéed/gi, 'Gisadong')
        .replace(/Chicken Breast/gi, 'Dughan sa Manok')
        .replace(/Chicken/gi, 'Manok Bisaya')
        .replace(/Pork Belly/gi, 'Liempo sa Baboy')
        .replace(/Pork/gi, 'Baboy')
        .replace(/Fish/gi, 'Isda')
        .replace(/Beef/gi, 'Baka')
        .replace(/Eggs|Egg/gi, 'Itlog')
        .replace(/Rice/gi, 'Humay')
        .replace(/Broth with/gi, 'Sabaw nga adunay')
        .replace(/Broth/gi, 'Sabaw')
        .replace(/Soup/gi, 'Sabaw')
        .replace(/with/gi, 'nga adunay')
        .replace(/In Ginger/gi, 'sa Luya')
        .replace(/Ginger/gi, 'Luya')
        .replace(/Garlic/gi, 'Ahos')
        .replace(/Sweet Potato/gi, 'Kamote')
        .replace(/Drizzle/gi, '');
    } else if (targetLang === 'English') {
      translated = translated
        .replace(/Sinugbang/gi, 'Grilled')
        .replace(/Gisadong/gi, 'Sautéed')
        .replace(/Kinilaw nga/gi, 'Ceviche')
        .replace(/Inun-unan nga/gi, 'Vinegar Braised')
        .replace(/Luto nga/gi, 'Steamed')
        .replace(/Sabaw sa/gi, 'Soup with')
        .replace(/Salada nga/gi, 'Salad with')
        .replace(/ ug /gi, ' & ')
        .replace(/ nga adunay /gi, ' with ')
        .replace(/ adunay /gi, ' with ')
        .replace(/Manok Bisaya|Manok/gi, 'Chicken')
        .replace(/Baboy/gi, 'Pork')
        .replace(/Baka/gi, 'Beef')
        .replace(/Isda/gi, 'Fish')
        .replace(/Itlog/gi, 'Eggs')
        .replace(/Kalabasa/gi, 'Squash')
        .replace(/Kamote/gi, 'Sweet Potato')
        .replace(/Mais/gi, 'Corn')
        .replace(/Humay|Bugas/gi, 'Rice')
        .replace(/Ahos/gi, 'Garlic')
        .replace(/Luya/gi, 'Ginger')
        .replace(/Presko nga/gi, 'Fresh')
        .replace(/Hilaw nga/gi, 'Raw')
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
  }, [language, dynamicCatalog]);

  // ── 6. Category Translator ─────────────────────────────────
  const translateMealCategory = useCallback((category, targetLang = language) => {
    if (!category || typeof category !== 'string') return 'Meal';
    const cleanCat = category.trim();

    if (targetLang === language && dynamicCatalog.categories && dynamicCatalog.categories[cleanCat]) {
      return dynamicCatalog.categories[cleanCat];
    }
    if (memoryCatalogCache[targetLang]?.categories?.[cleanCat]) {
      return memoryCatalogCache[targetLang].categories[cleanCat];
    }

    const fallback = CORE_FALLBACK_CATEGORIES[cleanCat];
    if (fallback && fallback[targetLang]) {
      return fallback[targetLang];
    }

    return cleanCat;
  }, [language, dynamicCatalog]);

  // ── 7. Manual Sync Trigger ─────────────────────────────────
  const syncTranslations = useCallback(() => {
    fetchRemoteTranslations(language);
  }, [fetchRemoteTranslations, language]);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      translateMealTitle,
      translateMealCategory,
      isSyncing,
      syncTranslations
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'English',
      setLanguage: () => {},
      t: (key) => key || '',
      translateMealTitle: (title) => title || '',
      translateMealCategory: (cat) => cat || '',
      isSyncing: false,
      syncTranslations: () => {}
    };
  }
  return context;
};
