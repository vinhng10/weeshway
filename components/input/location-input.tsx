import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { TextField } from "@/components/field";
import { Header } from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { supabase, uploadImage } from "@/supabase";
import { LocationType } from "@/types";
import camelcaseKeys from "camelcase-keys";
import React, { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface LocationProps {
  label: string;
  value?: LocationType;
  editable?: boolean;
  onValueChange?: any;
}

interface LocationModalProps {
  visible: boolean;
  onSave: any;
  onClose: any;
  location?: LocationType;
}

const LocationModal: React.FunctionComponent<LocationModalProps> = ({
  visible,
  onSave,
  onClose,
  location,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(location?.name || "");
  const [address, setAddress] = useState(location?.address || "");
  const [imageUrl, setImageUrl] = useState(location?.imageUrl || null);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      let _imageUrl = location?.imageUrl;
      if (!location?.imageUrl && imageUrl && imageUrl) {
        _imageUrl = await uploadImage(imageUrl, `locations`);
      }

      const { data, error } = await supabase
        .from("locations")
        .insert({
          name: name.trim(),
          address: address.trim(),
          image_url: _imageUrl,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      onSave(camelcaseKeys(data, { deep: true }));
    } catch (error: any) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={modalStyles.container}>
        <Header title="Location" onPress={onClose} />

        <View style={modalStyles.content}>
          <Avatar
            source={imageUrl}
            size="large"
            shape="square"
            bordered
            onSourceChange={setImageUrl}
          />

          <TextField
            label="Name"
            value={name}
            onValueChange={setName}
            placeholder="Name"
          />

          <TextField
            label="Address"
            value={address}
            onValueChange={setAddress}
            placeholder="Address"
          />
        </View>
      </View>

      <Button
        stickyBottom
        label={isSaving ? "Saving..." : "Save"}
        onPress={handleSave}
        disabled={isSaving}
      />
    </Modal>
  );
};

export const LocationInput: React.FunctionComponent<LocationProps> = ({
  label,
  value,
  onValueChange,
  editable = true,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Pressable
        style={styles.container}
        onPress={() => setModalVisible(true)}
        disabled={!editable}
      >
        <View style={styles.iconContainer}>
          <IconSymbol
            style={styles.icon}
            name={"location.app.fill"}
            size={24}
          />
        </View>
        <View style={styles.content}>
          <ThemedText color="dimmed">{label}</ThemedText>
          <ThemedText type="h5">{value?.name}</ThemedText>
        </View>
      </Pressable>

      <LocationModal
        visible={modalVisible}
        onSave={onValueChange}
        onClose={() => setModalVisible(false)}
        location={value}
      />
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  iconContainer: {
    height: theme.gap(5),
    width: theme.gap(5),
    backgroundColor: theme.colors.foreground,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.gap(1),
  },
  icon: {
    color: theme.colors.dimmed,
  },
  content: {
    flex: 1,
    gap: theme.gap(1),
  },
  searchContainer: {
    padding: theme.gap(2),
  },
  scrollContainer: {
    gap: theme.gap(1),
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
}));

const modalStyles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    opacity: 0.95,
  },
  content: {
    gap: theme.gap(2),
    padding: theme.gap(2),
  },
}));
