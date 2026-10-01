import { useState, useCallback, useMemo } from "react";
import { Award, Droplets, Utensils, Activity, Bell } from "lucide-react-native";

export default function useNotifications({
  notifications: propNotifications,
  setNotifications: propSetNotifications,
  showAlert,
  isDarkMode = false,
}) {
  const [localNotifications, setLocalNotifications] = useState([]);

  const activeNotifications = propNotifications || localNotifications;
  const activeSetNotifications = propSetNotifications || setLocalNotifications;

  const unreadCount = useMemo(
    () => activeNotifications.filter((n) => !n.read).length,
    [activeNotifications]
  );

  const hasAny = activeNotifications.length > 0;

  const getCategoryStyles = useCallback(
    (category) => {
      switch (category) {
        case "achievement":
          return {
            icon: Award,
            color: "#F59E0B",
            bgColor: isDarkMode
              ? "rgba(245, 158, 11, 0.18)"
              : "rgba(245, 158, 11, 0.12)",
          };
        case "hydration":
          return {
            icon: Droplets,
            color: "#0EA5E9",
            bgColor: isDarkMode
              ? "rgba(14, 165, 233, 0.18)"
              : "rgba(14, 165, 233, 0.12)",
          };
        case "meal":
          return {
            icon: Utensils,
            color: "#10B981",
            bgColor: isDarkMode
              ? "rgba(16, 185, 129, 0.18)"
              : "rgba(16, 185, 129, 0.12)",
          };
        case "workout":
          return {
            icon: Activity,
            color: "#F97316",
            bgColor: isDarkMode
              ? "rgba(249, 115, 22, 0.18)"
              : "rgba(249, 115, 22, 0.12)",
          };
        default:
          return {
            icon: Bell,
            color: "#8B5CF6",
            bgColor: isDarkMode
              ? "rgba(139, 92, 246, 0.18)"
              : "rgba(139, 92, 246, 0.12)",
          };
      }
    },
    [isDarkMode]
  );

  const markAllAsRead = useCallback(() => {
    activeSetNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  }, [activeSetNotifications]);

  const clearAllNotifications = useCallback(() => {
    if (showAlert) {
      showAlert(
        "Clear All Notifications",
        "This will permanently remove all notifications. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Clear All",
            style: "destructive",
            onPress: () => {
              activeSetNotifications([]);
            },
          },
        ]
      );
    } else {
      activeSetNotifications([]);
    }
  }, [showAlert, activeSetNotifications]);

  const handleNotificationPress = useCallback(
    (id) => {
      activeSetNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [activeSetNotifications]
  );

  const handleDismissOne = useCallback(
    (id) => {
      activeSetNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [activeSetNotifications]
  );

  return {
    activeNotifications,
    unreadCount,
    hasAny,
    getCategoryStyles,
    markAllAsRead,
    clearAllNotifications,
    handleNotificationPress,
    handleDismissOne,
  };
}
