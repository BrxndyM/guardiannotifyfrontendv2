import React, { useState, useEffect, useRef } from 'react'; 
import { View, Text, Alert, AppState, AppStateStatus, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { SoundLevelDetector } from './HighFrequencyDetector';

const SoundMonitor: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [recordingCount, setRecordingCount] = useState<number>(0);
  const detector = useRef<SoundLevelDetector | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    setupAudioMonitoring();
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      stopMonitoring();
    };
  }, []);

  const setupAudioMonitoring = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access the microphone');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      if (!detector.current) {
        detector.current = new SoundLevelDetector();
        await detector.current.calibrate();
      }
      
      startMonitoring();
    } catch (err) {
      console.error('Failed to setup audio monitoring:', err);
      Alert.alert('Error', 'Failed to setup audio monitoring');
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      // App is going to background
      stopMonitoring();
    } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App is coming to foreground
      startMonitoring();
    }
    appState.current = nextAppState;
  };

  const startMonitoring = async () => {
    if (!detector.current || isMonitoring) return;
    
    setIsMonitoring(true);
    while (isMonitoring) {
      try {
        const isLoud = await detector.current.checkSoundLevel();
        if (isLoud) {
          await handleLoudSound();
          // Cool-down period after recording
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error('Error in monitoring loop:', error);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const handleLoudSound = async () => {
    if (!detector.current) return;
    
    try {
      await detector.current.startRecording();
      // Record for 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      const base64Data = await detector.current.stopRecording();
      
      setRecordingCount(prev => prev + 1);
      console.log('Recorded sound clip, length:', base64Data.length);
    } catch (error) {
      console.error('Error recording sound:', error);
    }
  };

  const stopMonitoring = async () => {
    setIsMonitoring(false);
    if (detector.current) {
      await detector.current.stopRecording(); // Stop any ongoing recording
      //await detector.current.unloadAsync();   // Unload to release resources
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sound Level Monitor</Text>
      <Text style={styles.status}>
        Status: {isMonitoring ? 'Monitoring' : 'Inactive'}
      </Text>
      <Text style={styles.recordings}>
        Recordings: {recordingCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    marginBottom: 10,
  },
  recordings: {
    fontSize: 16,
  },
});

export default SoundMonitor;
