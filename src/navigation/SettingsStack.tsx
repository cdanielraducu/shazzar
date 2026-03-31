import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {SettingsScreen} from '../screens/SettingsScreen';
import {SettingsStackParamList} from './types';

const Stack = createStackNavigator<SettingsStackParamList>();

export function SettingsStack(): JSX.Element {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
