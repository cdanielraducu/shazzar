import React from 'react';
import {Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useHabitsStore} from '@/store/habitsStore';
import {
  HabitDetailNavigationProp,
  HomeStackParamList,
} from '@/navigation/types';
import {colors, font, fontSize, spacing, radius, letterSpacing} from '@/theme';

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

  const infoRows: [string, string][] = [
    ['TRIGGER', `${pad(habit.triggerHour)}:${pad(habit.triggerMinute)}`],
    ['DATA SOURCE', habit.dataSource || '—'],
    ['FREQUENCY', habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)],
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.name}>{habit.name}</Text>
      <Text style={styles.meta}>{habit.frequency.toUpperCase()}</Text>

      {infoRows.map(([label, value]) => (
        <View key={label} style={styles.infoRow}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      ))}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate('AddEditHabit', {habitId: habit.id})
          }>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          activeOpacity={0.7}
          onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
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
    paddingBottom: spacing[10],
  },
  back: {
    marginBottom: spacing[8],
  },
  backText: {
    fontFamily: font.regular,
    color: colors.fg4,
    fontSize: fontSize.body,
  },
  name: {
    fontFamily: font.bold,
    fontSize: fontSize.heading,
    color: colors.fg1,
    letterSpacing: letterSpacing.wide,
    marginBottom: spacing[2],
  },
  meta: {
    fontFamily: font.regular,
    fontSize: fontSize.label,
    color: colors.fg5,
    letterSpacing: letterSpacing.wider,
    marginBottom: spacing.sectionGap + spacing[2],
  },
  infoRow: {
    marginBottom: spacing[6],
  },
  infoLabel: {
    fontFamily: font.regular,
    fontSize: fontSize.label,
    color: colors.fg5,
    letterSpacing: letterSpacing.wider,
    marginBottom: spacing[1],
  },
  infoValue: {
    fontFamily: font.semibold,
    fontSize: fontSize.value,
    color: colors.fg1,
  },
  actions: {
    gap: spacing[2] + 2,
    marginTop: spacing[3],
  },
  editButton: {
    backgroundColor: colors.surface1,
    borderRadius: radius.default,
    paddingVertical: spacing.cardV,
    alignItems: 'center',
  },
  editButtonText: {
    fontFamily: font.semibold,
    color: colors.fg2,
    fontSize: fontSize.body,
  },
  deleteButton: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.default,
    paddingVertical: spacing.cardV,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  deleteButtonText: {
    fontFamily: font.semibold,
    color: colors.danger,
    fontSize: fontSize.body,
  },
  missing: {
    fontFamily: font.regular,
    color: colors.fg5,
    fontSize: fontSize.body,
    textAlign: 'center',
    marginTop: spacing[10],
  },
});
