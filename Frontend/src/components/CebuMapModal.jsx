import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X, Home, LocateFixed } from 'lucide-react-native';
import MapcnMap from './MapcnMap';

export default function CebuMapModal({
  visible,
  onClose,
  isDarkMode,
  currentMapCenter,
  mapMarkers,
  selectedLocation,
  locations,
  onSelectLocation,
  userHometown,
  onLocateMe,
  isLocating,
  currentCityProfile,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' }}>
        {/* Header Bar */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingHorizontal: 20,
            paddingBottom: 16,
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0',
            zIndex: 10,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '900',
                color: isDarkMode ? '#F8FAFC' : '#0F172A',
              }}
            >
              Full Cebu Island Food Map
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: '#64748B',
                fontWeight: '600',
                marginTop: 2,
              }}
            >
              Tap any municipality or marker to see borders & food (
              {locations ? locations.length : 53} LGUs)
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: 8,
              backgroundColor: isDarkMode ? '#334155' : '#F1F5F9',
              borderRadius: 20,
            }}
          >
            <X color={isDarkMode ? '#F8FAFC' : '#0F172A'} size={20} />
          </TouchableOpacity>
        </View>

        {/* Fullscreen mapcn Modern Map with Boundary Polygons */}
        <View style={{ flex: 1 }}>
          <MapcnMap
            center={currentMapCenter}
            zoom={9}
            markers={mapMarkers}
            activeLocation={selectedLocation}
            onMarkerPress={(cityName) => {
              if (cityName && (!locations || locations.includes(cityName))) {
                onSelectLocation(cityName);
              }
            }}
            onSelectLocation={(cityName) => {
              if (cityName && (!locations || locations.includes(cityName))) {
                onSelectLocation(cityName);
              }
            }}
            cardContainer={false}
            height="100%"
            style={{ flex: 1, width: '100%' }}
          />
        </View>

        {/* Floating Action Buttons Overlay (Locate Me & My Town) */}
        <View
          style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 125 : 105,
            right: 20,
            flexDirection: 'row',
            gap: 8,
            zIndex: 100,
          }}
        >
          {userHometown && selectedLocation !== userHometown ? (
            <TouchableOpacity
              onPress={() => onSelectLocation(userHometown)}
              activeOpacity={0.85}
              style={{
                backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                borderRadius: 50,
                paddingVertical: 10,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 8,
                borderWidth: 1.5,
                borderColor: '#10B981',
              }}
            >
              <Home size={13} color="#10B981" style={{ marginRight: 5 }} />
              <Text
                style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}
              >
                {userHometown}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={onLocateMe}
            activeOpacity={0.85}
            style={{
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              borderRadius: 50,
              paddingVertical: 10,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 8,
              borderWidth: 1.5,
              borderColor: '#10B981',
            }}
          >
            {isLocating ? (
              <ActivityIndicator
                size="small"
                color="#10B981"
                style={{ marginRight: 6 }}
              />
            ) : (
              <LocateFixed
                size={14}
                color="#10B981"
                style={{ marginRight: 6 }}
              />
            )}
            <Text
              style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}
            >
              {isLocating ? 'Locating...' : 'Locate Me'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Floating City Bar */}
        <View
          style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 36 : 20,
            left: 20,
            right: 20,
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderRadius: 20,
            padding: 16,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            borderWidth: 1.5,
            borderColor: '#10B981',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '900',
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                }}
                numberOfLines={1}
              >
                {currentCityProfile?.marketTitle || selectedLocation}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#10B981',
                  fontWeight: '700',
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {currentCityProfile?.specialty}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: '#10B981',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 14,
              }}
            >
              <Text
                style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
