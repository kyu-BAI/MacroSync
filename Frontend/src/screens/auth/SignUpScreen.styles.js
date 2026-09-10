import { StyleSheet } from "react-native";

// Flat Design Tokens
export const baseColor = "#F8FAFC";
export const logoGreen = "#10B981";

export const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme?.background || baseColor,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerSection: {
    marginBottom: 35,
    alignItems: "center",
    width: "100%",
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: logoGreen,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  brandSubtitle: {
    fontSize: 14,
    color: theme?.textSecondary || "#64748B",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: theme?.border || "#E2E8F0",
  },
  inputGroup: {
    marginBottom: 22,
  },
  inputLabel: {
    color: theme?.textPrimary || "#64748B",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  flatInputField: {
    backgroundColor: theme?.inputBg || baseColor,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || "#E2E8F0",
  },
  inputWarningBorder: {
    borderColor: "#EF4444",
  },
  criteriaContainer: {
    marginTop: 10,
    marginLeft: 6,
  },
  warningHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  criteriaHeaderWarning: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 5,
  },
  criteriaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  criteriaIcon: {
    marginRight: 8,
  },
  criteriaText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme?.textSecondary || "#CBD5E1",
  },
  criteriaTextSuccess: {
    color: "#10B981",
    fontWeight: "700",
  },
  criteriaTextError: {
    color: "#EF4444",
    fontWeight: "700",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  leadingIcon: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    color: theme?.textPrimary || "#0F172A",
    paddingVertical: 15,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: "700",
  },
  toggleButton: {
    paddingLeft: 10,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonBase: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonUnpressed: {
    backgroundColor: logoGreen,
    borderRadius: 20,
  },
  buttonPressed: {
    backgroundColor: "#059669",
    opacity: 0.85,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  buttonTextPressed: {
    color: "#E2E8F0",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: {
    color: theme?.textSecondary || "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  linkText: {
    color: logoGreen,
    fontSize: 14,
    fontWeight: "900",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: theme?.border || "#E2E8F0",
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme?.textSecondary || "#94A3B8",
    paddingHorizontal: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  googleButtonBase: {
    marginTop: 0,
  },
  googleButtonUnpressed: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme?.border || "#E2E8F0",
  },
  googleButtonPressed: {
    backgroundColor: theme?.cardBg || "#F1F5F9",
    borderWidth: 1.5,
    borderColor: theme?.border || "#E2E8F0",
    opacity: 0.85,
  },
  googleContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconImage: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  googleButtonText: {
    color: theme?.textPrimary || "#64748B",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  googleButtonTextPressed: {
    color: theme?.textPrimary || "#0F172A",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26, 43, 35, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContentCard: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 24,
    width: "100%",
    padding: 24,
    borderWidth: 1.5,
    borderColor: theme?.border || "#E2E8F0",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: theme?.textPrimary || "#0F172A",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme?.textSecondary || "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
    fontWeight: "600",
  },
  customInputArea: {
    marginTop: 8,
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalInputLabel: {
    color: theme?.textPrimary || "#64748B",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalTextInput: {
    backgroundColor: theme?.inputBg || "#F1F5F9",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: theme?.textPrimary || "#0F172A",
    fontWeight: "700",
    borderWidth: 1,
    borderColor: theme?.inputBorder || "#E2E8F0",
  },
  modalActionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 4,
  },
  modalButton: {
    flex: 0.48,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: theme?.cardBg || "#F1F5F9",
    borderWidth: 1,
    borderColor: theme?.border || "#E2E8F0",
  },
  modalButtonCancelText: {
    color: theme?.textSecondary || "#64748B",
    fontWeight: "800",
    fontSize: 15,
  },
  modalButtonSubmit: {
    backgroundColor: "#64748B",
  },
  modalButtonSubmitText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
});
