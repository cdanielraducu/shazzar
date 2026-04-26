import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useHabitsStore, Habit} from '@/store/habitsStore';
import {
  AddEditHabitNavigationProp,
  HomeStackParamList,
} from '@/navigation/types';

type AddEditHabitRouteProp = RouteProp<HomeStackParamList, 'AddEditHabit'>;

export function AddEditHabitScreen(): React.JSX.Element {
  const navigation = useNavigation<AddEditHabitNavigationProp>();
  const route = useRoute<AddEditHabitRouteProp>();
  const existingHabit = useHabitsStore(state =>
    route.params?.habitId
      ? state.habits.find(h => h.id === route.params.habitId)
      : undefined,
  );
  const addHabit = useHabitsStore(state => state.addHabit);
  const editHabit = useHabitsStore(state => state.editHabit);

  const isEdit = !!existingHabit;
  const [name, setName] = useState(existingHabit?.name ?? '');
  const [frequency, setFrequency] = useState<Habit['frequency']>(
    existingHabit?.frequency ?? 'daily',
  );
  const [triggerHour, setTriggerHour] = useState(
    existingHabit?.triggerHour ?? 9,
  );
  const [triggerMinute, setTriggerMinute] = useState(
    existingHabit?.triggerMinute ?? 0,
  );
  const [dataSource, setDataSource] = useState(
    existingHabit?.dataSource ?? '',
  );

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    if (isEdit && existingHabit) {
      editHabit(
        existingHabit.id,
        trimmed,
        frequency,
        triggerHour,
        triggerMinute,
        dataSource,
      );
    } else {
      addHabit(trimmed, frequency, triggerHour, triggerMinute, dataSource);
    }
    navigation.goBack();
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  const adjustHour = (delta: number) =>
    setTriggerHour(h => (h + delta + 24) % 24);
  const adjustMinute = (delta: number) =>
    setTriggerMinute(m => (m + delta + 60) % 60);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isEdit ? 'Edit Habit' : 'New Habit'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Habit name..."
        placeholderTextColor="#555"
        value={name}
        onChangeText={setName}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />

      <Text style={styles.label}>FREQUENCY</Text>
      <View style={styles.toggleRow}>
        {(['daily', 'weekly'] as Habit['frequency'][]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.toggle, frequency === f && styles.toggleActive]}
            onPress={() => setFrequency(f)}>
            <Text
              style={[
                styles.toggleText,
                frequency === f && styles.toggleTextActive,
              ]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>TRIGGER TIME</Text>
      <View style={styles.timeRow}>
        <View style={styles.timePicker}>
          <TouchableOpacity onPress={() => adjustHour(1)}>
            <Text style={styles.arrow}>▲</Text>
          </TouchableOpacity>
          <Text style={styles.timeValue}>{pad(triggerHour)}</Text>
          <TouchableOpacity onPress={() => adjustHour(-1)}>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.timeSep}>:</Text>
        <View style={styles.timePicker}>
          <TouchableOpacity onPress={() => adjustMinute(5)}>
            <Text style={styles.arrow}>▲</Text>
          </TouchableOpacity>
          <Text style={styles.timeValue}>{pad(triggerMinute)}</Text>
          <TouchableOpacity onPress={() => adjustMinute(-5)}>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.label}>DATA SOURCE</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. steps, messages, news..."
        placeholderTextColor="#555"
        value={dataSource}
        onChangeText={setDataSource}
        returnKeyType="done"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>
          {isEdit ? 'Save Changes' : 'Add Habit'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  back: {
    marginBottom: 32,
  },
  backText: {
    color: '#888888',
    fontSize: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    color: '#555555',
    letterSpacing: 2,
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  toggle: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444444',
  },
  toggleText: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  timePicker: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  timeValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginVertical: 8,
  },
  arrow: {
    color: '#555555',
    fontSize: 14,
  },
  timeSep: {
    color: '#555555',
    fontSize: 22,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
