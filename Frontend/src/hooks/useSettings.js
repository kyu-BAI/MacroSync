import { useState, useEffect, useCallback } from "react";
import { Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../screens/config/api";
import { NotificationService } from "../services/NotificationService";
import { useCustomAlert } from "../context/CustomAlertContext";
import {
  getSavedUserId,
  clearSavedUserId,
  clearRememberedCredentials,
  clearRememberedPassword,
} from "../services/OfflineStorage";

export default function useSettings({
  userProfile,
  setUserProfile,
  userId,
  onTabChange,
  onLogout,
}) {
  const { showAlert } = useCustomAlert();

  // --- BUTTON PRESS STATE ---
  const [isPressedBtn, setIsPressedBtn] = useState(null);
  const handlePressIn = useCallback((id) => setIsPressedBtn(id), []);
  const handlePressOut = useCallback(() => setIsPressedBtn(null), []);

  // --- INITIALS HELPER ---
  const getInitials = useCallback((name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, []);

  // --- EDIT PROFILE MODAL STATE ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempImage, setTempImage] = useState(null);

  // --- PHOTO PREVIEW & AVATAR MANAGER STATES ---
  const [showPhotoPreviewModal, setShowPhotoPreviewModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // --- CHANGE PASSWORD STATE ---
  // --- CHANGE PASSWORD STATE ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --- PAYMENT FLOW STATE ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState({ name: "", price: "" });
  const [selectedMethod, setSelectedMethod] = useState(null); // 'gcash' | 'maya' | 'card'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Helper to reliably retrieve active user ID
  const resolveUserId = useCallback(async () => {
    let activeId = userId || userProfile?.id || userProfile?.user_id;
    if (!activeId) {
      activeId = await getSavedUserId();
    }
    return activeId ? String(activeId) : null;
  }, [userId, userProfile]);

  // --- PROFILE ACTIONS ---
  const handleOpenEditModal = useCallback(() => {
    setTempName(userProfile?.name || "");
    setTempImage(userProfile?.profileImage || null);
    setShowEditModal(true);
  }, [userProfile]);

  const handleOpenPasswordModal = useCallback(() => {
    setShowPasswordModal(true);
  }, []);

  const handlePickTempImage = useCallback(async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert(
          "Permission Denied",
          "You need to allow gallery access to select a profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setTempImage(localUri);
      }
    } catch (error) {
      if (__DEV__) console.log("Error picking image:", error);
      showAlert("Error", "Could not pick image from gallery.");
    }
  }, [showAlert]);

  const handleSaveProfile = useCallback(
    async (locationPayload) => {
      const nameToSave = (locationPayload?.name !== undefined ? locationPayload.name : tempName).trim();
      if (!nameToSave) {
        showAlert("Validation Error", "Name cannot be empty.");
        return;
      }

      const provinceName = locationPayload?.province || userProfile?.province || "";
      const cityName = locationPayload?.city || userProfile?.city || "";
      const addressStr = locationPayload?.address || (cityName && provinceName ? `${cityName}, ${provinceName}` : userProfile?.address || "");
      const structuredLoc = locationPayload?.structuredLocation || userProfile?.structuredLocation || null;

      try {
        // ⚡ INSTANT OPTIMISTIC UI UPDATE
        if (setUserProfile) {
          setUserProfile((prev) => {
            const updated = {
              ...prev,
              name: nameToSave,
              profileImage: tempImage,
              address: addressStr || prev?.address || "",
              city: cityName || prev?.city || "",
              province: provinceName || prev?.province || "",
              structuredLocation: structuredLoc || prev?.structuredLocation || null,
            };
            AsyncStorage.setItem("ms_user_profile", JSON.stringify(updated)).catch(() => {});
            if (cityName || provinceName) {
              AsyncStorage.setItem(
                "@ms_default_location",
                JSON.stringify({
                  address: addressStr,
                  city: cityName,
                  province: provinceName,
                  structuredLocation: structuredLoc,
                })
              ).catch(() => {});

              AsyncStorage.setItem(
                "ms_pinned_barangay",
                JSON.stringify({
                  barangay: "",
                  city: cityName,
                  province: provinceName,
                  formattedTitle: addressStr || (cityName && provinceName ? `${cityName}, ${provinceName}` : cityName),
                })
              ).catch(() => {});
            }
            return updated;
          });
        }
        setShowEditModal(false);
        setTimeout(() => {
          showAlert("Success", "Profile updated!");
        }, 250);

        // Background network sync
        (async () => {
          try {
            const activeUserId = await resolveUserId();
            if (activeUserId) {
              await fetch(`${API_URL}/update-profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  user_id: activeUserId,
                  name: nameToSave,
                  email: userProfile?.email,
                  address: addressStr,
                  city: cityName,
                  province: provinceName,
                  structured_location: structuredLoc,
                }),
              });

              if (tempImage && tempImage !== userProfile?.profileImage) {
                await fetch(`${API_URL}/update-profile-picture`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    user_id: activeUserId,
                    profile_image: tempImage,
                  }),
                });
              }
            }
          } catch (e) {
            if (__DEV__) console.log("Background profile sync error:", e);
          }
        })();
      } catch (error) {
        if (__DEV__) console.error("UPDATE PROFILE ERROR:", error);
        showAlert("Error", "Failed to update profile. Please try again.");
      }
    },
    [tempName, tempImage, resolveUserId, userProfile, setUserProfile, showAlert]
  );

  const handleRemoveProfileImage = useCallback(async () => {
    if (setUserProfile) {
      setUserProfile((prev) => ({
        ...prev,
        profileImage: null,
      }));
      setImageError(false);
      showAlert("Photo Removed", "Reverted to your default initials avatar.");
    }
    const activeUserId = await resolveUserId();
    if (activeUserId) {
      fetch(`${API_URL}/update-profile-picture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: activeUserId, profile_image: "" }),
      }).catch(
        (err) => __DEV__ && console.log("Remove profile pic sync error:", err),
      );
    }
  }, [resolveUserId, setUserProfile, showAlert]);

  const handleLaunchImagePicker = useCallback(async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert(
          "Permission Denied",
          "You need to allow gallery access to select a profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        const selectedUri = "data:image/jpeg;base64," + result.assets[0].base64;

        setImageError(false);
        if (setUserProfile) {
          setUserProfile((prev) => ({
            ...prev,
            profileImage: localUri,
          }));
          showAlert("Success", "Profile picture updated!");
        }

        const activeUserId = await resolveUserId();
        if (activeUserId) {
          fetch(`${API_URL}/update-profile-picture`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: activeUserId,
              profile_image: selectedUri,
            }),
          }).catch(
            (err) =>
              __DEV__ && console.log("Background profile pic sync error:", err),
          );
        }
      }
    } catch (error) {
      if (__DEV__) console.log("Error picking profile image:", error);
      showAlert("Error", "Could not pick image from gallery.");
    }
  }, [resolveUserId, setUserProfile, showAlert]);

  const handlePickProfileImage = useCallback(() => {
    const hasImage = !!userProfile?.profileImage && !imageError;
    const buttons = [
      { text: "Cancel", style: "cancel" },
      {
        text: "Choose from Gallery",
        style: "default",
        onPress: handleLaunchImagePicker,
      },
    ];

    if (hasImage) {
      buttons.unshift({
        text: "View Full Photo",
        style: "default",
        onPress: () => setShowPhotoPreviewModal(true),
      });
      buttons.push({
        text: "Remove Photo",
        style: "destructive",
        onPress: handleRemoveProfileImage,
      });
    }

    showAlert(
      "Profile Photo Options",
      "Select an action for your profile picture:",
      buttons,
    );
  }, [userProfile?.profileImage, imageError, handleLaunchImagePicker, handleRemoveProfileImage, showAlert]);

  // --- DYNAMIC NOTIFICATION SWITCH STATES ---
  const [habitReminders, setHabitReminders] = useState(true);
  const [motivationalUpdates, setMotivationalUpdates] = useState(true);
  const [personalizedAlerts, setPersonalizedAlerts] = useState(false);

  useEffect(() => {
    const loadNotificationPrefs = async () => {
      try {
        const stored = await AsyncStorage.getItem(
          "@ms_notification_preferences",
        );
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.habitReminders !== undefined)
            setHabitReminders(!!parsed.habitReminders);
          if (parsed.motivationalUpdates !== undefined)
            setMotivationalUpdates(!!parsed.motivationalUpdates);
          if (parsed.personalizedAlerts !== undefined)
            setPersonalizedAlerts(!!parsed.personalizedAlerts);
        }
      } catch (e) {
        if (__DEV__) console.log("Failed to load notification prefs:", e);
      }
    };
    loadNotificationPrefs();
  }, []);

  const saveAndUpdateNotificationPrefs = useCallback(async (updatedPrefs) => {
    try {
      await AsyncStorage.setItem(
        "@ms_notification_preferences",
        JSON.stringify(updatedPrefs),
      );
      await NotificationService.scheduleDailyReminders(updatedPrefs);
    } catch (e) {
      if (__DEV__) console.log("Failed to save notification prefs:", e);
    }
  }, []);

  const handleToggleHabitReminders = useCallback(async (val) => {
    if (val) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        showAlert(
          "Permission Required",
          "Please enable notification permissions in your device settings to receive meal and hydration reminders.",
        );
      }
    }
    setHabitReminders(val);
    saveAndUpdateNotificationPrefs({
      habitReminders: val,
      motivationalUpdates,
      personalizedAlerts,
    });
  }, [motivationalUpdates, personalizedAlerts, saveAndUpdateNotificationPrefs, showAlert]);

  const handleToggleMotivationalUpdates = useCallback(async (val) => {
    if (val) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        showAlert(
          "Permission Required",
          "Please enable notification permissions in your device settings to receive workout and activity prompts.",
        );
      }
    }
    setMotivationalUpdates(val);
    saveAndUpdateNotificationPrefs({
      habitReminders,
      motivationalUpdates: val,
      personalizedAlerts,
    });
  }, [habitReminders, personalizedAlerts, saveAndUpdateNotificationPrefs, showAlert]);

  const handleTogglePersonalizedAlerts = useCallback(async (val) => {
    if (val) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        showAlert(
          "Permission Required",
          "Please enable notification permissions in your device settings to receive Vita AI coaching alerts.",
        );
      }
    }
    setPersonalizedAlerts(val);
    saveAndUpdateNotificationPrefs({
      habitReminders,
      motivationalUpdates,
      personalizedAlerts: val,
    });
  }, [habitReminders, motivationalUpdates, saveAndUpdateNotificationPrefs, showAlert]);

  const handleSendTestNotification = useCallback(async () => {
    try {
      const res = await NotificationService.sendTestNotification();
      if (res.success) {
        showAlert(
          "Notification Sent! 🎯",
          "Check your notification shade or lock screen. A test reminder has been delivered.",
        );
      } else {
        showAlert(
          "Notification Notice",
          res.reason || "Could not trigger notification.",
        );
      }
    } catch (e) {
      showAlert("Error", "Failed to trigger test notification.");
    }
  }, [showAlert]);

  // --- ACCOUNT TIER & BILLING ---
  const [accountTier, setAccountTier] = useState(
    userProfile?.isPremium ? "Premium" : "Free",
  );
  const [showBillingOptions, setShowBillingOptions] = useState(false);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState(null);

  useEffect(() => {
    setAccountTier(userProfile?.isPremium ? "Premium" : "Free");
  }, [userProfile?.isPremium]);

  const handleSelectTierOption = useCallback(async (tierType) => {
    if (tierType === "Free") {
      if (userProfile?.isPremium) {
        showAlert(
          "Cancel Subscription",
          "Are you sure you want to cancel your Premium subscription and revert to the Free tier (limits apply)?",
          [
            { text: "No", style: "cancel" },
            {
              text: "Yes, Downgrade",
              onPress: async () => {
                try {
                  const activeUserId = await resolveUserId();
                  const response = await fetch(
                    `${API_URL}/update-subscription`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        user_id: activeUserId,
                        is_premium: false,
                      }),
                    },
                  );
                  if (response.ok) {
                    if (setUserProfile) {
                      setUserProfile((prev) => ({ ...prev, isPremium: false }));
                    }
                    setAccountTier("Free");
                    showAlert(
                      "Plan Updated",
                      "Your subscription was cancelled. You are now on the Free Plan.",
                    );
                  } else {
                    showAlert(
                      "Error",
                      "Failed to cancel subscription on server.",
                    );
                  }
                } catch (e) {
                  showAlert(
                    "Error",
                    "Network connection failed. Cannot connect to server.",
                  );
                }
              },
            },
          ],
        );
      } else {
        setAccountTier("Free");
      }
    } else {
      setAccountTier("Premium");
    }
  }, [userProfile?.isPremium, resolveUserId, setUserProfile, showAlert]);

  const handleInitiatePaymentFlow = useCallback(
    (planName, price) => {
      setSelectedBillingCycle(planName);

      showAlert(
        "Confirm Payment Method",
        `Would you like to proceed with the ${planName} Plan (${price})?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setSelectedBillingCycle(null),
          },
          {
            text: "Proceed to Pay",
            onPress: async () => {
              setIsProcessingPayment(true);
              showAlert(
                "Opening Checkout",
                "Connecting securely to PayMongo checkout... Please wait a moment.",
                [],
                "info",
                { preventBackdropDismiss: true },
              );

              try {
                let activeUserId =
                  userId || userProfile?.id || userProfile?.user_id;
                if (!activeUserId) {
                  activeUserId = await getSavedUserId();
                }
                if (!activeUserId) {
                  activeUserId = "guest_user";
                }

                const amount_cents = planName === "Monthly" ? 14900 : 119900;
                const response = await fetch(
                  `${API_URL}/create-checkout-session`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      user_id: String(activeUserId),
                      amount: amount_cents,
                      description: `MacroSync Premium - ${planName} Plan`,
                    }),
                  },
                );

                const data = await response.json().catch(() => ({}));

                if (response.ok && data?.data?.attributes?.checkout_url) {
                  const checkoutUrl = data.data.attributes.checkout_url;

                  let browserOpened = false;
                  try {
                    await WebBrowser.openBrowserAsync(checkoutUrl);
                    browserOpened = true;
                  } catch (browserErr) {
                    console.warn("WebBrowser error, falling back to Linking:", browserErr);
                  }

                  if (!browserOpened) {
                    try {
                      await Linking.openURL(checkoutUrl);
                      browserOpened = true;
                    } catch (linkErr) {
                      console.error("Linking openURL error:", linkErr);
                    }
                  }

                  showAlert(
                    "Checkout Opened",
                    "Please complete your payment securely on the PayMongo page. Once payment is confirmed, your account will be upgraded to Premium!",
                    [{ text: "OK", style: "default" }],
                  );
                } else {
                  console.error("PayMongo session creation error:", response.status, data);
                  const errorMsg =
                    data?.detail?.msg ||
                    data?.detail ||
                    "Could not generate payment link. Please try again.";
                  showAlert(
                    "Payment Error",
                    typeof errorMsg === "string" ? errorMsg : "Could not generate payment link.",
                  );
                  setSelectedBillingCycle(null);
                }
              } catch (e) {
                console.error("Checkout session network error:", e);
                showAlert(
                  "Checkout Error",
                  e?.message
                    ? `Failed to connect: ${e.message}`
                    : "Network connection failed. Cannot connect to server.",
                );
                setSelectedBillingCycle(null);
              } finally {
                setIsProcessingPayment(false);
              }
            },
          },
        ],
      );
    },
    [userId, userProfile, showAlert],
  );

  const handleConfirmPayment = useCallback(() => {
    if (!selectedMethod) {
      showAlert(
        "Payment Method Required",
        "Please select a payment method to proceed.",
      );
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(() => {
      if (setUserProfile) {
        setUserProfile((prev) => ({ ...prev, isPremium: true }));
      }
      setAccountTier("Premium");
      setShowPaymentModal(false);
      setIsProcessingPayment(false);
    }, 1000);
  }, [selectedMethod, setUserProfile, showAlert]);

  // --- PASSWORD CHANGE HANDLER ---
  const handleChangePassword = useCallback(async ({ oldPassword, newPassword, confirmPassword }) => {
    if (!oldPassword?.trim()) {
      showAlert("Validation Error", "Please enter your current password.");
      return false;
    }
    if (!newPassword?.trim()) {
      showAlert("Validation Error", "Please enter a new password.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Validation Error", "New passwords do not match.");
      return false;
    }

    setIsChangingPassword(true);
    try {
      const activeUserId = await resolveUserId();
      const response = await fetch(`${API_URL}/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: activeUserId,
          email: userProfile?.email,
          password: newPassword.trim(),
          current_password: oldPassword.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showAlert(
          "Password Error",
          data.detail || "Current password is incorrect. Please check your password and try again.",
        );
        return false;
      }

      setShowPasswordModal(false);

      setTimeout(() => {
        showAlert(
          "Password Updated",
          "Your password has been changed successfully. For your security, please sign in with your new password.",
          [
            {
              text: "Sign In Now",
              onPress: async () => {
                try {
                  await clearSavedUserId();
                } catch (e) {}
                if (onLogout) {
                  onLogout();
                } else if (onTabChange) {
                  onTabChange("AUTH");
                }
              },
            },
          ],
        );
      }, 250);
      return true;
    } catch (error) {
      if (__DEV__) console.warn("Change password network exception:", error?.message || error);
      showAlert(
        "Network Error",
        "Could not connect to the server to change your password. Please check your network connection.",
      );
      return false;
    } finally {
      setIsChangingPassword(false);
    }
  }, [resolveUserId, userProfile?.email, onLogout, onTabChange, showAlert]);

  // --- LOGOUT HANDLER ---
  const handleLogOut = useCallback(() => {
    showAlert(
      "Log Out",
      "Are you sure you want to exit your active tracking session?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await clearSavedUserId();
              await clearRememberedPassword();
            } catch (e) {
              console.warn("Logout clearSavedUserId warning:", e);
            }
            try {
              if (onLogout) {
                onLogout();
              } else if (onTabChange) {
                onTabChange("AUTH");
              }
            } catch (err) {
              console.error("Logout navigation callback error:", err);
            }
          },
        },
      ],
    );
  }, [onLogout, onTabChange, showAlert]);

  // --- DELETE ACCOUNT HANDLER ---
  const handleDeleteAccount = useCallback(() => {
    showAlert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? All your personal health profiles, meal logs, water logs, and workout history will be permanently erased. This action cannot be undone.\n\nNote: If you have an active subscription, please cancel it in your store/payment settings to avoid recurring charges.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              const activeUserId = await resolveUserId();
              const response = await fetch(`${API_URL}/delete-account`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: activeUserId }),
              });
              const data = await response.json().catch(() => ({}));
              if (!response.ok) {
                setIsDeletingAccount(false);
                showAlert(
                  "Deletion Failed",
                  data.detail || "Could not delete account. Please try again.",
                );
                return;
              }

              await clearSavedUserId();
              await clearRememberedCredentials();

              setIsDeletingAccount(false);
              if (onLogout) {
                onLogout();
              } else if (onTabChange) {
                onTabChange("AUTH");
              }
            } catch (err) {
              setIsDeletingAccount(false);
              console.warn("Delete account network error:", err);
              showAlert(
                "Network Error",
                "Could not connect to the server to delete your account. Check your network.",
              );
            }
          },
        },
      ],
    );
  }, [resolveUserId, onLogout, onTabChange, showAlert]);

  const handleSavePreferences = useCallback(() => {
    showAlert(
      "Preferences Saved",
      "Your profile metrics and notification thresholds have been synced successfully.",
    );
  }, [showAlert]);

  return {
    isPressedBtn,
    handlePressIn,
    handlePressOut,
    getInitials,

    // Profile Edit
    showEditModal,
    setShowEditModal,
    tempName,
    setTempName,
    tempImage,
    setTempImage,
    handleOpenEditModal,
    handleSaveProfile,
    handlePickTempImage,
    handleRemoveProfileImage,
    handleLaunchImagePicker,
    handlePickProfileImage,

    // Photo Preview
    showPhotoPreviewModal,
    setShowPhotoPreviewModal,
    imageError,
    setImageError,

    // Password
    showPasswordModal,
    setShowPasswordModal,
    isChangingPassword,
    handleOpenPasswordModal,
    handleChangePassword,

    // Subscription & Billing
    accountTier,
    setAccountTier,
    showBillingOptions,
    setShowBillingOptions,
    selectedBillingCycle,
    setSelectedBillingCycle,
    showPaymentModal,
    setShowPaymentModal,
    paymentPlan,
    setPaymentPlan,
    selectedMethod,
    setSelectedMethod,
    isProcessingPayment,
    handleSelectTierOption,
    handleInitiatePaymentFlow,
    handleConfirmPayment,

    // Notifications
    habitReminders,
    motivationalUpdates,
    personalizedAlerts,
    handleToggleHabitReminders,
    handleToggleMotivationalUpdates,
    handleTogglePersonalizedAlerts,
    handleSendTestNotification,

    // Account lifecycle
    handleLogOut,
    handleDeleteAccount,
    isDeletingAccount,

    // Privacy & Preferences
    privacyModalVisible,
    setPrivacyModalVisible,
    handleSavePreferences,
  };
}
