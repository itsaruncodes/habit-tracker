import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme';

const YOUTUBE_URL = 'https://www.youtube.com/@ItsArunCodes/featured';

export default function OwnerTag() {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => Linking.openURL(YOUTUBE_URL)}
      activeOpacity={0.7}
    >
      <View style={styles.iconBadge}>
        <Text style={styles.iconTriangle}>▶</Text>
      </View>
      <Text style={styles.text}>
        Owner: <Text style={styles.link}>ItsArunCodes</Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  iconBadge: {
    width: 18,
    height: 13,
    borderRadius: 4,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  iconTriangle: {
    color: '#fff',
    fontSize: 8,
  },
  text: {
    fontSize: 13,
    color: colors.textMuted,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
  },
});
