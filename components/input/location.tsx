import { COUNTRY } from "@/constants";
import { supabase, uploadMedia } from "@/supabase";
import { CountryCodeType, CountryNameType, LocationType } from "@/types";
import camelcaseKeys from "camelcase-keys";
import React, { useEffect, useState } from "react";
import { Modal, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StyleSheet } from "react-native-unistyles";
import { Avatar } from "../avatar";
import { Header } from "../header";
import { IntBoxInput, SelectBoxInput, TextBoxInput } from "./box-input";
import { Button } from "./button";

interface LocationModalProps {
  visible: boolean;
  editable?: boolean;
  value?: LocationType;
  onClose: () => void;
  onSave?: (location: LocationType) => void;
}

const getName = (code?: CountryCodeType): CountryNameType | undefined => {
  return code ? COUNTRY[code] : undefined;
};

const getCode = (name?: CountryNameType): CountryCodeType | undefined => {
  return (Object.keys(COUNTRY) as CountryCodeType[]).find(
    (key) => COUNTRY[key] === name
  );
};

const getFlagEmoji = (countryCode: CountryCodeType): string => {
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))
    .reduce((flag, codePoint) => flag + String.fromCodePoint(codePoint), "");
};

export const Location: React.FunctionComponent<LocationModalProps> = ({
  visible,
  editable = true,
  value,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(value?.name);
  const [addressLine1, setAddressLine1] = useState(value?.addressLine1);
  const [addressLine2, setAddressLine2] = useState(value?.addressLine2);
  const [city, setCity] = useState(value?.city);
  const [stateProvince, setStateProvince] = useState(value?.stateProvince);
  const [postalCode, setPostalCode] = useState(value?.postalCode);
  const [country, setCountry] = useState(getName(value?.countryCode));
  const [imageUrl, setImageUrl] = useState(value?.imageUrl);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && editable) {
      setName(undefined);
      setAddressLine1(undefined);
      setAddressLine2(undefined);
      setCity(undefined);
      setStateProvince(undefined);
      setPostalCode(undefined);
      setCountry(undefined);
      setImageUrl(undefined);
    }
  }, [visible, editable]);

  const handleAddNewLocation = async () => {
    try {
      setIsSaving(true);

      const url = imageUrl ? await uploadMedia("locations", imageUrl) : null;

      const { data, error } = await supabase
        .from("locations")
        .insert({
          name: name?.trim(),
          address_line1: addressLine1?.trim(),
          address_line2: addressLine2?.trim(),
          city: city?.trim(),
          state_province: stateProvince?.trim(),
          postal_code: postalCode?.trim(),
          country_code: getCode(country),
          image_url: url,
        })
        .select()
        .single();

      if (error) throw error;

      if (onSave) onSave(camelcaseKeys(data, { deep: true }) as LocationType);
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

        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
              label="Address Line 1"
              value={addressLine1}
              onValueChange={setAddressLine1}
              editable={editable}
            />
          </View>

          <View style={styles.row}>
            <TextBoxInput
              label="Address Line 2"
              value={addressLine2}
              onValueChange={setAddressLine2}
              editable={editable}
            />
          </View>

          <View style={styles.row}>
            <TextBoxInput
              label="City"
              value={city}
              onValueChange={setCity}
              editable={editable}
            />
            <TextBoxInput
              label="State/Province"
              value={stateProvince}
              onValueChange={setStateProvince}
              editable={editable}
            />
          </View>

          <View style={styles.row}>
            <IntBoxInput
              label="Postal Code"
              value={postalCode}
              onValueChange={setPostalCode}
              editable={editable}
            />
            <SelectBoxInput
              label="Country"
              value={country}
              options={COUNTRY}
              onValueChange={setCountry}
              renderFunction={(item) =>
                `${getFlagEmoji(item.key)} ${item.value}`
              }
              editable={editable}
            />
          </View>
        </KeyboardAwareScrollView>
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
  scrollContent: {
    alignItems: "center",
    gap: theme.gap(2),
    padding: theme.gap(2),
    paddingBottom: theme.gap(16),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
}));
