import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {HomeScreen} from '../screens/HomeScreen';
import {HabitDetailScreen} from '../screens/HabitDetailScreen';
import {AddEditHabitScreen} from '../screens/AddEditHabitScreen';
import {HomeStackParamList} from './types';

const Stack = createStackNavigator<HomeStackParamList>();

export function HomeStack(): JSX.Element {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
      <Stack.Screen name="AddEditHabit" component={AddEditHabitScreen} />
    </Stack.Navigator>
  );
}
