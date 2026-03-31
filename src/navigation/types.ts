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
};

export type SettingsStackParamList = {
  Settings: undefined;
};

// Composed nav prop helpers for screens
export type HomeScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'Home'>,
  BottomTabNavigationProp<TabParamList>
>;

export type SettingsScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<SettingsStackParamList, 'Settings'>,
  BottomTabNavigationProp<TabParamList>
>;
