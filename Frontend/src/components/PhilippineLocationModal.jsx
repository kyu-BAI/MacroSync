import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { X, LocateFixed, Search, MapPin, Sparkles, Compass, CheckCircle2, ChevronRight } from 'lucide-react-native';
import MapcnMap from './MapcnMap';
import {
  PHILIPPINE_REGIONS,
  searchPhilippineLocations,
  PHILIPPINE_CITY_COORDINATES,
  normalizeToPhilippineLocation,
} from '../data/philippine_locations';
import { normalizeToCebuLGU } from '../data/cebuPalengkeMeals';
import { CEBU_CITY_COORDINATES } from '../data/cebu_locations';
import {
  reverseGeocodeToBarangay,
  searchPhilippineBarangays,
  POPULAR_BARANGAYS_BY_CITY,
  POPULAR_BARANGAY_COORDINATES,
  getBarangayMarkersForCity,
} from '../services/barangayGeocodingService';

const logoGreen = '#10B981';

export default function PhilippineLocationModal({
  visible,
  onClose,
  isDarkMode,
  currentMapCenter,
  mapMarkers = [],
  selectedLocation,
  onSelectLocation,
  pinnedBarangay = null,
  onPinBarangay,
  userHometown,
  onLocateMe,
  isLocating,
  currentCityProfile,
  initialViewMode = 'EXPLORE',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [activeViewMode, setActiveViewMode] = useState(initialViewMode);
  const [localPinnedBarangay, setLocalPinnedBarangay] = useState(pinnedBarangay);
  const [localSelectedCity, setLocalSelectedCity] = useState(selectedLocation);
  const [isResolvingBarangay, setIsResolvingBarangay] = useState(false);
  const [barangaySearchResults, setBarangaySearchResults] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (visible && initialViewMode) {
      setActiveViewMode(initialViewMode);
    }
  }, [visible, initialViewMode]);

  useEffect(() => {
    if (selectedLocation) {
      setLocalSelectedCity(selectedLocation);
    }
  }, [selectedLocation]);

  // Sync incoming pinnedBarangay prop
  useEffect(() => {
    if (pinnedBarangay) {
      setLocalPinnedBarangay(pinnedBarangay);
    }
  }, [pinnedBarangay]);

  // City-level search results
  const searchResults = useMemo(() => {
    return searchPhilippineLocations(searchQuery, 'All');
  }, [searchQuery]);

  // Instant barangay search when query >= 2 characters
  useEffect(() => {
    let isMounted = true;
    if (!searchQuery || searchQuery.trim().length < 2) {
      setBarangaySearchResults([]);
      return;
    }

    const cleanQ = searchQuery.trim();
    searchPhilippineBarangays(cleanQ)
      .then((results) => {
        if (isMounted) {
          setBarangaySearchResults(results || []);
        }
      })
      .catch(() => {
        if (isMounted) setBarangaySearchResults([]);
      });

    return () => {
      isMounted = false;
    };
  }, [searchQuery]);

  // Popular barangays for currently selected city
  const quickBarangays = useMemo(() => {
    const curLoc = localSelectedCity || selectedLocation;
    if (!curLoc) return [];
    return (
      POPULAR_BARANGAYS_BY_CITY[curLoc] ||
      POPULAR_BARANGAYS_BY_CITY[`${curLoc} City`] ||
      []
    );
  }, [localSelectedCity, selectedLocation]);

  // Dynamic barangay markers for the selected city with exact red dots
  const barangayMarkers = useMemo(() => {
    return getBarangayMarkersForCity(localSelectedCity || selectedLocation);
  }, [localSelectedCity, selectedLocation]);

  const combinedMarkers = useMemo(() => {
    return [...mapMarkers, ...barangayMarkers];
  }, [mapMarkers, barangayMarkers]);

  // Handle choosing a city
  const handleChooseCity = (cityName) => {
    if (!cityName) return;
    setLocalPinnedBarangay(null);
    onPinBarangay?.(null);
    setLocalSelectedCity(cityName);
    onSelectLocation(cityName);
    setSearchQuery('');
    setActiveViewMode('MAP');
  };

  // Handle pinning exact barangay from map tap
  const handleMapPin = useCallback(
    async ({ lat, lng }) => {
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      setIsResolvingBarangay(true);
      setStatusMessage('Resolving exact Barangay...');

      try {
        const resolved = await reverseGeocodeToBarangay(lat, lng);
        if (resolved) {
          setLocalPinnedBarangay(resolved);
          setStatusMessage(`Pinned: ${resolved.formattedTitle}`);

          if (onPinBarangay) {
            onPinBarangay(resolved);
          }

          if (resolved.city) {
            const normalized =
              normalizeToPhilippineLocation(resolved.city) ||
              normalizeToCebuLGU(resolved.city) ||
              resolved.city;
            onSelectLocation(normalized);
          }
        }
      } catch (err) {
        if (__DEV__) console.warn('[PhilippineLocationModal] Pin error:', err);
        setStatusMessage('Pin placed on Barangay');
      } finally {
        setIsResolvingBarangay(false);
      }
    },
    [onPinBarangay, onSelectLocation]
  );

  // Handle selecting a barangay from list or quick chip
  const handleSelectBarangayItem = (item) => {
    const barangayData = {
      barangay: item.barangay || item.name.replace(/^Brgy\.\s*/i, ''),
      city: item.city || selectedLocation || 'Philippines',
      province: item.province || '',
      formattedTitle: item.display || `Brgy. ${item.barangay}, ${item.city}`,
      lat: item.lat,
      lng: item.lng,
    };

    setLocalPinnedBarangay(barangayData);
    if (onPinBarangay) {
      onPinBarangay(barangayData);
    }

    if (item.city) {
      const normalized =
        normalizeToPhilippineLocation(item.city) ||
        normalizeToCebuLGU(item.city) ||
        item.city;
      onSelectLocation(normalized);
    }

    // Switch to map view to visually confirm the pinned location
    setActiveViewMode('MAP');
    setStatusMessage(`Pinned: ${barangayData.formattedTitle}`);
  };

  // Quick chip select
  const handleQuickChipSelect = (brgyName) => {
    const key = brgyName.toLowerCase().trim();
    const match = POPULAR_BARANGAY_COORDINATES[key];

    if (match) {
      handleSelectBarangayItem({
        barangay: match.barangay,
        city: match.city,
        province: match.province,
        display: `Brgy. ${match.barangay}, ${match.city}`,
        lat: match.lat,
        lng: match.lng,
      });
    } else {
      // Search coordinate asynchronously
      setIsResolvingBarangay(true);
      searchPhilippineBarangays(`${brgyName}, ${selectedLocation}`)
        .then((res) => {
          if (res && res[0]) {
            handleSelectBarangayItem(res[0]);
          }
        })
        .finally(() => setIsResolvingBarangay(false));
    }
  };

  const handleCustomCity = () => {
    const customName = searchQuery.trim();
    if (!customName) return;
    setLocalPinnedBarangay(null);
    onPinBarangay?.(null);
    setLocalSelectedCity(customName);
    onSelectLocation(customName);
    setSearchQuery('');
    setActiveViewMode('MAP');
  };

  const handleConfirmAndClose = () => {
    if (localPinnedBarangay && onPinBarangay) {
      onPinBarangay(localPinnedBarangay);
    }
    onClose();
  };

  const bgColor = isDarkMode ? '#0F172A' : '#F8FAFC';
  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
  const textMuted = isDarkMode ? '#94A3B8' : '#64748B';
  const borderColor = isDarkMode ? '#334155' : '#E2E8F0';

  // Compute map center coordinate
  const effectiveMapCenter = useMemo(() => {
    if (localPinnedBarangay && localPinnedBarangay.lat && localPinnedBarangay.lng) {
      return [localPinnedBarangay.lng, localPinnedBarangay.lat];
    }
    const currentLoc = localSelectedCity || selectedLocation;
    const coords = PHILIPPINE_CITY_COORDINATES[currentLoc] || CEBU_CITY_COORDINATES[currentLoc];
    if (coords && coords.lng && coords.lat) {
      return [coords.lng, coords.lat];
    }
    return currentMapCenter;
  }, [localPinnedBarangay, localSelectedCity, selectedLocation, currentMapCenter]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: bgColor, alignItems: 'center' }}>
        <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header Bar */}
        <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Compass size={18} color={logoGreen} style={{ marginRight: 6 }} />
              <Text style={[styles.headerTitle, { color: textColor }]}>
                Philippine Barangay & City Explorer
              </Text>
            </View>
            <Text style={[styles.headerSub, { color: textMuted }]}>
              Pin your exact Barangay or search any location in the Philippines
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
            activeOpacity={0.8}
          >
            <X color={textColor} size={20} />
          </TouchableOpacity>
        </View>

        {/* Search Bar Input */}
        <View style={[styles.searchContainer, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
          <View style={[styles.searchInputRow, { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9', borderColor }]}>
            <Search size={16} color={textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.textInput, { color: textColor }]}
              placeholder="Search exact City or Municipality..."
              placeholderTextColor={textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (searchResults.length > 0) {
                  handleChooseCity(searchResults[0].name);
                } else if (searchQuery.trim()) {
                  handleCustomCity();
                }
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={15} color={textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content Area: Map view is shown only when in MAP mode AND no search query is typed */}
        {activeViewMode === 'MAP' && !searchQuery.trim() ? (
          <View style={{ flex: 1 }}>
            {/* Interactive Map */}
            <View style={{ flex: 1 }}>
              <MapcnMap
                center={effectiveMapCenter}
                zoom={9}
                markers={[]}
                activeLocation={localSelectedCity || selectedLocation}
                pinnedBarangay={null}
                showPin={true}
                onPinBarangay={handleMapPin}
                onMarkerPress={(cityName) => handleChooseCity(cityName)}
                onSelectLocation={(cityName) => handleChooseCity(cityName)}
                cardContainer={false}
                height="100%"
                style={{ flex: 1, width: '100%' }}
              />
            </View>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.name}
            contentContainerStyle={[styles.listContent, { paddingBottom: searchQuery.trim() ? 40 : 100 }]}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View>
                {!searchQuery.trim() ? (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[styles.sectionHeading, { color: textMuted }]}>
                      ALL CITIES & MUNICIPALITIES ({searchResults.length})
                    </Text>
                  </View>
                ) : (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={[styles.sectionHeading, { color: textMuted }]}>
                      MATCHING LOCATIONS ({searchResults.length})
                    </Text>
                  </View>
                )}
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedLocation === item.name;
              return (
                <TouchableOpacity
                  onPress={() => handleChooseCity(item.name)}
                  style={[
                    styles.cityItemRow,
                    { backgroundColor: cardBg, borderColor: isSelected ? logoGreen : borderColor },
                    isSelected && { borderWidth: 1.5 },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.pinIconBox, { backgroundColor: `${logoGreen}15` }]}>
                    <MapPin size={16} color={logoGreen} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.cityNameText, { color: textColor }]}>{item.name}</Text>
                      {item.region && (
                        <View style={[styles.regionBadge, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                          <Text style={[styles.regionBadgeText, { color: textMuted }]}>{item.region}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.citySpecialtyText} numberOfLines={1}>
                      {item.specialty || `${item.province || 'Philippines'} Palengke`}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.selectedPill}>
                      <Text style={styles.selectedPillText}>Selected</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Sparkles size={36} color={logoGreen} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: textColor }]}>
                  Location Not in Fast List?
                </Text>
                <Text style={[styles.emptySubtitle, { color: textMuted }]}>
                  We can generate authentic palengke food data for "{searchQuery}" anywhere in the Philippines!
                </Text>
                <TouchableOpacity
                  onPress={handleCustomCity}
                  style={styles.exploreCustomBtn}
                  activeOpacity={0.85}
                >
                  <Sparkles size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.exploreCustomBtnText}>
                    Explore "{searchQuery}" with AI Palengke Radar
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        {/* Floating Quick Action: Locate Me (only visible on map when not searching) */}
        {onLocateMe && !searchQuery.trim() && activeViewMode === 'MAP' ? (
          <View style={styles.floatingActionRow}>
            <TouchableOpacity
              onPress={onLocateMe}
              activeOpacity={0.85}
              style={[styles.floatingPill, { backgroundColor: cardBg, borderColor: logoGreen }]}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={logoGreen} style={{ marginRight: 6 }} />
              ) : (
                <LocateFixed size={14} color={logoGreen} style={{ marginRight: 6 }} />
              )}
              <Text style={{ fontSize: 12, fontWeight: '800', color: logoGreen }}>
                {isLocating ? 'Locating...' : 'Locate Me (GPS)'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Bottom Active Location / Pinned Barangay Bar */}
        {!searchQuery.trim() && (
          <View style={[styles.bottomBar, { backgroundColor: cardBg, borderColor: logoGreen }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MapPin size={13} color={logoGreen} style={{ marginRight: 5 }} />
                <Text style={[styles.bottomBarTitle, { color: textColor }]} numberOfLines={1}>
                  {localPinnedBarangay?.formattedTitle || currentCityProfile?.marketTitle || localSelectedCity || selectedLocation || 'Select Location'}
                </Text>
              </View>
              <Text style={styles.bottomBarSub} numberOfLines={1}>
                {localPinnedBarangay
                  ? `Exact Barangay: Brgy. ${localPinnedBarangay.barangay || localPinnedBarangay.name}, ${localPinnedBarangay.city}`
                  : (currentCityProfile?.specialty || 'Goal-aligned authentic Philippine meal suggestions')}
              </Text>
            </View>
            <TouchableOpacity onPress={handleConfirmAndClose} style={styles.doneBtn} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </View>
  </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 38,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  closeBtn: { padding: 8, borderRadius: 20 },
  searchContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1 },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
  },
  textInput: { flex: 1, fontSize: 13, fontWeight: '600' },
  regionTabRow: { flexDirection: 'row', gap: 6, marginTop: 10, overflow: 'scroll' },
  regionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  regionChipText: { fontSize: 11, fontWeight: '700' },
  viewToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 12,
    padding: 3,
    marginTop: 10,
  },
  viewToggleBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 9 },
  viewToggleText: { fontSize: 11, fontWeight: '800' },
  quickBarangayToolbar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  quickBarangayLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  barangayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 6,
  },
  barangayChipText: {
    fontSize: 11,
  },
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 130 },
  sectionHeading: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  barangayItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  barangayTitle: { fontSize: 13, fontWeight: '800' },
  barangayBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6 },
  barangayBadgeText: { fontSize: 9, fontWeight: '800' },
  barangayCitySub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  pinActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: logoGreen,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pinActionBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  hubGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  hubCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  hubName: { fontSize: 12, fontWeight: '800' },
  hubSpecialty: { fontSize: 10, color: logoGreen, fontWeight: '700', marginTop: 2 },
  cityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  pinIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cityNameText: { fontSize: 13, fontWeight: '800' },
  regionBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6 },
  regionBadgeText: { fontSize: 9, fontWeight: '800' },
  citySpecialtyText: { fontSize: 11, color: logoGreen, fontWeight: '700', marginTop: 2 },
  selectedPill: { backgroundColor: logoGreen, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  selectedPillText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  emptyContainer: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '900', marginBottom: 6 },
  emptySubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  exploreCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: logoGreen,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  exploreCustomBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  floatingActionRow: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100,
    right: 20,
    flexDirection: 'row',
    gap: 8,
    zIndex: 100,
  },
  floatingPill: {
    borderRadius: 50,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1.5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    maxWidth: 648,
    marginHorizontal: 'auto',
    borderRadius: 18,
    padding: 14,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBarTitle: { fontSize: 14, fontWeight: '900' },
  bottomBarSub: { fontSize: 11, color: logoGreen, fontWeight: '700', marginTop: 2 },
  doneBtn: { backgroundColor: logoGreen, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  doneBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
});
