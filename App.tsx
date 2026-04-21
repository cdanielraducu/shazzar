import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {Provider} from 'react-redux';
import {store} from '@/store';
import {RootNavigator} from '@/navigation';
import {initDatabase} from '@/modules/SQLite/db';

// Creates tables and purges soft-deleted rows older than 30 days on every startup.
initDatabase();

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </Provider>
  );
}

export default App;
