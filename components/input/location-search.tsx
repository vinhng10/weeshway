import { useAlert, useLocationSearch } from "@/hooks";
import { PlaceSuggestion } from "@/hooks/useLocationSearch";
import { supabase } from "@/supabase";
import { LocationType } from "@/types";
import { FlashList } from "@shopify/flash-list";
import React, { useState } from "react";
import { Keyboard, Linking, Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Header } from "../header";
import { IconSymbol } from "../icon-symbol";
import { MenuItem } from "../menu-item";
import { Separator } from "../separator";
import { ThemedActivityIndicator } from "../themed-activity-indicator";
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

export const LocationSearch: React.FunctionComponent<LocationProps> = ({
  label,
  value,
  onValueChange,
  editable = true,
}) => {
  const showAlert = useAlert((state) => state.showAlert);
  const [visible, setVisible] = useState(false);
  const [locationDetailVisible, setLocationDetailVisible] = useState(false);
  const [query, setQuery] = useState("");
  const { suggestions, loading, error, getPlaceDetails, resetSessionToken } =
    useLocationSearch(query);

  const handleLocationPress = async (suggestion: PlaceSuggestion) => {
    try {
      Keyboard.dismiss();

      const location = await getPlaceDetails(suggestion.placeId);
      if (!location) {
        showAlert(
          "Location Error",
          "Couldn't get location details. Please try again.",
        );
        return;
      }

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
          { ignoreDuplicates: true },
        )
        .select()
        .maybeSingle()
        .throwOnError();

      if (onValueChange) onValueChange(location);
      setVisible(false);
      setQuery("");
    } catch {
      showAlert(
        "Location Error",
        "Couldn't save the selected location. Please try again.",
      );
    }
  };

  const renderLocation = ({ item }: { item: PlaceSuggestion }) => (
    <MenuItem
      icon="location-sharp"
      title={item.displayName}
      subtitle={item.secondaryText}
      onPress={() => handleLocationPress(item)}
      showChevron={false}
    />
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.messageContainer}>
          <ThemedActivityIndicator size="large" />
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

  const handleDismiss = () => {
    setVisible(false);
    setQuery("");
    resetSessionToken();
  };

  const handlePress = () => {
    Keyboard.dismiss();
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
        onRequestClose={handleDismiss}
      >
        <View style={styles.modalContainer}>
          <Header title="Location" onPress={handleDismiss} />

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

          <FlashList
            data={suggestions}
            keyExtractor={keyExtractor}
            renderItem={renderLocation}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={Separator}
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

const keyExtractor = (item: PlaceSuggestion) => item.placeId;

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
    gap: theme.gap(0.5),
  },
  modalContainer: {
    flex: 1,
    marginTop: rt.insets.top,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    paddingHorizontal: theme.gap(2),
  },
  scrollContainer: {
    padding: theme.gap(2),
    paddingBottom: theme.gap(48),
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    paddingHorizontal: theme.gap(2),
    gap: theme.gap(2),
  },
  row: {
    flexDirection: "row",
  },
}));
