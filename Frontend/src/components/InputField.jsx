import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Eye, EyeOff, AlertCircle } from "lucide-react-native";

export default function InputField({
  label,
  Icon,
  value,
  onChangeText,
  onBlur,
  placeholder,
  placeholderTextColor,
  isPassword = false,
  isSecure = false,
  onToggleSecure,
  editable = true,
  keyboardType = "default",
  showWarning = false,
  errorMessage = "",
  styles,
}) {
  const iconColor = showWarning ? "#EF4444" : "#94A3B8";

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[
          styles.flatInputField,
          styles.fieldRow,
          showWarning && styles.inputWarningBorder ? styles.inputWarningBorder : null,
        ]}
      >
        {Icon ? <Icon color={iconColor} size={20} style={styles.leadingIcon} /> : null}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || "#94A3B8"}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={isPassword && isSecure}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
        />
        {isPassword && onToggleSecure ? (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={onToggleSecure}
            activeOpacity={0.6}
            disabled={!editable}
          >
            {isSecure ? (
              <EyeOff color={iconColor} size={22} />
            ) : (
              <Eye color={showWarning ? "#EF4444" : "#10B981"} size={22} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
      {showWarning && errorMessage ? (
        <View style={styles.inlineWarningRow}>
          <AlertCircle color="#EF4444" size={13} style={styles.warningIcon} />
          <Text style={styles.inlineWarningText}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}
