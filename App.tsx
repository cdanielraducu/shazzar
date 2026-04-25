import React from 'react';
import {NavigationContainer, LinkingOptions} from '@react-navigation/native';
import {RootNavigator} from '@/navigation';
import {initDatabase} from '@/modules/SQLite/db';
import {useHabitsStore} from '@/store/habitsStore';
import {TabParamList} from '@/navigation/types';

// Creates tables, purges soft-deleted rows, then loads persisted habits into the store.
initDatabase();
useHabitsStore.getState().initialize();

const linking: LinkingOptions<TabParamList> = {
  prefixes: ['shazzar://'],
  config: {
    screens: {
      HomeTab: {
        screens: {
          HabitDetail: 'habit/:habitId',
        },
      },
    },
  },
};

function App(): React.JSX.Element {
  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default App;
