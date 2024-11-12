import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class SoundLevelDetector {
  static readonly SAMPLE_RATE = 44100;
  static readonly BUFFER_SIZE = 1024;
  static readonly THRESHOLD_MULTIPLIER = 1.5; // How much louder than baseline to trigger
  static readonly CALIBRATION_DURATION = 2000; // 3 seconds to establish baseline
  
  private baselineLevel: number = 0;
  private isCalibrated: boolean = false;
  private recording: Audio.Recording | null = null;

  async calibrate(): Promise<void> {
    const samples: number[] = [];
    const startTime = Date.now();
    
    while (Date.now() - startTime < SoundLevelDetector.CALIBRATION_DURATION) {
      const level = await this.getCurrentSoundLevel();
      samples.push(level);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculate baseline as the average of samples
    this.baselineLevel = samples.reduce((a, b) => a + b, 0) / samples.length;
    this.isCalibrated = true;
    
    console.log(`Calibrated baseline level: ${this.baselineLevel}`);
  }

  private async getCurrentSoundLevel(): Promise<number> {
    const recording = new Audio.Recording();
    try {
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: 2,
          audioEncoder: 3,
          sampleRate: SoundLevelDetector.SAMPLE_RATE,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: 69,
          sampleRate: SoundLevelDetector.SAMPLE_RATE,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      await recording.startAsync();
      await new Promise(resolve => setTimeout(resolve, 100)); // Sample for 100ms
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      if (!uri) throw new Error('No recording URI');
      
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to array of bytes
      const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Skip WAV header (44 bytes) and convert to 16-bit samples
      const samples = new Int16Array(bytes.buffer, 44);
      
      // Calculate RMS (Root Mean Square) amplitude
      let sum = 0;
      for (let i = 0; i < samples.length; i++) {
        sum += samples[i] * samples[i];
      }
      const rms = Math.sqrt(sum / samples.length);
      
      // Normalize to 0-1 range
      const normalizedLevel = rms / 32768; // 32768 is max value for 16-bit audio
      
      return normalizedLevel;
    } catch (error) {
      console.error('Error measuring sound level:', error);
      return 0;
    }
  }

  async checkSoundLevel(): Promise<boolean> {
    if (!this.isCalibrated) {
      await this.calibrate();
    }
    
    const currentLevel = await this.getCurrentSoundLevel();
    return currentLevel > (this.baselineLevel * SoundLevelDetector.THRESHOLD_MULTIPLIER);
  }

  async startRecording(): Promise<void> {
    if (this.recording) {
      console.log('Already recording');
      return;
    }

    this.recording = new Audio.Recording();
    try {
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: 2,
          audioEncoder: 3,
          sampleRate: SoundLevelDetector.SAMPLE_RATE,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: 96,
          sampleRate: SoundLevelDetector.SAMPLE_RATE,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      await this.recording.startAsync();
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.recording = null;
      throw error;
    }
  }

  async stopRecording(): Promise<string> {
    if (!this.recording) {
      throw new Error('No active recording');
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      if (!uri) throw new Error('No recording URI');

      // Convert to base64
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Save to AsyncStorage
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem(
        `recording_${timestamp}`,
        JSON.stringify({
          timestamp,
          data: base64Data,
          duration: await this.recording.getStatusAsync()
            .then(status => status.durationMillis || 0),
        })
      );

      return base64Data;
    } finally {
      this.recording = null;
    }
  }
}   