import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import DeviceInfo from '@/modules/DeviceInfo';
import Health from '@/modules/Health';
import SQLite from '@/modules/SQLite';
import {requestNotificationPermission, openAppSettings} from '@/modules/Permissions';
import {
  softDeleteHabit,
  restoreHabit,
  getLiveHabits,
  getDeletedHabits,
} from '@/modules/SQLite/db';

export function SettingsScreen(): React.JSX.Element {
  const [output, setOutput] = useState<string>('Tap a button to test a module.');

  const log = (msg: string) => setOutput(msg);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Native Module Playground</Text>

      <Text style={styles.section}>PERMISSIONS</Text>
      <TouchableOpacity style={styles.button} onPress={async () => {
        const status = await requestNotificationPermission();
        if (status === 'blocked') {
          log('notifications blocked — opening Settings');
          openAppSettings();
        } else {
          log(`notifications: ${status}`);
        }
      }}>
        <Text style={styles.buttonText}>request notifications</Text>
      </TouchableOpacity>

      <Text style={styles.section}>DEVICE INFO</Text>
      <TouchableOpacity style={styles.button} onPress={() => {
        log(`model: ${DeviceInfo.model}\nos: ${DeviceInfo.osVersion}`);
      }}>
        <Text style={styles.buttonText}>constants (model + os)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          const level = await DeviceInfo.getBatteryLevel();
          log(`battery: ${(level * 100).toFixed(0)}%`);
        } catch (e: any) {
          log(`error: ${e.message}`);
        }
      }}>
        <Text style={styles.buttonText}>getBatteryLevel()</Text>
      </TouchableOpacity>

      <Text style={styles.section}>HEALTH</Text>
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          const available = await Health.isAvailable();
          log(`isAvailable: ${available}`);
        } catch (e: any) {
          log(`error: ${e.message}`);
        }
      }}>
        <Text style={styles.buttonText}>isAvailable()</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          const granted = await Health.requestPermissions();
          log(`permissions granted: ${granted}`);
        } catch (e: any) {
          log(`error: ${e.message}`);
        }
      }}>
        <Text style={styles.buttonText}>requestPermissions()</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          const now = new Date();
          const start = new Date(now);
          start.setHours(0, 0, 0, 0);
          const steps = await Health.getSteps(start.toISOString(), now.toISOString());
          log(`steps today: ${steps}`);
        } catch (e: any) {
          log(`error: ${e.message}`);
        }
      }}>
        <Text style={styles.buttonText}>getSteps() today</Text>
      </TouchableOpacity>

      <Text style={styles.section}>SQLITE</Text>
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          await SQLite.execute('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, value TEXT)');
          log('CREATE TABLE ok');
        } catch (e: any) {
          log(`error: ${e.message}`);
        }
      }}>
        <Text style={styles.buttonText}>CREATE TABLE</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          const result = await SQLite.execute(
            'INSERT INTO test (value) VALUES (?)',
            [`hello at ${new Date().toISOString()}`],
          );
          log(`inserted, rowsAffected: ${result.rowsAffected}`);
        } catch (e: any) {
          log(`error: ${e.message}`);
        }
      }}>
        <Text style={styles.buttonText}>INSERT row</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          const result = await SQLite.execute('SELECT * FROM test', []);
          log(`rows: ${JSON.stringify(result.rows, null, 2)}`);
        } catch (e: any) {
          log(`error: ${e.message}`);
        }
      }}>
        <Text style={styles.buttonText}>SELECT * FROM test</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          await SQLite.transaction(async tx => {
            await tx.execute('INSERT INTO test (value) VALUES (?)', ['tx row 1']);
            await tx.execute('INSERT INTO test (value) VALUES (?)', ['tx row 2']);
          });
          log('transaction committed');
        } catch (e: any) {
          log(`rolled back: ${e.message}`);
        }
      }}>
        <Text style={styles.buttonText}>transaction (2 inserts)</Text>
      </TouchableOpacity>

      <Text style={styles.section}>SOFT DELETE</Text>
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          await SQLite.execute(
            `INSERT OR IGNORE INTO habits (id, name, frequency) VALUES (?, ?, ?)`,
            ['habit-1', 'Morning run', 'daily'],
          );
          log('seeded habit-1');
        } catch (e: any) {
          log(`error: ${e.message}`);
        }
      }}>
        <Text style={styles.buttonText}>seed habit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          await softDeleteHabit('habit-1');
          log('soft deleted habit-1');
        } catch (e: any) {
          log(`error: ${e.message}`);
        }
      }}>
        <Text style={styles.buttonText}>soft delete habit-1</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          await restoreHabit('habit-1');
          log('restored habit-1');
        } catch (e: any) {
          log(`error: ${e.message}`);
        }
      }}>
        <Text style={styles.buttonText}>restore habit-1</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          const live = await getLiveHabits();
          log(`live: ${JSON.stringify(live, null, 2)}`);
        } catch (e: any) {
          log(`error: ${e.message}`);
        }
      }}>
        <Text style={styles.buttonText}>live habits</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          const deleted = await getDeletedHabits();
          log(`deleted: ${JSON.stringify(deleted, null, 2)}`);
        } catch (e: any) {
          log(`error: ${e.message}`);
        }
      }}>
        <Text style={styles.buttonText}>deleted habits (recoverable)</Text>
      </TouchableOpacity>

      <View style={styles.outputBox}>
        <Text style={styles.outputText}>{output}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 32,
  },
  section: {
    color: '#444444',
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  buttonText: {
    color: '#aaaaaa',
    fontSize: 13,
  },
  outputBox: {
    marginTop: 32,
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  outputText: {
    color: '#51cf66',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
