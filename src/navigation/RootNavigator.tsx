import React from 'react';
import {TouchableOpacity, View, StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {HomeStack} from './HomeStack';
import {SettingsStack} from './SettingsStack';
import {TabParamList} from './types';
import {colors, spacing} from '@/theme';

const Tab = createBottomTabNavigator<TabParamList>();

function HabitsTabIcon({active}: {active: boolean}) {
  const lineStyle = {backgroundColor: active ? colors.accent : colors.fg5};
  return (
    <View style={styles.svgIcon}>
      <View style={[styles.line, styles.lineLg, lineStyle]} />
      <View style={[styles.line, styles.lineLg, styles.lineGap, lineStyle]} />
      <View style={[styles.line, styles.lineSm, styles.lineGap, lineStyle]} />
    </View>
  );
}

function SettingsTabIcon({active}: {active: boolean}) {
  const ringStyle = {borderColor: active ? colors.accent : colors.fg5};
  return (
    <View style={styles.svgIcon}>
      <View style={[styles.gearOuter, ringStyle]}>
        <View style={[styles.gearInner, ringStyle]} />
      </View>
    </View>
  );
}

function PlusIcon() {
  return (
    <View style={styles.plusIcon}>
      <View style={[styles.plusBar, styles.plusH]} />
      <View style={[styles.plusBar, styles.plusV]} />
    </View>
  );
}

function CustomTabBar({state, navigation}: BottomTabBarProps) {
  const isHabitsActive = state.index === 0;
  const isSettingsActive = state.index === 1;

  const handleAdd = () => {
    (navigation as any).navigate('HomeTab', {
      screen: 'AddEditHabit',
      params: {},
    });
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.pill}>
        <TouchableOpacity
          style={[styles.tabItem, isHabitsActive && styles.tabItemActive]}
          onPress={() => navigation.navigate('HomeTab')}
          activeOpacity={0.7}>
          <HabitsTabIcon active={isHabitsActive} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          activeOpacity={0.8}>
          <View style={styles.addInner}>
            <PlusIcon />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, isSettingsActive && styles.tabItemActive]}
          onPress={() => navigation.navigate('SettingsTab')}
          activeOpacity={0.7}>
          <SettingsTabIcon active={isSettingsActive} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function RootNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      tabBar={CustomTabBar}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="SettingsTab" component={SettingsStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: spacing[4],
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderRadius: 32,
    paddingVertical: spacing[1] + 2,
    paddingHorizontal: spacing[2],
    borderWidth: 1,
    borderColor: colors.borderActive,
    gap: spacing[1],
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  tabItem: {
    paddingVertical: spacing[1] + 2,
    paddingHorizontal: spacing[4],
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: colors.accentBg,
  },
  addButton: {
    marginHorizontal: spacing[1],
  },
  addInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  svgIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
  },
  line: {
    height: 1.5,
    borderRadius: 1,
  },
  lineLg: {
    width: 16,
  },
  lineSm: {
    width: 10,
  },
  lineGap: {
    marginTop: 4,
  },
  gearOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  plusIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBar: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  plusH: {
    width: 14,
    height: 2,
  },
  plusV: {
    width: 2,
    height: 14,
  },
});
