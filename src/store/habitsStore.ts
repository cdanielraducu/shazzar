import {create} from 'zustand';

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  completedToday: boolean;
}

interface HabitsStore {
  habits: Habit[];
  addHabit: (name: string, frequency: Habit['frequency']) => void;
  toggleHabit: (id: string) => void;
  removeHabit: (id: string) => void;
  editHabit: (id: string, name: string, frequency: Habit['frequency']) => void;
}

export const useHabitsStore = create<HabitsStore>(set => ({
  habits: [],
  addHabit: (name, frequency) =>
    set(state => ({
      habits: [
        ...state.habits,
        {id: Date.now().toString(), name, frequency, completedToday: false},
      ],
    })),
  toggleHabit: id =>
    set(state => ({
      habits: state.habits.map(h =>
        h.id === id ? {...h, completedToday: !h.completedToday} : h,
      ),
    })),
  removeHabit: id =>
    set(state => ({habits: state.habits.filter(h => h.id !== id)})),
  editHabit: (id, name, frequency) =>
    set(state => ({
      habits: state.habits.map(h =>
        h.id === id ? {...h, name, frequency} : h,
      ),
    })),
}));
