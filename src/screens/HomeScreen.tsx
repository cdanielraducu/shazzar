import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View, FlatList} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useHabitsStore, Habit} from '@/store/habitsStore';
import {HomeScreenNavigationProp} from '@/navigation/types';
import {colors, font, fontSize, spacing, letterSpacing} from '@/theme';

const pad = (n: number) => String(n).padStart(2, '0');

export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const habits = useHabitsStore(state => state.habits);
  const isLoading = useHabitsStore(state => state.isLoading);

  const renderItem = ({item}: {item: Habit}) => (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.6}
      onPress={() => navigation.navigate('HabitDetail', {habitId: item.id})}>
      <View style={styles.timeBlock}>
        <Text style={styles.itemTime}>
          {pad(item.triggerHour)}:{pad(item.triggerMinute)}
        </Text>
        <Text style={styles.itemFreq}>{item.frequency}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.itemBody}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.itemSource}>{item.dataSource || '—'}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Habits</Text>
      </View>
      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No habits yet. Tap + to add one.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: spacing.screenV,
  },
  header: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing[3],
  },
  title: {
    fontFamily: font.bold,
    fontSize: fontSize.display,
    color: colors.fg1,
    letterSpacing: letterSpacing.wider,
  },
  list: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: 100, // clear floating tab bar
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.cardH,
    paddingVertical: 13,
    marginBottom: spacing.itemGap,
    gap: spacing.cardH,
  },
  timeBlock: {
    minWidth: 44,
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  itemTime: {
    fontFamily: font.semibold,
    fontSize: fontSize.sm,
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  itemFreq: {
    fontFamily: font.regular,
    fontSize: fontSize.micro,
    color: colors.fg6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: colors.border,
    flexShrink: 0,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontFamily: font.medium,
    fontSize: fontSize.body,
    color: colors.fg1,
  },
  itemSource: {
    fontFamily: font.regular,
    fontSize: fontSize.label,
    color: colors.fg5,
    marginTop: 3,
  },
  chevron: {
    fontFamily: font.regular,
    fontSize: fontSize.body,
    color: colors.surface2,
    flexShrink: 0,
  },
  empty: {
    fontFamily: font.regular,
    color: colors.fg6,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing[10],
  },
});
