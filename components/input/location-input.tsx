import { useAlertStore, useLocationSearch } from "@/hooks";
import { supabase } from "@/supabase";
import { LocationType } from "@/types";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Linking,
  Modal,
  Pressable,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Header } from "../header";
import { IconSymbol } from "../icon-symbol";
import { MenuItem } from "../menu-item";
import { ThemedText } from "../themed-text";
import { TextBoxInput } from "./box-input";
import { Button } from "./button";
import { TextInput } from "./text-input";

interface LocationProps {
  label: string;
  value?: LocationType;
  editable?: boolean;
  onValueChange?: (location: LocationType) => void;
}

interface LocationDetailProps {
  visible: boolean;
  value?: LocationType;
  onClose: () => void;
}

const LocationDetail: React.FunctionComponent<LocationDetailProps> = ({
  visible,
  value,
  onClose,
}) => {
  const handleOpenMaps = () => {
    if (value?.googleMapsUri) {
      Linking.openURL(value.googleMapsUri);
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
      <View style={styles.modalContainer}>
        <Header title={"Location"} onPress={onClose} />

        <View style={styles.modalContent}>
          <View style={styles.row}>
            <TextBoxInput
              label="Name"
              value={value?.displayName}
              editable={false}
            />
          </View>
          <View style={styles.row}>
            <TextBoxInput
              label="Address"
              value={value?.formattedAddress}
              editable={false}
              multiline
            />
          </View>
          {value?.googleMapsUri && (
            <Button label="Open in Google Maps" onPress={handleOpenMaps} />
          )}
        </View>
      </View>
    </Modal>
  );
};

export const LocationInput: React.FunctionComponent<LocationProps> = ({
  label,
  value,
  onValueChange,
  editable = true,
}) => {
  const [visible, setVisible] = useState(false);
  const [locationDetailVisible, setLocationDetailVisible] = useState(false);
  const [query, setQuery] = useState("");
  const { locations, loading, error } = useLocationSearch(query);

  const handleLocationPress = async (location: LocationType) => {
    try {
      Keyboard.dismiss();

      const locationPoint = location.location
        ? `POINT(${location.location.longitude} ${location.location.latitude})`
        : null;

      // Upsert location to database
      await supabase
        .from("locations")
        .upsert(
          {
            id: location.id,
            display_name: location.displayName,
            formatted_address: location.formattedAddress,
            short_formatted_address: location.shortFormattedAddress,
            google_maps_uri: location.googleMapsUri,
            country: location.country,
            administrative_area_level_1: location.administrativeAreaLevel1,
            location: locationPoint,
          },
          { ignoreDuplicates: true }
        )
        .select()
        .maybeSingle()
        .throwOnError();

      if (onValueChange) onValueChange(location);
      setVisible(false);
      setQuery("");
    } catch {
      useAlertStore
        .getState()
        .show(
          "Location Error",
          "Couldn't save the selected location. Please try again."
        );
    }
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.messageContainer}>
          <ThemedText color="danger">{error}</ThemedText>
        </View>
      );
    }

    if (query.trim()) {
      return (
        <View style={styles.messageContainer}>
          <ThemedText color="dimmed">No locations found</ThemedText>
        </View>
      );
    }

    return null;
  };

  const handlePress = () => {
    if (editable) {
      setVisible(true);
    } else {
      setLocationDetailVisible(true);
    }
  };

  return (
    <>
      <Pressable style={styles.container} onPress={handlePress}>
        <View style={styles.iconContainer}>
          <IconSymbol style={styles.icon} name="location-sharp" size={24} />
        </View>
        <View style={styles.content}>
          <ThemedText color="dimmed">{label}</ThemedText>
          <ThemedText type="h5">{value?.displayName}</ThemedText>
        </View>
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Header title="Location" onPress={() => setVisible(false)} />

          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search location"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCapitalize="none"
              autoFocus
            />
          </View>

          <FlatList
            data={locations}
            keyExtractor={(item) => item.id}
            renderItem={({ item: location }) => (
              <MenuItem
                icon="location-sharp"
                title={location.displayName || "Unknown"}
                subtitle={
                  location.shortFormattedAddress ||
                  location.formattedAddress ||
                  ""
                }
                onPress={() => handleLocationPress(location)}
                showChevron={false}
              />
            )}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </Modal>

      <LocationDetail
        visible={locationDetailVisible}
        value={value}
        onClose={() => setLocationDetailVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
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
  modalContainer: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
    opacity: 0.95,
  },
  searchContainer: {
    padding: theme.gap(2),
  },
  scrollContainer: {
    gap: theme.gap(1),
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: theme.gap(2),
    gap: theme.gap(2),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
