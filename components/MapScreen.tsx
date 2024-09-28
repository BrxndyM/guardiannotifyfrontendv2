 import React, { useEffect, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { Platform, StyleSheet, View, Dimensions } from 'react-native';
import * as Location from 'expo-location';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    if (Platform.OS === 'ios') {
      checkLocationServicesIOS();
    } else {
      checkLocationServicesAndroid();
    }
  }, []);

  const checkLocationServicesIOS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
    } else {
      startTrackingLocation();
    }
  };

  const checkLocationServicesAndroid = async () => {
    try {
      const androidVersion = parseInt(Platform.Version.toString(), 10);
      if (androidVersion >= 23) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Permission to access location was denied');
        } else {
          startTrackingLocation();
        }
      } else {
        startTrackingLocation();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const startTrackingLocation = async () => {
    let subscription: Location.LocationSubscription | undefined;
    try {
      subscription = await Location.watchPositionAsync(
        { distanceInterval: 1000 },
        (newLocation) => {
          setLocation(newLocation);
          setMapRegion({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }
      );

      return () => {
        if (subscription) {
          subscription.remove();
        }
      };
    } catch (error) {
      console.error("Error starting location watch:", error);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        followsUserLocation={true}
        showsUserLocation={true}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Current Location"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: Dimensions.get('window').height,
  },
});
