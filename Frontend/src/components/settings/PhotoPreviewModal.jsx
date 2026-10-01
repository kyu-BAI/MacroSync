import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { X, Camera } from "lucide-react-native";

export default function PhotoPreviewModal({
  visible,
  onClose,
  userProfile,
  imageError,
  setImageError,
  getInitials,
  screenWidth,
  onChangePhoto,
  onRemovePhoto,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.92)",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Top Header Bar */}
        <View
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? 54 : 36,
            left: 20,
            right: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "900" }}>
            Profile Photo
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            <X color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>

        {/* Expanded Circular Photo Container */}
        <View
          style={{
            width: Math.min(screenWidth - 48, 340),
            height: Math.min(screenWidth - 48, 340),
            borderRadius: Math.min(screenWidth - 48, 340) / 2,
            overflow: "hidden",
            borderWidth: 3,
            borderColor: "#10B981",
            backgroundColor: "#1E293B",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {userProfile?.profileImage && !imageError ? (
            <Image
              source={{ uri: userProfile.profileImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#10B981",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 64,
                  fontWeight: "900",
                  letterSpacing: 2,
                }}
              >
                {getInitials(userProfile?.name)}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Quick Action Buttons inside Preview */}
        <View
          style={{
            position: "absolute",
            bottom: Platform.OS === "ios" ? 48 : 32,
            flexDirection: "row",
            gap: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              onClose();
              setTimeout(() => onChangePhoto(), 200);
            }}
            style={{
              backgroundColor: "#10B981",
              paddingHorizontal: 22,
              paddingVertical: 12,
              borderRadius: 24,
              flexDirection: "row",
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Camera color="#FFFFFF" size={16} style={{ marginRight: 8 }} />
            <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 14 }}>
              Change Photo
            </Text>
          </TouchableOpacity>

          {Boolean(userProfile?.profileImage) && !imageError && (
            <TouchableOpacity
              onPress={() => {
                onClose();
                onRemovePhoto();
              }}
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                borderWidth: 1,
                borderColor: "#EF4444",
                paddingHorizontal: 22,
                paddingVertical: 12,
                borderRadius: 24,
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{ color: "#EF4444", fontWeight: "800", fontSize: 14 }}
              >
                Remove
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
