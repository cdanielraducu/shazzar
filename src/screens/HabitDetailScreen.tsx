import React from 'react';
import {Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useHabitsStore} from '@/store/habitsStore';
import {
  HabitDetailNavigationProp,
  HomeStackParamList,
} from '@/navigation/types';

type HabitDetailRouteProp = RouteProp<HomeStackParamList, 'HabitDetail'>;

const pad = (n: number) => String(n).padStart(2, '0');

export function HabitDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<HabitDetailNavigationProp>();
  const route = useRoute<HabitDetailRouteProp>();
  const habitId = route.params?.habitId;
  const habit = useHabitsStore(state => state.habits.find(h => h.id === habitId));
  const removeHabit = useHabitsStore(state => state.removeHabit);

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
          removeHabit(habit.id);
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

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>TRIGGER</Text>
        <Text style={styles.infoValue}>
          {pad(habit.triggerHour)}:{pad(habit.triggerMinute)}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>DATA SOURCE</Text>
        <Text style={styles.infoValue}>
          {habit.dataSource || '—'}
        </Text>
      </View>

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
  infoRow: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 11,
    color: '#555555',
    letterSpacing: 2,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
    marginTop: 12,
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
