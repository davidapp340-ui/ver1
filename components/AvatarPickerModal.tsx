import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { AVATAR_LIST, getAvatarEntry, AvatarEntry } from '@/lib/avatars';
import { useTranslation } from 'react-i18next';

const GRID_COLUMNS = 3;
const MODAL_WIDTH = Math.min(Dimensions.get('window').width - 48, 320);
const ITEM_SIZE = Math.floor((MODAL_WIDTH - 48 - (GRID_COLUMNS - 1) * 12) / GRID_COLUMNS);

interface AvatarPickerModalProps {
  visible: boolean;
  currentAvatarId: string;
  onSelect: (avatarId: string) => void;
  onClose: () => void;
}

export default function AvatarPickerModal({
  visible,
  currentAvatarId,
  onSelect,
  onClose,
}: AvatarPickerModalProps) {
  const { t } = useTranslation();

  const renderItem = ({ item }: { item: AvatarEntry }) => {
    const isSelected = item.id === currentAvatarId;

    return (
      <TouchableOpacity
        style={[
          styles.avatarItem,
          { width: ITEM_SIZE, height: ITEM_SIZE },
          isSelected && styles.avatarItemSelected,
        ]}
        onPress={() => onSelect(item.id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.avatarCircle,
            {
              backgroundColor: item.color + '20',
              borderColor: isSelected ? item.color : 'transparent',
              width: ITEM_SIZE - 8,
              height: ITEM_SIZE - 8,
            },
          ]}
        >
          <Text style={styles.avatarEmoji}>{item.emoji}</Text>
        </View>
        <Text style={[styles.avatarLabel, isSelected && { color: item.color, fontWeight: '700' }]} numberOfLines={1}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.bubble}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('avatar_picker.title')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={AVATAR_LIST}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={GRID_COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            scrollEnabled={false}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    width: MODAL_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 20,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  grid: {
    gap: 12,
  },
  row: {
    gap: 12,
    justifyContent: 'flex-start',
  },
  avatarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  avatarItemSelected: {
    transform: [{ scale: 1.05 }],
  },
  avatarCircle: {
    borderRadius: 999,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  avatarLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
});
