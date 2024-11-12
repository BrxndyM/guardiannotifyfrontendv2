import { Audio } from 'expo-av';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const BACKGROUND_AUDIO_TASK = 'BACKGROUND_AUDIO_TASK';

// Define the background task
TaskManager.defineTask(BACKGROUND_AUDIO_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }

  try {
    // Keep the audio session active
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(recordingOptions);
    await recording.startAsync();

    console.log('Background audio recording started');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error('Failed in background task:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Define recording options
const recordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export const startBackgroundAudio = async () => {
  try {
    // Register the background fetch task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_AUDIO_TASK, {
      minimumInterval: 15 * 60, // Minimum interval in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    console.log('Background audio task registered');
  } catch (err) {
    console.error('Failed to start background audio:', err);
  }
};

export const stopBackgroundAudio = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_AUDIO_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_AUDIO_TASK);
      console.log('Background audio task unregistered');
    }
  } catch (err) {
    console.error('Failed to stop background audio:', err);
  }
};
