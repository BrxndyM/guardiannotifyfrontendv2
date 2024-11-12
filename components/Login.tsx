import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Text, View } from './Themed';  // Assuming Themed is handling the dark/light theme switching
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Map: undefined;
  Bottom: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

export default function LoginScreen({ navigation }: Props) {
  const [userNameOrEmailAddress, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('https://9121-41-57-177-2.ngrok-free.app/api/TokenAuth/Authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userNameOrEmailAddress, password }),
      });

      const data = await response.json();

      if (response.ok && data.result && data.result.accessToken) {
        const accessToken = data.result.accessToken;
        await AsyncStorage.setItem('accessToken', accessToken);

        // Fetch current user information
        const userResponse = await fetch('https://9121-41-57-177-2.ngrok-free.app/api/services/app/Session/GetCurrentLoginInformations', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        const userData = await userResponse.json();

        if (userResponse.ok && userData.result && userData.result.user) {
          const userId = userData.result.user.id;
          await AsyncStorage.setItem('userId', userId.toString());
          console.log("user id ", userId);

          // Store the entire user object for easy access
          await AsyncStorage.setItem('userInfo', JSON.stringify(userData.result.user));

          Alert.alert('Success', 'Logged in successfully');
          navigation.navigate('Bottom');
        } else {
          Alert.alert('Error', 'Failed to fetch user information');
        }
      } else {
        Alert.alert('Error', data.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={userNameOrEmailAddress}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    color: '#000',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#4a90e2',
    marginTop: 15,
  },
});