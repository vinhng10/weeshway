import { Avatar, Button, Header, TextBoxInput } from "@/components";
import { supabase, uploadMedia } from "@/supabase";
import { LocationType } from "@/types";
import camelcaseKeys from "camelcase-keys";
import React, { useState } from "react";
import { Modal, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface LocationModalProps {
  visible: boolean;
  editable?: boolean;
  value?: LocationType;
  onClose: () => void;
  onValueChange?: (location: LocationType) => void;
  onSaveSuccess?: (locationName: string) => void;
}

export const LocationModal: React.FunctionComponent<LocationModalProps> = ({
  visible,
  editable = true,
  value,
  onClose,
  onValueChange,
  onSaveSuccess,
}) => {
  const [name, setName] = useState(value?.name || "");
  const [address, setAddress] = useState(value?.address || "");
  const [imageUrl, setImageUrl] = useState(value?.imageUrl || null);
  const [isSaving, setIsSaving] = useState(false);

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
        onValueChange(camelcaseKeys(data, { deep: true }) as LocationType);
      }

      if (onSaveSuccess) {
        onSaveSuccess(name.trim());
      }
    } catch (error: any) {
      console.error("Error adding location:", error);
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
      <View style={styles.modalContainer}>
        <Header title={"Location"} onPress={onClose} />

        <View style={styles.addLocationContainer}>
          <View style={styles.row}>
            <Avatar
              source={imageUrl}
              size="large"
              shape="square"
              bordered
              onSourceChange={setImageUrl}
              editable={editable}
            />
          </View>

          <View style={styles.row}>
            <TextBoxInput
              label="Name"
              value={name}
              onValueChange={setName}
              editable={editable}
            />
          </View>

          <View style={styles.row}>
            <TextBoxInput
              label="Address"
              value={address}
              onValueChange={setAddress}
              editable={editable}
            />
          </View>
        </View>
      </View>

      {editable && (
        <Button
          stickyBottom
          label={"Add"}
          onPress={handleAddNewLocation}
          loading={isSaving}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  modalContainer: {
    flex: 1,
    marginTop: rt.insets.top + theme.gap(1),
    backgroundColor: theme.colors.background,
    opacity: 0.95,
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
