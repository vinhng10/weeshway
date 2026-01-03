import {
  Avatar,
  Button,
  Header,
  IconSymbol,
  TextBoxInput,
  TextInput,
  ThemedText,
  Tile,
} from "@/components";
import { supabase, uploadMedia } from "@/supabase";
import { LocationType } from "@/types";
import camelcaseKeys from "camelcase-keys";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface LocationProps {
  label: string;
  value?: LocationType;
  editable?: boolean;
  onValueChange?: any;
}

export const LocationInput: React.FunctionComponent<LocationProps> = ({
  label,
  value,
  onValueChange,
  editable = true,
}) => {
  const [visible, setVisible] = useState(false);
  const [addLocationVisible, setAddLocationVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(value?.name || "");
  const [address, setAddress] = useState(value?.address || "");
  const [imageUrl, setImageUrl] = useState(value?.imageUrl || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const searchLocations = async () => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        setLocations([]);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("locations")
        .select()
        .textSearch("name", `'${trimmedQuery}'`);

      if (error) throw error;

      if (data) {
        const camelCasedData = camelcaseKeys(data, { deep: true });
        setLocations(camelCasedData as LocationType[]);
      } else {
        setLocations([]);
      }
      setLoading(false);
    };

    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchLocations();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleLocationPress = (location: LocationType) => {
    Keyboard.dismiss();
    if (onValueChange) {
      onValueChange(location);
    }
    setVisible(false);
  };

  const handleAddNewLocation = async () => {
    try {
      setIsSaving(true);

      const url = imageUrl ? await uploadMedia("locations", imageUrl) : null;

      const { data, error } = await supabase
        .from("locations")
        .insert({
          name: name.trim(),
          address: address.trim(),
          image_url: url,
        })
        .select()
        .single();

      if (error) throw error;

      if (onValueChange) {
        onValueChange(camelcaseKeys(data, { deep: true }));
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
      setQuery(name);
      setAddLocationVisible(false);
    }
  };

  return (
    <>
      <Pressable
        style={styles.container}
        onPress={() => setVisible(true)}
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
              placeholder="What location do you want to dance?"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCapitalize="none"
              autoFocus
            />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {loading && (
              <View style={styles.messageContainer}>
                <ActivityIndicator size="large" />
              </View>
            )}
            {error && (
              <View style={styles.messageContainer}>
                <ThemedText color="danger">{error}</ThemedText>
              </View>
            )}
            {!loading &&
              !error &&
              query.length > 0 &&
              locations.length === 0 && (
                <View style={styles.messageContainer}>
                  <ThemedText color="dimmed">No locations found</ThemedText>
                </View>
              )}
            {!loading &&
              !error &&
              query.length > 0 &&
              locations.map((location) => (
                <Tile
                  key={location.id}
                  imageSource={{ uri: location.imageUrl }}
                  title={location.name}
                  subtitle={location.address}
                  onPress={() => handleLocationPress(location)}
                />
              ))}
          </ScrollView>

          <Button
            stickyBottom
            label="Add Location"
            onPress={() => setAddLocationVisible(true)}
          />
        </View>
      </Modal>

      <Modal
        visible={addLocationVisible}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={() => setAddLocationVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Header
            title="Add Location"
            onPress={() => setAddLocationVisible(false)}
          />

          <View style={styles.addLocationContainer}>
            <View style={styles.row}>
              <Avatar
                source={imageUrl}
                size="large"
                shape="square"
                bordered
                onSourceChange={setImageUrl}
              />
            </View>

            <View style={styles.row}>
              <TextBoxInput label="Name" value={name} onValueChange={setName} />
            </View>

            <View style={styles.row}>
              <TextBoxInput
                label="Address"
                value={address}
                onValueChange={setAddress}
              />
            </View>
          </View>
        </View>

        <Button
          stickyBottom
          label={"Add"}
          onPress={handleAddNewLocation}
          loading={isSaving}
        />
      </Modal>
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
  addLocationContainer: {
    alignItems: "center",
    gap: theme.gap(2),
    padding: theme.gap(2),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
