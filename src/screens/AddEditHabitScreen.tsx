import React, {useState} from 'react';
import {
  Alert,
  ScrollView,
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
import {colors, font, fontSize, spacing, radius, letterSpacing} from '@/theme';

type AddEditHabitRouteProp = RouteProp<HomeStackParamList, 'AddEditHabit'>;

const pad = (n: number) => String(n).padStart(2, '0');

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
  const removeHabit = useHabitsStore(state => state.removeHabit);

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

  const handleDelete = () => {
    if (existingHabit) {
      Alert.alert('Remove habit?', existingHabit.name, [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeHabit(existingHabit.id);
            navigation.goBack();
          },
        },
      ]);
    }
  };

  const adjustHour = (delta: number) =>
    setTriggerHour(h => (h + delta + 24) % 24);
  const adjustMinute = (delta: number) =>
    setTriggerMinute(m => (m + delta + 60) % 60);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isEdit ? 'Edit Habit' : 'New Habit'}</Text>

      <Text style={styles.label}>HABIT NAME</Text>
      <TextInput
        style={styles.input}
        placeholder="Habit name..."
        placeholderTextColor={colors.fg5}
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
            onPress={() => setFrequency(f)}
            activeOpacity={0.7}>
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
        placeholderTextColor={colors.fg5}
        value={dataSource}
        onChangeText={setDataSource}
        returnKeyType="done"
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        activeOpacity={0.7}>
        <Text style={styles.saveButtonText}>
          {isEdit ? 'Save Changes' : 'Add Habit'}
        </Text>
      </TouchableOpacity>

      {isEdit && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}>
          <Text style={styles.deleteButtonText}>Delete Habit</Text>
        </TouchableOpacity>
      )}
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
  title: {
    fontFamily: font.bold,
    fontSize: fontSize.heading,
    color: colors.fg1,
    letterSpacing: letterSpacing.wide,
    marginBottom: spacing[7],
  },
  label: {
    fontFamily: font.regular,
    fontSize: fontSize.label,
    color: colors.fg5,
    letterSpacing: letterSpacing.wider,
    marginBottom: spacing[2] + 2,
  },
  input: {
    fontFamily: font.regular,
    backgroundColor: colors.surface1,
    borderRadius: radius.default,
    paddingHorizontal: spacing.cardH,
    paddingVertical: spacing[3],
    color: colors.fg1,
    fontSize: fontSize.bodyLg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sectionGap,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing[2] + 2,
    marginBottom: spacing.sectionGap,
  },
  toggle: {
    flex: 1,
    backgroundColor: colors.surface1,
    borderRadius: radius.default,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleActive: {
    backgroundColor: colors.accentBg,
    borderColor: colors.accentMuted,
  },
  toggleText: {
    fontFamily: font.semibold,
    color: colors.fg5,
    fontSize: fontSize.sm,
  },
  toggleTextActive: {
    color: colors.accent,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sectionGap,
    gap: spacing[2],
  },
  timePicker: {
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderRadius: radius.default,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[5],
  },
  timeValue: {
    fontFamily: font.bold,
    color: colors.fg1,
    fontSize: fontSize.time,
    fontVariant: ['tabular-nums'],
    marginVertical: spacing[2],
    minWidth: 32,
    textAlign: 'center',
  },
  arrow: {
    fontFamily: font.regular,
    color: colors.fg5,
    fontSize: fontSize.body,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  timeSep: {
    fontFamily: font.bold,
    color: colors.fg5,
    fontSize: fontSize.time,
  },
  saveButton: {
    backgroundColor: colors.accentBg,
    borderRadius: radius.default,
    paddingVertical: spacing.cardV,
    alignItems: 'center',
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  saveButtonText: {
    fontFamily: font.bold,
    color: colors.accent,
    fontSize: fontSize.body,
    letterSpacing: letterSpacing.wide,
  },
  deleteButton: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.default,
    paddingVertical: spacing.cardV,
    alignItems: 'center',
    marginTop: spacing[2] + 2,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  deleteButtonText: {
    fontFamily: font.semibold,
    color: colors.danger,
    fontSize: fontSize.body,
  },
});
