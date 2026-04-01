import React from 'react';
import {Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {toggleHabit, removeHabit} from '@/store/habitsSlice';
import {
  HabitDetailNavigationProp,
  HomeStackParamList,
} from '@/navigation/types';

type HabitDetailRouteProp = RouteProp<HomeStackParamList, 'HabitDetail'>;

export function HabitDetailScreen(): JSX.Element {
  const navigation = useNavigation<HabitDetailNavigationProp>();
  const route = useRoute<HabitDetailRouteProp>();
  const dispatch = useAppDispatch();
  const habit = useAppSelector(state =>
    state.habits.items.find(h => h.id === route.params.habitId),
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
    <View style={styles.container}>
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
        onPress={() => dispatch(toggleHabit(habit.id))}>
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
});
