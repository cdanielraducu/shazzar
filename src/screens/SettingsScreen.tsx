import React, {useState, useEffect} from 'react';
import {Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import DeviceInfo from '@/modules/DeviceInfo';
import Health from '@/modules/Health';
import SQLite from '@/modules/SQLite';
import {requestNotificationPermission, openAppSettings} from '@/modules/Permissions';
import Notifications from '@/modules/Notifications';
import {softDeleteHabit, getLiveHabits} from '@/modules/SQLite/db';
import {colors, font, fontSize, spacing, radius, letterSpacing} from '@/theme';

export function SettingsScreen(): React.JSX.Element {
  const [output, setOutput] = useState<string>('Tap a button to test a module.');

  const log = (msg: string) => setOutput(msg);

  // TODO: remove once FCM token flow is verified
  useEffect(() => {
    Notifications.getFcmToken().then(token => {
      if (token) {
        log(`fcm token: ${token}`);
        console.log('[FCM] token:', token);
      }
    });
    const sub = Notifications.onToken(token => {
      log(`fcm token (rotated): ${token}`);
      console.log('[FCM] token rotated:', token);
    });
    return () => sub?.remove();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}>
      <Text style={styles.title}>Native Module Playground</Text>

      <Text style={styles.section}>PERMISSIONS</Text>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
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

      <Text style={styles.section}>LOCAL NOTIFICATIONS</Text>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
          try {
            if (Platform.OS === 'ios') {
              const status = await Notifications.requestPermission();
              if (status !== 'granted') {
                log(`notification permission ${status}`);
                return;
              }
            } else {
              const canSchedule = await Notifications.canScheduleExactAlarms();
              if (!canSchedule) {
                log('exact alarm permission missing — opening Settings');
                await Notifications.openExactAlarmSettings();
                return;
              }
            }
            await Notifications.schedule(1, 'Shazzar', 'Time to check your habits!', 5000);
            log('notification scheduled — fires in 5 seconds');
          } catch (e: any) {
            log(`error: ${e.message}`);
          }
        }}>
        <Text style={styles.buttonText}>schedule (5s)</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
          try {
            await Notifications.cancel(1);
            log('notification cancelled');
          } catch (e: any) {
            log(`error: ${e.message}`);
          }
        }}>
        <Text style={styles.buttonText}>cancel</Text>
      </TouchableOpacity>

      <Text style={styles.section}>DEVICE INFO</Text>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={() => {
          log(`model: ${DeviceInfo.model}\nos: ${DeviceInfo.osVersion}`);
        }}>
        <Text style={styles.buttonText}>constants (model + os)</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
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
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
          try {
            const available = await Health.isAvailable();
            log(`isAvailable: ${available}`);
          } catch (e: any) {
            log(`error: ${e.message}`);
          }
        }}>
        <Text style={styles.buttonText}>isAvailable()</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
          try {
            const granted = await Health.requestPermissions();
            log(`permissions granted: ${granted}`);
          } catch (e: any) {
            log(`error: ${e.message}`);
          }
        }}>
        <Text style={styles.buttonText}>requestPermissions()</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
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
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
          try {
            await SQLite.execute('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, value TEXT)');
            log('CREATE TABLE ok');
          } catch (e: any) {
            log(`error: ${e.message}`);
          }
        }}>
        <Text style={styles.buttonText}>CREATE TABLE</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
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
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
          try {
            const result = await SQLite.execute('SELECT * FROM test', []);
            log(`rows: ${JSON.stringify(result.rows, null, 2)}`);
          } catch (e: any) {
            log(`error: ${e.message}`);
          }
        }}>
        <Text style={styles.buttonText}>SELECT * FROM test</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
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
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
          try {
            await SQLite.execute(
              `INSERT OR IGNORE INTO habits (id, name, frequency, trigger_hour, trigger_minute, data_source) VALUES (?, ?, ?, ?, ?, ?)`,
              ['habit-1', 'Morning run', 'daily', 9, 0, 'steps'],
            );
            log('seeded habit-1');
          } catch (e: any) {
            log(`error: ${e.message}`);
          }
        }}>
        <Text style={styles.buttonText}>seed habit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
          try {
            await softDeleteHabit('habit-1');
            log('soft deleted habit-1');
          } catch (e: any) {
            log(`error: ${e.message}`);
          }
        }}>
        <Text style={styles.buttonText}>soft delete habit-1</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={async () => {
          try {
            const live = await getLiveHabits();
            log(`live: ${JSON.stringify(live, null, 2)}`);
          } catch (e: any) {
            log(`error: ${e.message}`);
          }
        }}>
        <Text style={styles.buttonText}>live habits</Text>
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
    backgroundColor: colors.bg,
  },
  content: {
    paddingTop: spacing.screenV,
    paddingHorizontal: spacing.screenH,
    paddingBottom: 100,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 18,
    color: colors.fg1,
    letterSpacing: letterSpacing.wide,
    marginBottom: spacing[8],
  },
  section: {
    fontFamily: font.regular,
    color: colors.fg6,
    fontSize: fontSize.micro,
    letterSpacing: letterSpacing.wider,
    marginTop: spacing[5],
    marginBottom: spacing[2] + 2,
  },
  button: {
    backgroundColor: colors.surface1,
    borderRadius: radius.sm,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing.cardH,
    marginBottom: spacing[2],
  },
  buttonText: {
    fontFamily: font.regular,
    color: colors.fg3,
    fontSize: fontSize.sm,
  },
  outputBox: {
    marginTop: spacing[6],
    backgroundColor: colors.surface3,
    borderRadius: radius.default,
    padding: spacing.cardH,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outputText: {
    color: colors.terminal,
    fontSize: fontSize.mono,
    fontFamily: font.regular,
  },
});
