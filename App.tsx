import React, {useEffect, useState} from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import DeviceInfo from '@/modules/DeviceInfo';

function App(): JSX.Element {
  const [model, setModel] = useState<string>('');
  const [osVersion, setOsVersion] = useState<string>('');
  const [battery, setBattery] = useState<number | null>(null);

  useEffect(() => {
    // Constants — already resolved at module init, no bridge call
    setModel(DeviceInfo.model);
    setOsVersion(DeviceInfo.osVersion);

    // Async call — Promise
    DeviceInfo.getBatteryLevel()
      .then(level => setBattery(Math.round(level * 100)))
      .catch(err => console.error('Battery error:', err));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Shazzar</Text>
        <Text style={styles.subtitle}>Phase 2 — Native Modules</Text>

        <View style={styles.card}>
          <Row label="Model" value={model} />
          <Row label="Android" value={osVersion} />
          <Row label="Battery" value={battery !== null ? `${battery}%` : '...'} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Row({label, value}: {label: string; value: string}): JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '...'}</Text>
    </View>
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
    padding: 24,
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
    marginBottom: 40,
  },
  card: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#888888',
    letterSpacing: 1,
  },
  value: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default App;
