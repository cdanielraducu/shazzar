import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from '@/modules/DeviceInfo';
import Health from '@/modules/Health';
import SQLite from '@/modules/SQLite';

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

  const [sqlLog, setSqlLog] = useState<string[]>([]);

  const log = (msg: string) =>
    setSqlLog(prev => [...prev, msg]);

  const clearLog = () => setSqlLog([]);

  const testCrud = async () => {
    clearLog();
    try {
      // Create table
      await SQLite.execute(
        'CREATE TABLE IF NOT EXISTS habits (id INTEGER PRIMARY KEY, name TEXT, frequency TEXT)',
      );
      log('Created table');

      // Insert
      const ins1 = await SQLite.execute(
        'INSERT INTO habits (name, frequency) VALUES (?, ?)',
        ['Read 30 min', 'daily'],
      );
      log(`Inserted: rowsAffected=${ins1.rowsAffected}`);

      const ins2 = await SQLite.execute(
        'INSERT INTO habits (name, frequency) VALUES (?, ?)',
        ['Exercise', 'daily'],
      );
      log(`Inserted: rowsAffected=${ins2.rowsAffected}`);

      // Read
      const all = await SQLite.execute('SELECT * FROM habits');
      log(`SELECT: ${all.rows.length} rows`);
      all.rows.forEach(r => log(`  id=${r.id} name=${r.name}`));

      // Update
      const upd = await SQLite.execute(
        'UPDATE habits SET name = ? WHERE name = ?',
        ['Read 1 hour', 'Read 30 min'],
      );
      log(`Updated: rowsAffected=${upd.rowsAffected}`);

      // Delete
      const del = await SQLite.execute('DELETE FROM habits WHERE name = ?', [
        'Exercise',
      ]);
      log(`Deleted: rowsAffected=${del.rowsAffected}`);

      // Final state
      const final_ = await SQLite.execute('SELECT * FROM habits');
      log(`Final: ${final_.rows.length} rows`);
      final_.rows.forEach(r => log(`  id=${r.id} name=${r.name}`));

      // Cleanup
      await SQLite.execute('DROP TABLE habits');
      log('Dropped table. CRUD test passed.');
    } catch (e: any) {
      log(`ERROR: ${e.message}`);
    }
  };

  const testBreakers = async () => {
    clearLog();
    try {
      await SQLite.execute(
        'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, val TEXT)',
      );

      // 1. Invalid SQL
      log('--- Invalid SQL ---');
      try {
        await SQLite.execute('SELEC * FORM test');
        log('FAIL: should have thrown');
      } catch (e: any) {
        log(`OK: ${e.message}`);
      }

      // 2. Wrong param count
      log('--- Wrong param count ---');
      try {
        await SQLite.execute('INSERT INTO test (val) VALUES (?, ?)', [
          'only one',
        ]);
        log('FAIL: should have thrown');
      } catch (e: any) {
        log(`OK: ${e.message}`);
      }

      // 3. NULL param
      log('--- NULL param ---');
      await SQLite.execute('INSERT INTO test (val) VALUES (?)', [null]);
      const nullRow = await SQLite.execute(
        'SELECT * FROM test WHERE val IS NULL',
      );
      log(
        nullRow.rows.length === 1
          ? 'OK: NULL stored and queried'
          : 'FAIL: NULL not found',
      );

      // 4. Transaction rollback
      log('--- Rollback ---');
      await SQLite.beginTransaction();
      await SQLite.execute('INSERT INTO test (val) VALUES (?)', ['ghost']);
      await SQLite.rollbackTransaction();
      const ghost = await SQLite.execute(
        "SELECT * FROM test WHERE val = 'ghost'",
      );
      log(
        ghost.rows.length === 0
          ? 'OK: rollback worked, row gone'
          : 'FAIL: row survived rollback',
      );

      // 5. Transaction commit
      log('--- Commit ---');
      await SQLite.beginTransaction();
      await SQLite.execute('INSERT INTO test (val) VALUES (?)', ['persisted']);
      await SQLite.commitTransaction();
      const persisted = await SQLite.execute(
        "SELECT * FROM test WHERE val = 'persisted'",
      );
      log(
        persisted.rows.length === 1
          ? 'OK: commit worked, row exists'
          : 'FAIL: row missing after commit',
      );

      // 6. Commit without begin
      log('--- Commit without begin ---');
      try {
        await SQLite.commitTransaction();
        log('FAIL: should have thrown');
      } catch (e: any) {
        log(`OK: ${e.message}`);
      }

      // 7. Query nonexistent table
      log('--- Nonexistent table ---');
      try {
        await SQLite.execute('SELECT * FROM does_not_exist');
        log('FAIL: should have thrown');
      } catch (e: any) {
        log(`OK: ${e.message}`);
      }

      // Cleanup
      await SQLite.execute('DROP TABLE test');
      log('--- All breaker tests done ---');
    } catch (e: any) {
      log(`UNEXPECTED ERROR: ${e.message}`);
    }
  };

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
      <ScrollView contentContainerStyle={styles.content}>
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

        <View style={[styles.card, {marginTop: 16}]}>
          <Text style={styles.cardTitle}>SQLite</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={testCrud}>
              <Text style={styles.buttonText}>Test CRUD</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={testBreakers}>
              <Text style={styles.buttonText}>Test Breakers</Text>
            </TouchableOpacity>
          </View>
          {sqlLog.length > 0 && (
            <View style={styles.logBox}>
              {sqlLog.map((line, i) => (
                <Text
                  key={i}
                  style={[
                    styles.logLine,
                    line.startsWith('ERROR') || line.startsWith('FAIL')
                      ? styles.logError
                      : line.startsWith('OK')
                      ? styles.logOk
                      : null,
                  ]}>
                  {line}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  logBox: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  logLine: {
    fontSize: 11,
    color: '#999999',
    fontFamily: 'monospace',
  },
  logError: {
    color: '#ff6b6b',
  },
  logOk: {
    color: '#51cf66',
  },
});

export default App;
