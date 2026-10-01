import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Smartphone, Wallet, CreditCard } from "lucide-react-native";

export default function PaymentMethodModal({
  visible,
  onClose,
  paymentPlan,
  selectedMethod,
  setSelectedMethod,
  isProcessingPayment,
  onConfirmPayment,
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
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Payment Method</Text>
          <Text style={styles.modalSubtitle}>
            Checkout for Premium {paymentPlan.name} Plan ({paymentPlan.price})
          </Text>

          {/* GCash Option */}
          <TouchableOpacity
            style={[
              styles.paymentMethodOption,
              selectedMethod === "gcash" && styles.paymentMethodActive,
            ]}
            onPress={() => setSelectedMethod("gcash")}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 32,
                height: 24,
                borderRadius: 6,
                backgroundColor: "rgba(0, 85, 254, 0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Smartphone color="#0055FE" size={16} strokeWidth={2.5} />
            </View>
            <Text style={styles.paymentMethodText}>GCash</Text>
          </TouchableOpacity>

          {/* Maya Option */}
          <TouchableOpacity
            style={[
              styles.paymentMethodOption,
              selectedMethod === "maya" && styles.paymentMethodActive,
            ]}
            onPress={() => setSelectedMethod("maya")}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 32,
                height: 24,
                borderRadius: 6,
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Wallet color="#10B981" size={16} strokeWidth={2.5} />
            </View>
            <Text style={styles.paymentMethodText}>Maya</Text>
          </TouchableOpacity>

          {/* Card Option */}
          <TouchableOpacity
            style={[
              styles.paymentMethodOption,
              selectedMethod === "card" && styles.paymentMethodActive,
            ]}
            onPress={() => setSelectedMethod("card")}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 32,
                height: 24,
                borderRadius: 6,
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <CreditCard color="#10B981" size={16} strokeWidth={2.5} />
            </View>
            <Text style={styles.paymentMethodText}>Credit or Debit Card</Text>
          </TouchableOpacity>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalSave,
                !selectedMethod && styles.modalSaveDisabled,
              ]}
              onPress={onConfirmPayment}
              disabled={!selectedMethod || isProcessingPayment}
            >
              <Text style={styles.modalSaveText}>
                {isProcessingPayment ? "Processing..." : "Pay Now"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
