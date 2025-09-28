import { registerRootComponent } from 'expo';
import React from 'react';
import App from './App';
import { ThemeProvider } from './src/theme/ThemeProvider';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
function Root() {
  return React.createElement(ThemeProvider, null, React.createElement(App, null));
}

registerRootComponent(Root as any);
