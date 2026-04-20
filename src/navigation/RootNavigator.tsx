import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import {HomeStack} from './HomeStack';
import {SettingsStack} from './SettingsStack';
import {TabParamList} from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function RootNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: '#222222',
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#555555',
        tabBarIcon: () => {
          const icon = route.name === 'HomeTab' ? '⬡' : '⚙';
          return <Text style={{fontSize: 18}}>{icon}</Text>;
        },
        tabBarLabel: route.name === 'HomeTab' ? 'Home' : 'Settings',
      })}>
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="SettingsTab" component={SettingsStack} />
    </Tab.Navigator>
  );
}
