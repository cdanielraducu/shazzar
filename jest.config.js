module.exports = {
  preset: 'react-native',
  setupFiles: ['./jestSetup.ts'],
  fakeTimers: {enableGlobally: true},
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-gesture-handler|react-native-screens|react-native-safe-area-context)/)',
  ],
};
