import React from 'react';
import {Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import Haptics from '@/modules/Haptics';
import {toggleHabit, removeHabit} from '@/store/habitsSlice';
import {
  HabitDetailNavigationProp,
  HomeStackParamList,
} from '@/navigation/types';

type HabitDetailRouteProp = RouteProp<HomeStackParamList, 'HabitDetail'>;

export function HabitDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<HabitDetailNavigationProp>();
  const route = useRoute<HabitDetailRouteProp>();
  const dispatch = useAppDispatch();
  const habitId = route.params?.habitId;
  const habit = useAppSelector(state =>
    state.habits.items.find(h => h.id === habitId),
  );

  if (!habit) {
    return (
      <View style={styles.container}>
        <Text style={styles.missing}>Habit not found.</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Remove habit?', habit.name, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          dispatch(removeHabit(habit.id));
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.name}>{habit.name}</Text>
      <Text style={styles.meta}>{habit.frequency.toUpperCase()}</Text>

      <View style={styles.statusRow}>
        <Text
          style={[styles.status, habit.completedToday && styles.statusDone]}>
          {habit.completedToday ? 'Completed today' : 'Not done yet'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          Haptics.impact('heavy');
          dispatch(toggleHabit(habit.id));
        }}>
        <Text style={styles.buttonText}>
          {habit.completedToday ? 'Mark Incomplete' : 'Mark Complete'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate('AddEditHabit', {habitId: habit.id})
        }>
        <Text style={styles.buttonText}>Edit</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.danger]}
        onPress={handleDelete}>
        <Text style={[styles.buttonText, styles.dangerText]}>Delete</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>HAPTICS</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.chip} onPress={() => Haptics.impact('light')}>
          <Text style={styles.chipText}>impact light</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={() => Haptics.impact('medium')}>
          <Text style={styles.chipText}>impact medium</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={() => Haptics.impact('heavy')}>
          <Text style={styles.chipText}>impact heavy</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={styles.chip} onPress={() => Haptics.notification('success')}>
          <Text style={styles.chipText}>notif success</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={() => Haptics.notification('warning')}>
          <Text style={styles.chipText}>notif warning</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={() => Haptics.notification('error')}>
          <Text style={styles.chipText}>notif error</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.chip} onPress={() => Haptics.selection()}>
        <Text style={styles.chipText}>selection</Text>
      </TouchableOpacity>
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
  back: {
    marginBottom: 32,
  },
  backText: {
    color: '#888888',
    fontSize: 14,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 8,
  },
  meta: {
    fontSize: 11,
    color: '#555555',
    letterSpacing: 2,
    marginBottom: 24,
  },
  statusRow: {
    marginBottom: 32,
  },
  status: {
    fontSize: 14,
    color: '#888888',
  },
  statusDone: {
    color: '#51cf66',
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '600',
  },
  danger: {
    borderWidth: 1,
    borderColor: '#3a1a1a',
    backgroundColor: '#1a0a0a',
  },
  dangerText: {
    color: '#ff6b6b',
  },
  missing: {
    color: '#555555',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  sectionLabel: {
    color: '#444444',
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 32,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  chipText: {
    color: '#aaaaaa',
    fontSize: 12,
  },
});
