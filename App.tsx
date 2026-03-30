import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from '@/modules/DeviceInfo';
import Health from '@/modules/Health';

function App(): JSX.Element {
  const [model, setModel] = useState<string>('');
  const [osVersion, setOsVersion] = useState<string>('');
  const [battery, setBattery] = useState<number | null>(null);
  const [healthAvailable, setHealthAvailable] = useState<string>('...');
  const [steps, setSteps] = useState<string>('—');
  const [permStatus, setPermStatus] = useState<string>('Not requested');

  useEffect(() => {
    // Constants — already resolved at module init, no bridge call
    setModel(DeviceInfo.model);
    setOsVersion(DeviceInfo.osVersion);

    // Async call — Promise
    DeviceInfo.getBatteryLevel()
      .then(level => setBattery(Math.round(level * 100)))
      .catch(err => console.error('Battery error:', err));

    // Health Connect availability check
    Health.isAvailable()
      .then(available => setHealthAvailable(available ? 'Yes' : 'No'))
      .catch(err => {
        console.error('Health error:', err);
        setHealthAvailable('Error');
      });
  }, []);

  const requestPermission = () => {
    setPermStatus('Requesting...');
    Health.requestPermissions()
      .then(granted => setPermStatus(granted ? 'Granted' : 'Denied'))
      .catch(err => {
        console.error('Permission error:', err);
        setPermStatus('Error');
      });
  };

  const readSteps = () => {
    setSteps('Loading...');
    // Read today's steps — midnight to now
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    Health.getSteps(startOfDay.toISOString(), now.toISOString())
      .then(count =>
        setSteps(count != null ? String(Math.floor(count)) : 'Unavailable'),
      )
      .catch(err => {
        console.error('Steps error:', err);
        setSteps('Error');
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Shazzar</Text>
        <Text style={styles.subtitle}>Phase 2 — Native Modules</Text>

        <View style={styles.card}>
          <Row label="Model" value={model} />
          <Row label="OS" value={osVersion} />
          <Row
            label="Battery"
            value={battery !== null ? `${battery}%` : '...'}
          />
        </View>

        <View style={[styles.card, {marginTop: 16}]}>
          <Row label="HealthKit" value={healthAvailable} />
          <Row label="Permission" value={permStatus} />
          <Row label="Steps today" value={steps} />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={requestPermission}>
              <Text style={styles.buttonText}>Request Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={readSteps}>
              <Text style={styles.buttonText}>Read Steps</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Row({label, value}: {label: string; value: string}): JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value || '...'}
      </Text>
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
    flexShrink: 0,
  },
  value: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  button: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 12,
    color: '#cccccc',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default App;
