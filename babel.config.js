module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@/components': './src/components',
          '@/screens': './src/screens',
          '@/navigation': './src/navigation',
          '@/modules': './src/modules',
          '@/hooks': './src/hooks',
          '@/services': './src/services',
          '@/store': './src/store',
          '@/utils': './src/utils',
          '@/types': './src/types',
          '@/constants': './src/constants',
          '@/assets': './src/assets',
        },
      },
    ],
  ],
};
