import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

// Import screens
import MapScreen from './MapScreen';
import ProfileScreen from './Profile'; // Ensure correct import path
import CloseContacts from './CloseContacts'; // Import the CloseContacts component
import ContinuousAudioListener from './RecordSound';

const Tab = createBottomTabNavigator();

const SoundScreen = () => (
  <View style={styles.screenContainer}>
    <Ionicons name="volume-high" size={50} color="#007AFF" />
  </View>
);

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Contacts') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Sound') {
            iconName = focused ? 'volume-high' : 'volume-low';
          } else if (route.name === 'Me') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen 
        name="Contacts" 
        component={CloseContacts} // Use CloseContacts component here
        options={{ tabBarLabel: 'Contacts' }}
      />
      <Tab.Screen 
        name="Sound" 
        component={ContinuousAudioListener}
        options={{ tabBarLabel: 'Sound' }}
      />
      <Tab.Screen 
        name="Me" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Me' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BottomTabNavigator;
