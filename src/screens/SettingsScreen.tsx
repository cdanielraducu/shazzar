import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

export function SettingsScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Preferences go here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#555555',
    marginTop: 8,
    letterSpacing: 1,
  },
});
