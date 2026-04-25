import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View, FlatList} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useHabitsStore, Habit} from '@/store/habitsStore';
import {HomeScreenNavigationProp} from '@/navigation/types';

export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const habits = useHabitsStore(state => state.habits);
  const toggleHabit = useHabitsStore(state => state.toggleHabit);

  const renderItem = ({item}: {item: Habit}) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('HabitDetail', {habitId: item.id})}
      onLongPress={() => toggleHabit(item.id)}>
      <Text style={[styles.itemText, item.completedToday && styles.itemDone]}>
        {item.completedToday ? '✓ ' : '○ '}
        {item.name}
      </Text>
      <Text style={styles.freq}>{item.frequency}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Habits</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddEditHabit', {})}>
          <Text style={styles.addIcon}>＋</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No habits yet. Tap ＋ to add one.</Text>
        }
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
  },
  addIcon: {
    fontSize: 22,
    color: '#888888',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#ffffff',
  },
  itemDone: {
    color: '#51cf66',
  },
  freq: {
    fontSize: 11,
    color: '#555555',
    letterSpacing: 1,
  },
  empty: {
    color: '#444444',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 40,
  },
});
