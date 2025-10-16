import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../ctx";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace("../sign-in");
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Profile</Text>

        {user && (
          <View style={styles.userInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>User ID:</Text>
              <Text style={styles.value}>{user.uid}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1b1b1b",
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 32,
  },
  userInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#b5b5b5",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  logoutButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
