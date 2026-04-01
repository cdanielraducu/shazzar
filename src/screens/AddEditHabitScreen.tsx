import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {addHabit, editHabit, Habit} from '@/store/habitsSlice';
import {
  AddEditHabitNavigationProp,
  HomeStackParamList,
} from '@/navigation/types';

type AddEditHabitRouteProp = RouteProp<HomeStackParamList, 'AddEditHabit'>;

export function AddEditHabitScreen(): JSX.Element {
  const navigation = useNavigation<AddEditHabitNavigationProp>();
  const route = useRoute<AddEditHabitRouteProp>();
  const dispatch = useAppDispatch();

  const existingHabit = useAppSelector(state =>
    route.params?.habitId
      ? state.habits.items.find(h => h.id === route.params.habitId)
      : undefined,
  );

  const isEdit = !!existingHabit;
  const [name, setName] = useState(existingHabit?.name ?? '');
  const [frequency, setFrequency] = useState<Habit['frequency']>(
    existingHabit?.frequency ?? 'daily',
  );

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    if (isEdit && existingHabit) {
      dispatch(editHabit({id: existingHabit.id, name: trimmed, frequency}));
    } else {
      dispatch(addHabit({name: trimmed, frequency}));
    }
    navigation.goBack();
  };

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

      <Text style={styles.label}>Frequency</Text>
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
    marginBottom: 32,
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
  saveButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
