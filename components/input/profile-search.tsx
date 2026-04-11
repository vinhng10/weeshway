import { MAX_TEACHERS } from "@/constants";
import { useSearch } from "@/hooks";
import { ProfileType, SearchResultType } from "@/types";
import { ListRenderItem } from "@shopify/flash-list";
import React, { useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Avatar } from "../avatar";
import { ThemedActivityIndicator } from "../themed-activity-indicator";
import { ThemedText } from "../themed-text";
import { Tile } from "../tile";
import { IconButton } from "./icon-button";
import { SearchModal } from "./search-modal";

interface ProfileSearchProps {
  label: string;
  value: ProfileType[];
  onAdd: (profile: ProfileType) => void;
  onRemove: (id: string) => void;
  editable?: boolean;
}

export const ProfileSearch: React.FunctionComponent<ProfileSearchProps> = ({
  label,
  value,
  onAdd,
  onRemove,
  editable = true,
}) => {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const { data, loading, error, isDebouncing } = useSearch(
    query,
    "search_profiles",
  );

  const selectedIds = value.map((p) => p.id);
  const filteredResults = data.filter((r) => !selectedIds.includes(r.id));

  const open = () => setVisible(true);
  const close = () => {
    setVisible(false);
    setQuery("");
  };

  const handleSelect = (result: SearchResultType) => {
    onAdd({
      id: result.id,
      fullName: result.title,
      bio: result.subtitle,
      avatarUrl: result.imageUrl,
    });
    close();
  };

  const renderItem: ListRenderItem<SearchResultType> = ({ item }) => (
    <Tile
      imageSource={item.imageUrl}
      title={item.title}
      subtitle={item.subtitle}
      onPress={() => handleSelect(item)}
    />
  );

  const renderEmptyState = () => {
    if (!query.trim() || isDebouncing) return null;
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
    return (
      <View style={styles.messageContainer}>
        <ThemedText color="dimmed">No teachers found</ThemedText>
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <ThemedText color="dimmed">{label}</ThemedText>
        <View style={styles.selection}>
          {value.map((teacher) => (
            <View key={teacher.id}>
              <Avatar source={teacher.avatarUrl} bordered shape="circle" />
              {editable && (
                <IconButton
                  icon="close"
                  iconSize={10}
                  style={styles.removeButton}
                  onPress={() => onRemove(teacher.id)}
                />
              )}
            </View>
          ))}
          {editable && value.length < MAX_TEACHERS && (
            <IconButton
              icon="add"
              iconSize={20}
              style={styles.addButton}
              onPress={open}
            />
          )}
        </View>
      </View>

      <SearchModal
        visible={visible}
        title="Tag a Teacher"
        placeholder="Search teachers by name..."
        query={query}
        onQueryChange={setQuery}
        onClose={close}
        data={filteredResults}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyState}
      />
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "column",
    gap: theme.gap(0.5),
    borderRadius: theme.gap(2),
    padding: theme.gap(1.5),
    backgroundColor: theme.colors.foreground,
  },
  selection: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
    flexWrap: "wrap",
  },
  removeButton: {
    position: "absolute",
    bottom: theme.gap(-0.5),
    right: theme.gap(-0.5),
    width: theme.gap(2),
    height: theme.gap(2),
  },
  addButton: {
    width: theme.gap(5),
    height: theme.gap(5),
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
}));
