import React from 'react';
import {NavigationContainer, LinkingOptions} from '@react-navigation/native';
import {Provider} from 'react-redux';
import {store} from '@/store';
import {RootNavigator} from '@/navigation';
import {initDatabase} from '@/modules/SQLite/db';
import {TabParamList} from '@/navigation/types';

// Creates tables and purges soft-deleted rows older than 30 days on every startup.
initDatabase();

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
    <Provider store={store}>
      <NavigationContainer linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </Provider>
  );
}

export default App;
