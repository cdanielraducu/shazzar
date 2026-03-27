import React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';

function App(): JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Shazzar</Text>
        <Text style={styles.subtitle}>Phase 1 — Foundation</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#555555',
    marginTop: 8,
    letterSpacing: 1,
  },
});

export default App;
