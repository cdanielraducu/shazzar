import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HomeStack} from './HomeStack';
import {SettingsStack} from './SettingsStack';
import {TabParamList} from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function RootNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      tabBar={() => null}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="SettingsTab" component={SettingsStack} />
    </Tab.Navigator>
  );
}
