import React, {useCallback} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useHabitsStore, Habit} from '@/store/habitsStore';
import {HomeScreenNavigationProp} from '@/navigation/types';
import {colors, font, fontSize, spacing, letterSpacing} from '@/theme';

const pad = (n: number) => String(n).padStart(2, '0');

const COUNTDOWN_WINDOW_MINS = 480; // 8h window before trigger

function getProgress(habit: Habit): {pct: number; minsLeft: number; fired: boolean} {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const trigMins = habit.triggerHour * 60 + habit.triggerMinute;
  const minsToTrigger =
    trigMins >= nowMins ? trigMins - nowMins : 1440 - nowMins + trigMins;
  const pct =
    minsToTrigger < COUNTDOWN_WINDOW_MINS
      ? Math.max(0, 1 - minsToTrigger / COUNTDOWN_WINDOW_MINS)
      : 0;
  return {pct: Math.min(pct, 1), minsLeft: minsToTrigger, fired: pct >= 1};
}

function formatTimeLeft(minsLeft: number, fired: boolean): string {
  if (fired) return 'done';
  if (minsLeft < 60) return `${minsLeft}m`;
  const h = Math.floor(minsLeft / 60);
  const m = minsLeft % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function HabitCard({item}: {item: Habit}) {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const {pct, minsLeft, fired} = getProgress(item);
  const timeLabel = formatTimeLeft(minsLeft, fired);

  return (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('HabitDetail', {habitId: item.id})}>

      {/* Background progress wash */}
      <View
        style={[
          styles.progressWash,
          {opacity: fired ? 0.06 : pct * 0.10},
        ]}
      />

      {/* Bottom progress bar */}
      <View
        style={[
          styles.progressBar,
          {
            width: `${pct * 100}%` as any,
            backgroundColor: fired ? colors.accentDim : colors.accent,
            opacity: fired ? 0.4 : 0.7,
          },
        ]}
      />

      <View style={styles.timeBlock}>
        <Text style={[styles.itemTime, fired && styles.itemTimeFired]}>
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

      <View style={styles.itemTrailing}>
        <Text style={[styles.timeLabel, fired && styles.timeLabelFired]}>
          {timeLabel}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const habits = useHabitsStore(state => state.habits);
  const isLoading = useHabitsStore(state => state.isLoading);

  const renderItem = useCallback(
    ({item}: {item: Habit}) => <HabitCard item={item} />,
    [],
  );

  const handleAdd = () => navigation.navigate('AddEditHabit', {});
  const handleDev = () =>
    (navigation as any).getParent()?.navigate('SettingsTab');

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Wordmark header */}
      <View style={styles.header}>
        <View style={styles.wordmarkRow}>
          <Image
            source={require('@/assets/signal-mark.png')}
            style={styles.signalMark}
            resizeMode="contain"
          />
          <Image
            source={require('@/assets/wordmark.png')}
            style={styles.wordmark}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity onPress={handleAdd} activeOpacity={0.6} hitSlop={12}>
          <Text style={styles.addBtn}>＋</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No habits yet. Tap ＋ to add one.</Text>
        }
      />

      {/* Dev-only: hidden settings access */}
      <TouchableOpacity
        style={styles.devBtn}
        onPress={handleDev}
        activeOpacity={0.7}>
        <Text style={styles.devBtnText}>⚙ dev</Text>
      </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing[3],
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  signalMark: {
    width: 22,
    height: 22,
  },
  wordmark: {
    width: 110,
    height: 17,
  },
  addBtn: {
    fontFamily: font.light,
    fontSize: 22,
    color: colors.accent,
    lineHeight: 26,
  },
  list: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: 80,
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
    overflow: 'hidden',
    position: 'relative',
  },
  progressWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.accent,
    borderRadius: 10,
    pointerEvents: 'none',
  } as any,
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
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
  itemTimeFired: {
    color: colors.fg5,
  },
  itemFreq: {
    fontFamily: font.regular,
    fontSize: fontSize.micro,
    color: colors.fg6,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.base,
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
    fontFamily: font.mono,
    fontSize: fontSize.label,
    color: colors.fg5,
    marginTop: 3,
  },
  itemTrailing: {
    flexShrink: 0,
    alignItems: 'flex-end',
    gap: 4,
  },
  timeLabel: {
    fontFamily: font.mono,
    fontSize: fontSize.micro,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: letterSpacing.base,
  },
  timeLabelFired: {
    color: colors.fg6,
    opacity: 0.6,
  },
  chevron: {
    fontFamily: font.regular,
    fontSize: fontSize.body,
    color: colors.surface2,
  },
  empty: {
    fontFamily: font.regular,
    color: colors.fg6,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing[10],
  },
  devBtn: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(20,18,16,0.8)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  devBtnText: {
    fontFamily: font.mono,
    fontSize: 9,
    color: colors.fg6,
    letterSpacing: 0.5,
  },
});
