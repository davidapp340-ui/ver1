import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface AdminPageBannerProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  accentColor?: string;
}

export default function AdminPageBanner({
  icon: Icon,
  title,
  subtitle,
  accentColor = '#0F172A',
}: AdminPageBannerProps) {
  return (
    <View style={[styles.banner, { borderLeftColor: accentColor }]}>
      <View style={[styles.iconBox, { backgroundColor: accentColor }]}>
        <Icon size={20} color="#FFFFFF" />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
});
