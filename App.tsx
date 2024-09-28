import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import LocationScreen from './components/MapScreen';
import MapScreen from './components/MapScreen';

export default function App() {
  return (
     <NavigationContainer>
     <AppNavigator />
     </NavigationContainer>
    //<MapScreen />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
