import { useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCustomAlert } from "../context/CustomAlertContext";
import {
  PHILIPPINE_PROVINCES,
  getCitiesForProvince,
} from "../data/philippine_cities_by_province";

// Height per picker item row in dropdown lists
export const ITEM_HEIGHT = 54;

export default function useStepThreeLocation({ onNext, initialLocation }) {
  const { showAlert } = useCustomAlert();

  // Location Selector States
  const [province, setProvince] = useState(
    initialLocation?.province
      ? { name: initialLocation.province, province_name: initialLocation.province }
      : null
  );
  const [city, setCity] = useState(
    initialLocation?.city
      ? { name: initialLocation.city, city_name: initialLocation.city }
      : null
  );

  // Location Picker Dropdown Modal States
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState("");
  const [pickerData, setPickerData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Instant in-memory picker opener (0ms, zero network delay)
  const openPicker = useCallback(
    (type) => {
      if (type === "province") {
        setPickerData(PHILIPPINE_PROVINCES);
        setSearchQuery("");
        setPickerType("province");
        setPickerVisible(true);
      } else if (type === "city") {
        if (!province) {
          showAlert("Sequence Interrupted", "Please select a Province first.");
          return;
        }
        const cities = getCitiesForProvince(province.name);
        setPickerData(cities);
        setSearchQuery("");
        setPickerType("city");
        setPickerVisible(true);
      }
    },
    [province, showAlert]
  );

  const handleClosePicker = useCallback(() => {
    setPickerVisible(false);
    setSearchQuery("");
  }, []);

  const handleSearchQueryChange = useCallback((text) => {
    setSearchQuery(text);
  }, []);

  const handleSelectLocation = useCallback(
    (item) => {
      if (pickerType === "province") {
        setProvince(item);
        setCity(null);
      } else if (pickerType === "city") {
        setCity(item);
      }
      setPickerVisible(false);
      setSearchQuery("");
    },
    [pickerType]
  );

  // Filtered picker items according to search query
  const filteredPickerData = useMemo(() => {
    if (!searchQuery.trim()) return pickerData;
    const lower = searchQuery.toLowerCase();
    return pickerData.filter((item) =>
      item.name ? item.name.toLowerCase().includes(lower) : false
    );
  }, [pickerData, searchQuery]);

  // Validation & transition to Step 4
  const handleContinue = useCallback(() => {
    if (!province) {
      showAlert("Province Required", "Please select your Province to calibrate local food availability.");
      return;
    }
    if (!city) {
      showAlert("City Required", "Please select your City or Municipality.");
      return;
    }

    const address = `${city.name}, ${province.name}`;
    const locationData = {
      address,
      structuredLocation: {
        province: province.name,
        city: city.name,
      },
      city: city.name,
      province: province.name,
    };

    try {
      AsyncStorage.setItem("@ms_default_location", JSON.stringify(locationData));
    } catch (_) {}

    onNext?.(locationData);
  }, [province, city, showAlert, onNext]);

  return {
    province,
    city,
    pickerVisible,
    pickerType,
    filteredPickerData,
    searchQuery,
    openPicker,
    handleClosePicker,
    handleSearchQueryChange,
    handleSelectLocation,
    handleContinue,
  };
}
