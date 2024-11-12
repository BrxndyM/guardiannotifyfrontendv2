import React, { useEffect, useState } from 'react';
import { Button, View, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;

  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    finalStatus = newStatus;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log(token); // Use this token to send push notifications or save for testing
  return token;
}

const TriggerAlertComponent = () => {
  const [alertTimeout, setAlertTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Register for notifications on mount
    registerForPushNotificationsAsync();

    // Clear any leftover timeout when unmounting
    return () => {
      if (alertTimeout) clearTimeout(alertTimeout);
    };
  }, [alertTimeout]);

  // Function to send notifications to close contacts
  const sendNotificationsToCloseContacts = async () => {
    console.log('Notifications sent to close contacts.');
  };

  // Schedule a local notification when a trigger sound is detected
  const handleTriggerSoundDetected = async () => {
    // Display a local notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Trigger Sound Detected",
        body: "A trigger sound has been detected from your device.",
        sound: true,
        categoryIdentifier: "triggerSound",
      },
      trigger: null, // Triggers immediately
    });

    // Set a timeout to send notifications to close contacts if no response
    const timeoutId = setTimeout(() => {
      sendNotificationsToCloseContacts();
    }, 30000);

    setAlertTimeout(timeoutId);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Simulate Trigger Sound" onPress={handleTriggerSoundDetected} />
    </View>
  );
};

export default TriggerAlertComponent;
