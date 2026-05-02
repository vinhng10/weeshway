import { CLASS_FORMAT } from "@/constants";
import { useAlert, useLocationSearch } from "@/hooks";
import { PlaceSuggestion } from "@/hooks/useLocationSearch";
import { supabase } from "@/supabase";
import { Format, FormatType } from "@/types";
import { FlashList } from "@shopify/flash-list";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Keyboard, Linking, Modal, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ChipBar } from "../chip-bar";
import { Header } from "../header";
import { IconSymbol } from "../icon-symbol";
import { MenuItem } from "../menu-item";
import { Pressable } from "../pressable";
import { Separator } from "../separator";
import { ThemedActivityIndicator } from "../themed-activity-indicator";
import { ThemedText } from "../themed-text";
import { TextBoxInput } from "./box-input";
import { Button } from "./button";
import { ButtonGroup } from "./button-group";
import { TextInput } from "./text-input";

function isValidUrl(s?: string): boolean {
  if (!s) return false;
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

interface LocationSearchProps {
  label: string;
  value?: Format;
  editable?: boolean;
  onValueChange?: (value: Format) => void;
}

export const LocationSearch: React.FunctionComponent<LocationSearchProps> = ({
  label,
  value,
  onValueChange,
  editable = true,
}) => {
  const showAlert = useAlert((state) => state.showAlert);
  const [searchVisible, setSearchVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [query, setQuery] = useState("");
  const { suggestions, loading, error, getPlaceDetails, resetSessionToken } =
    useLocationSearch(query);

  const format = value?.format ?? CLASS_FORMAT.IN_PERSON;
  const place =
    value?.format === CLASS_FORMAT.IN_PERSON ? value.place : undefined;
  const meetingUrl =
    value?.format !== CLASS_FORMAT.IN_PERSON ? value?.meetingUrl : undefined;

  const compactValueText =
    format === CLASS_FORMAT.IN_PERSON ? place?.displayName : format;

  const handleFormatChange = (next: FormatType) => {
    if (next === CLASS_FORMAT.IN_PERSON) {
      onValueChange?.({ format: CLASS_FORMAT.IN_PERSON, place: undefined });
    } else if (next === CLASS_FORMAT.LIVE_STREAM) {
      onValueChange?.({
        format: CLASS_FORMAT.LIVE_STREAM,
        meetingUrl: undefined,
      });
    } else {
      onValueChange?.({
        format: CLASS_FORMAT.ON_DEMAND,
        meetingUrl: undefined,
      });
    }
  };

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

      onValueChange?.({ format: CLASS_FORMAT.IN_PERSON, place: location });
      setSearchVisible(false);
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
    setSearchVisible(false);
    setQuery("");
    resetSessionToken();
  };

  const handlePress = () => {
    Keyboard.dismiss();
    if (editable) {
      setSearchVisible(true);
    } else {
      setDetailVisible(true);
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
          <ThemedText type="h5">{compactValueText}</ThemedText>
        </View>
      </Pressable>

      {/* Search modal (editable=true) */}
      <Modal
        visible={searchVisible}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={handleDismiss}
      >
        <View style={styles.modalContainer}>
          <Header title={label} onPress={handleDismiss} />

          <View style={styles.modalContent}>
            <ChipBar
              items={[
                {
                  label: "Format",
                  value: format,
                  options: CLASS_FORMAT,
                  modal: false,
                  onValueChange: (next: string) =>
                    handleFormatChange(next as FormatType),
                },
              ]}
            />
            {format === CLASS_FORMAT.IN_PERSON ? (
              <TextInput
                placeholder="Search location"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                autoCapitalize="none"
                autoFocus
              />
            ) : (
              <View style={styles.row}>
                <TextBoxInput
                  label="URL"
                  value={meetingUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  onChangeText={(text: string) =>
                    onValueChange?.({
                      format: format as
                        | typeof CLASS_FORMAT.LIVE_STREAM
                        | typeof CLASS_FORMAT.ON_DEMAND,
                      meetingUrl: text,
                    })
                  }
                />
              </View>
            )}
          </View>

          {format === CLASS_FORMAT.IN_PERSON && (
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
          )}
        </View>

        {format !== CLASS_FORMAT.IN_PERSON && (
          <Button
            position="stickyBottomAbsolute"
            label="Save"
            onPress={handleDismiss}
          />
        )}
      </Modal>

      {/* Detail modal (editable=false) */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Header title={label} onPress={() => setDetailVisible(false)} />

          {format === CLASS_FORMAT.IN_PERSON ? (
            <View style={styles.modalContent}>
              <View style={styles.row}>
                <TextBoxInput
                  label="Name"
                  value={place?.displayName}
                  editable={false}
                />
              </View>
              <View style={styles.row}>
                <TextBoxInput
                  label="Address"
                  value={place?.formattedAddress}
                  editable={false}
                  multiline
                />
              </View>
              {place?.googleMapsUri && (
                <Button
                  icon="location-sharp"
                  label="Open in Google Maps"
                  onPress={() => Linking.openURL(place.googleMapsUri!)}
                />
              )}
            </View>
          ) : (
            <View style={styles.modalContent}>
              <View style={styles.row}>
                <TextBoxInput
                  label="URL"
                  value={meetingUrl}
                  editable={false}
                  multiline
                />
              </View>
              <ButtonGroup>
                <Button
                  label="Copy Link"
                  icon="copy"
                  disabled={!isValidUrl(meetingUrl)}
                  onPress={async () => {
                    if (!meetingUrl) return;
                    await Clipboard.setStringAsync(meetingUrl);
                  }}
                />
                <Button
                  label="Open Link"
                  icon="open"
                  disabled={!isValidUrl(meetingUrl)}
                  onPress={async () => {
                    if (!meetingUrl || !isValidUrl(meetingUrl)) return;
                    await Linking.openURL(meetingUrl);
                  }}
                />
              </ButtonGroup>
            </View>
          )}
        </View>
      </Modal>
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
