import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface Props {
  svgContent?: string | null;
}

const EMPTY_HINT =
  'Paste SVG XML in the exercise editor to render a custom vector here.';

export default function CustomSvgExercise({ svgContent }: Props) {
  const xml = (svgContent || '').trim();

  if (!xml) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{EMPTY_HINT}</Text>
      </View>
    );
  }

  return (
    <View style={styles.stage}>
      <SvgXml xml={xml} width="100%" height="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
});
