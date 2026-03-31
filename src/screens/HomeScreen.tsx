import React, {useState} from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {addHabit, toggleHabit, removeHabit, Habit} from '@/store/habitsSlice';

export function HomeScreen(): JSX.Element {
  const dispatch = useAppDispatch();
  const habits = useAppSelector(state => state.habits.items);
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const name = input.trim();
    if (!name) {
      return;
    }
    dispatch(addHabit({name, frequency: 'daily'}));
    setInput('');
  };

  const handleRemove = (id: string) => {
    Alert.alert('Remove habit?', undefined, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => dispatch(removeHabit(id)),
      },
    ]);
  };

  const renderItem = ({item}: {item: Habit}) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => dispatch(toggleHabit(item.id))}
      onLongPress={() => handleRemove(item.id)}>
      <Text style={[styles.itemText, item.completedToday && styles.itemDone]}>
        {item.completedToday ? '✓ ' : '○ '}
        {item.name}
      </Text>
      <Text style={styles.freq}>{item.frequency}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habits</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="New habit..."
          placeholderTextColor="#555"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No habits yet. Add one above.</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#cccccc',
    fontWeight: '600',
    fontSize: 14,
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
