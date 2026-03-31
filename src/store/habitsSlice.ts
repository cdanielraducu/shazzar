import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  completedToday: boolean;
}

interface HabitsState {
  items: Habit[];
}

const initialState: HabitsState = {
  items: [],
};

const habitsSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    addHabit(
      state,
      action: PayloadAction<{name: string; frequency: Habit['frequency']}>,
    ) {
      state.items.push({
        id: Date.now().toString(),
        name: action.payload.name,
        frequency: action.payload.frequency,
        completedToday: false,
      });
    },
    toggleHabit(state, action: PayloadAction<string>) {
      const habit = state.items.find(h => h.id === action.payload);
      if (habit) {
        habit.completedToday = !habit.completedToday;
      }
    },
    removeHabit(state, action: PayloadAction<string>) {
      state.items = state.items.filter(h => h.id !== action.payload);
    },
  },
});

export const {addHabit, toggleHabit, removeHabit} = habitsSlice.actions;
export default habitsSlice.reducer;
