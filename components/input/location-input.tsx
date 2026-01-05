import { GOOGLE_PLACES_API_KEY } from "@/constants";
import { supabase } from "@/supabase";
import { LocationType } from "@/types";
import camelcaseKeys from "camelcase-keys";
import React, { useEffect, useState } from "react";
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
import { ThemedText } from "../themed-text";
import { Tile } from "../tile";
import { IconSymbol } from "../ui/icon-symbol";
import { TextBoxInput } from "./box-input";
import { Button } from "./button";
import { TextInput } from "./text-input";

interface LocationProps {
  label: string;
  value?: LocationType;
  editable?: boolean;
  onValueChange?: (location: LocationType) => void;
}

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  addressComponents?: Array<{
    types: string[];
    shortText?: string;
    longText?: string;
  }>;
  location?: { latitude: number; longitude: number };
  googleMapsUri?: string;
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

const convertGooglePlaceToLocation = (place: GooglePlace): LocationType => {
  const country = place.addressComponents?.find((comp) =>
    comp.types.includes("country")
  )?.shortText as LocationType["country"];

  const administrativeAreaLevel1 = place.addressComponents?.find((comp) =>
    comp.types.includes("administrative_area_level_1")
  )?.longText;

  return {
    id: place.id,
    displayName: place.displayName?.text,
    formattedAddress: place.formattedAddress,
    shortFormattedAddress: place.shortFormattedAddress,
    googleMapsUri: place.googleMapsUri,
    location: place.location,
    country,
    administrativeAreaLevel1,
  };
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
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchLocations = async () => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        setLocations([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "https://places.googleapis.com/v1/places:searchText",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
              "X-Goog-FieldMask":
                "places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.addressComponents,places.location,places.googleMapsUri",
            },
            body: JSON.stringify({
              textQuery: trimmedQuery,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const jsonData = await response.json();
        const data = camelcaseKeys(jsonData, { deep: true });
        const places: GooglePlace[] = data && data.places ? data.places : [];
        const convertedLocations = places.map(convertGooglePlaceToLocation);
        setLocations(convertedLocations);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to search locations"
        );
        console.error("Search error:", err);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchLocations();
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleLocationPress = async (location: LocationType) => {
    try {
      Keyboard.dismiss();
      setLoading(true);

      const locationPoint = location.location
        ? `POINT(${location.location.longitude} ${location.location.latitude})`
        : null;

      // Upsert location to database
      const { error } = await supabase
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
          { onConflict: "id" }
        )
        .select()
        .single();

      if (error) throw error;

      if (onValueChange) onValueChange(location);
      setVisible(false);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" />
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
          <IconSymbol
            style={styles.icon}
            name={"location.app.fill"}
            size={24}
          />
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
              <Tile
                title={location.displayName || "Unknown"}
                subtitle={
                  location.shortFormattedAddress ||
                  location.formattedAddress ||
                  ""
                }
                onPress={() => handleLocationPress(location)}
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
