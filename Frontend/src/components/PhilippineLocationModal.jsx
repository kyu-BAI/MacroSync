import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { X, Home, LocateFixed, Search, MapPin, Sparkles, Compass } from 'lucide-react-native';
import MapcnMap from './MapcnMap';
import {
  PHILIPPINE_REGIONS,
  POPULAR_CULINARY_HUBS,
  searchPhilippineLocations,
  PHILIPPINE_CITY_COORDINATES,
} from '../data/philippine_locations';

const { width: screenWidth } = Dimensions.get('window');
const logoGreen = '#10B981';

export default function PhilippineLocationModal({
  visible,
  onClose,
  isDarkMode,
  currentMapCenter,
  mapMarkers = [],
  selectedLocation,
  onSelectLocation,
  userHometown,
  onLocateMe,
  isLocating,
  currentCityProfile,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [activeViewMode, setActiveViewMode] = useState('EXPLORE'); // 'EXPLORE' (Search & Hubs) | 'MAP' (Interactive Map)

  // Filtered search results
  const searchResults = useMemo(() => {
    return searchPhilippineLocations(searchQuery, selectedRegion);
  }, [searchQuery, selectedRegion]);

  const handleChooseCity = (cityName) => {
    if (!cityName) return;
    onSelectLocation(cityName);
    onClose();
  };

  const handleCustomCity = () => {
    if (!searchQuery.trim()) return;
    onSelectLocation(searchQuery.trim());
    onClose();
  };

  const bgColor = isDarkMode ? '#0F172A' : '#F8FAFC';
  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
  const textMuted = isDarkMode ? '#94A3B8' : '#64748B';
  const borderColor = isDarkMode ? '#334155' : '#E2E8F0';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header Bar */}
        <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Compass size={18} color={logoGreen} style={{ marginRight: 6 }} />
              <Text style={[styles.headerTitle, { color: textColor }]}>
                Philippine Food Explorer
              </Text>
            </View>
            <Text style={[styles.headerSub, { color: textMuted }]}>
              Explore local food & palengke diets anywhere in the Philippines
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
              placeholder="Search any Philippine city, province, or food..."
              placeholderTextColor={textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={15} color={textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Region Tabs */}
          <View style={styles.regionTabRow}>
            {PHILIPPINE_REGIONS.map((reg) => {
              const isActive = selectedRegion === reg;
              return (
                <TouchableOpacity
                  key={reg}
                  onPress={() => setSelectedRegion(reg)}
                  style={[
                    styles.regionChip,
                    isActive
                      ? { backgroundColor: logoGreen, borderColor: logoGreen }
                      : { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.regionChipText,
                      isActive ? { color: '#FFFFFF', fontWeight: '800' } : { color: textMuted },
                    ]}
                  >
                    {reg}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* View Toggle: List / Map */}
          <View style={styles.viewToggleRow}>
            <TouchableOpacity
              onPress={() => setActiveViewMode('EXPLORE')}
              style={[
                styles.viewToggleBtn,
                activeViewMode === 'EXPLORE' && { backgroundColor: logoGreen },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  activeViewMode === 'EXPLORE' ? { color: '#FFFFFF' } : { color: textMuted },
                ]}
              >
                Culinary Locations ({searchResults.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveViewMode('MAP')}
              style={[
                styles.viewToggleBtn,
                activeViewMode === 'MAP' && { backgroundColor: logoGreen },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  activeViewMode === 'MAP' ? { color: '#FFFFFF' } : { color: textMuted },
                ]}
              >
                Interactive Map
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area */}
        {activeViewMode === 'MAP' ? (
          <View style={{ flex: 1 }}>
            <MapcnMap
              center={currentMapCenter}
              zoom={9}
              markers={mapMarkers}
              activeLocation={selectedLocation}
              onMarkerPress={(cityName) => handleChooseCity(cityName)}
              onSelectLocation={(cityName) => handleChooseCity(cityName)}
              cardContainer={false}
              height="100%"
              style={{ flex: 1, width: '100%' }}
            />
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              !searchQuery ? (
                <View style={{ marginBottom: 14 }}>
                  <Text style={[styles.sectionHeading, { color: textMuted }]}>
                    POPULAR PHILIPPINE CULINARY CAPITALS
                  </Text>
                  <View style={styles.hubGrid}>
                    {POPULAR_CULINARY_HUBS.map((hub) => {
                      const isSelected = selectedLocation === hub.name;
                      return (
                        <TouchableOpacity
                          key={hub.name}
                          onPress={() => handleChooseCity(hub.name)}
                          style={[
                            styles.hubCard,
                            { backgroundColor: cardBg, borderColor: isSelected ? logoGreen : borderColor },
                            isSelected && { borderWidth: 2 },
                          ]}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <MapPin size={12} color={logoGreen} style={{ marginRight: 4 }} />
                            <Text style={[styles.hubName, { color: textColor }]} numberOfLines={1}>
                              {hub.name}
                            </Text>
                          </View>
                          <Text style={styles.hubSpecialty} numberOfLines={1}>
                            {hub.specialty}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={[styles.sectionHeading, { color: textMuted, marginTop: 12 }]}>
                    ALL CITIES & MUNICIPALITIES ({searchResults.length})
                  </Text>
                </View>
              ) : null
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
                  City Not in Fast List?
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

        {/* Floating Quick Action: Locate Me & User Hometown */}
        <View style={styles.floatingActionRow}>
          {userHometown && selectedLocation !== userHometown ? (
            <TouchableOpacity
              onPress={() => handleChooseCity(userHometown)}
              activeOpacity={0.85}
              style={[styles.floatingPill, { backgroundColor: cardBg, borderColor: logoGreen }]}
            >
              <Home size={13} color={logoGreen} style={{ marginRight: 5 }} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: logoGreen }}>
                {userHometown}
              </Text>
            </TouchableOpacity>
          ) : null}

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

        {/* Bottom Active City Bar */}
        <View style={[styles.bottomBar, { backgroundColor: cardBg, borderColor: logoGreen }]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.bottomBarTitle, { color: textColor }]} numberOfLines={1}>
              {currentCityProfile?.marketTitle || selectedLocation || 'Select Location'}
            </Text>
            <Text style={styles.bottomBarSub} numberOfLines={1}>
              {currentCityProfile?.specialty || 'Goal-aligned authentic Philippine meal suggestions'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.doneBtn} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 130 },
  sectionHeading: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  hubGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  hubCard: {
    width: (screenWidth - 40) / 2,
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
