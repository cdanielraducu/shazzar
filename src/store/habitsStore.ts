import {create} from 'zustand';
import {
  getLiveHabits,
  insertHabit,
  updateHabit,
  softDeleteHabit,
} from '@/modules/SQLite/db';
import {
  scheduleHabitNotification,
  cancelHabitNotification,
} from '@/utils/notificationScheduler';

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  triggerHour: number;
  triggerMinute: number;
  dataSource: string;
}

interface HabitsStore {
  habits: Habit[];
  isLoading: boolean;
  initialize: () => Promise<void>;
  addHabit: (
    name: string,
    frequency: Habit['frequency'],
    triggerHour: number,
    triggerMinute: number,
    dataSource: string,
  ) => void;
  removeHabit: (id: string) => void;
  editHabit: (
    id: string,
    name: string,
    frequency: Habit['frequency'],
    triggerHour: number,
    triggerMinute: number,
    dataSource: string,
  ) => void;
}

export const useHabitsStore = create<HabitsStore>((set, get) => ({
  habits: [],
  isLoading: true,

  initialize: async () => {
    const habits = await getLiveHabits();
    set({habits, isLoading: false});
  },

  addHabit: (name, frequency, triggerHour, triggerMinute, dataSource) => {
    const habit: Habit = {
      id: Date.now().toString(),
      name,
      frequency,
      triggerHour,
      triggerMinute,
      dataSource,
    };
    set(state => ({habits: [...state.habits, habit]}));
    insertHabit(habit).catch(e => console.error('[db] insertHabit failed', e));
    scheduleHabitNotification(habit);
  },

  removeHabit: id => {
    set(state => ({habits: state.habits.filter(h => h.id !== id)}));
    softDeleteHabit(id).catch(e => console.error('[db] softDeleteHabit failed', e));
    cancelHabitNotification(id);
  },

  editHabit: (id, name, frequency, triggerHour, triggerMinute, dataSource) => {
    set(state => ({
      habits: state.habits.map(h =>
        h.id === id
          ? {...h, name, frequency, triggerHour, triggerMinute, dataSource}
          : h,
      ),
    }));
    const habit = get().habits.find(h => h.id === id);
    if (habit) {
      updateHabit(habit).catch(e => console.error('[db] updateHabit failed', e));
      scheduleHabitNotification(habit);
    }
  },
}));
