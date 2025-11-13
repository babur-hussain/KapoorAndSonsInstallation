import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

const PhoneLoginScreen = ({ navigation }: any) => {
  const { signInWithPhone, confirmPhoneCode, isLoading } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  /**
   * Send OTP to phone number
   */
  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    // Validate phone number format (should start with +)
    if (!phoneNumber.startsWith("+")) {
      Alert.alert(
        "Invalid Format",
        "Please enter phone number with country code (e.g., +1234567890)"
      );
      return;
    }

    try {
      setLocalLoading(true);
      const confirmationResult = await signInWithPhone(phoneNumber.trim());
      setConfirmation(confirmationResult);
      Alert.alert(
        "OTP Sent",
        "A verification code has been sent to your phone number"
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send OTP");
    } finally {
      setLocalLoading(false);
    }
  };

  /**
   * Verify OTP code
   */
  const handleVerifyOTP = async () => {
    if (!verificationCode.trim()) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    if (!confirmation) {
      Alert.alert("Error", "Please request a verification code first");
      return;
    }

    try {
      setLocalLoading(true);
      await confirmPhoneCode(confirmation, verificationCode.trim());
      // Navigation is handled by auth state change
    } catch (error: any) {
      Alert.alert("Verification Failed", error.message || "Invalid verification code");
    } finally {
      setLocalLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOTP = async () => {
    setVerificationCode("");
    setConfirmation(null);
    await handleSendOTP();
  };

  /**
   * Go back to login screen
   */
  const handleBack = () => {
    navigation.goBack();
  };

  const loading = isLoading || localLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={loading}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="call" size={48} color="#0066FF" />
          </View>
          <Text style={styles.title}>Phone Verification</Text>
          <Text style={styles.subtitle}>
            {!confirmation
              ? "Enter your phone number to receive a verification code"
              : "Enter the 6-digit code sent to your phone"}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {!confirmation ? (
            // Phone Number Input
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+1 234 567 8900"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  editable={!loading}
                />
              </View>

              <Text style={styles.hint}>
                Include country code (e.g., +1 for USA, +91 for India)
              </Text>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Send Verification Code</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            // OTP Input
            <>
              <View style={styles.phoneDisplay}>
                <Text style={styles.phoneDisplayText}>{phoneNumber}</Text>
                <TouchableOpacity onPress={() => setConfirmation(null)} disabled={loading}>
                  <Text style={styles.changePhoneText}>Change</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="keypad-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Verify Code</Text>
                    <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOTP}
                disabled={loading}
              >
                <Text style={styles.resendButtonText}>Didn't receive code? Resend</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Standard SMS rates may apply. We'll send you a one-time verification code.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E6F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  hint: {
    fontSize: 12,
    color: "#999",
    marginBottom: 20,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#0066FF",
    borderRadius: 8,
    height: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  phoneDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  phoneDisplayText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  changePhoneText: {
    fontSize: 14,
    color: "#0066FF",
    fontWeight: "600",
  },
  resendButton: {
    marginTop: 16,
    alignItems: "center",
  },
  resendButtonText: {
    color: "#0066FF",
    fontSize: 14,
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 24,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
});

export default PhoneLoginScreen;

