import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Pencil } from "lucide-react-native";

export default function EditProfileModal({
  visible,
  onClose,
  tempName,
  setTempName,
  tempImage,
  userProfile,
  getInitials,
  onPickImage,
  onSave,
  styles,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <Text style={styles.modalSubtitle}>Update your personal details</Text>

          <TouchableOpacity
            onPress={onPickImage}
            activeOpacity={0.8}
            style={[
              styles.avatarNeuOuterBox,
              { alignSelf: "center", marginBottom: 20 },
            ]}
          >
            {tempImage ? (
              <Image
                source={{ uri: tempImage }}
                style={styles.avatarImageLarge}
              />
            ) : (
              <View
                style={[
                  styles.avatarImageLarge,
                  {
                    backgroundColor: "#10B981",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 26,
                    fontWeight: "900",
                    letterSpacing: 1,
                  }}
                >
                  {getInitials(tempName || userProfile?.name)}
                </Text>
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              <Pencil color="#FFFFFF" size={12} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.modalInput}
            value={tempName}
            onChangeText={setTempName}
            placeholder="Username"
            placeholderTextColor="#CBD5E1"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSave} onPress={onSave}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
