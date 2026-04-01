import {StackNavigationProp} from '@react-navigation/stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {CompositeNavigationProp} from '@react-navigation/native';

// Bottom tab param list
export type TabParamList = {
  HomeTab: undefined;
  SettingsTab: undefined;
};

// Stack param lists per tab
export type HomeStackParamList = {
  Home: undefined;
  HabitDetail: {habitId: string};
  AddEditHabit: {habitId?: string};
};

export type SettingsStackParamList = {
  Settings: undefined;
};

// Composed nav prop helpers for screens
export type HomeScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'Home'>,
  BottomTabNavigationProp<TabParamList>
>;

export type HabitDetailNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'HabitDetail'>,
  BottomTabNavigationProp<TabParamList>
>;

export type AddEditHabitNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'AddEditHabit'>,
  BottomTabNavigationProp<TabParamList>
>;

export type SettingsScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<SettingsStackParamList, 'Settings'>,
  BottomTabNavigationProp<TabParamList>
>;
