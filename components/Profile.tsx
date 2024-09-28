import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  surname: string;
  emailAddress: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  gender: number;
  genderName: string;
  idNumber: string;
  userId: number;
  userName: string;
}

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [editableUser, setEditableUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      console.log("Retrieved userId:", userId);
      if (!userId) {
        throw new Error('User ID not found in local storage');
      }
      const response = await fetch(`https://3ef2-41-57-177-2.ngrok-free.app/api/services/app/Person/GetPersonByUserId?userId=${userId}`);
      console.log("Response Status:", response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      console.log("Fetched User Data:", data?.result);
      setUser(data.result);
      setEditableUser(data.result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleChange = (field: keyof User, value: string) => {
    setEditableUser(prevState => prevState ? {
      ...prevState,
      [field]: value,
    } : null);
  };

  const saveChanges = async () => {
    if (editableUser) {
      try {
        const response = await fetch(`https://3ef2-41-57-177-2.ngrok-free.app/api/services/app/Person/UpdatePerson`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editableUser),
        });
        if (!response.ok) {
          throw new Error('Failed to save changes');
        }
        const updatedUser = await response.json();
        setUser(updatedUser.result);
        setIsEditing(false);
        Alert.alert('Success', 'Changes saved successfully');
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      }
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    Alert.alert('Error', error);
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView>
          {isEditing ? (
            <View>
              <Text style={styles.label}>Name:</Text>
              <TextInput
                style={styles.input}
                value={editableUser?.name || ''}
                onChangeText={(value) => handleChange('name', value)}
              />
              <Text style={styles.label}>Surname:</Text>
              <TextInput
                style={styles.input}
                value={editableUser?.surname || ''}
                onChangeText={(value) => handleChange('surname', value)}
              />
              <Text style={styles.label}>Email:</Text>
              <TextInput
                style={styles.input}
                value={editableUser?.emailAddress || ''}
                onChangeText={(value) => handleChange('emailAddress', value)}
                keyboardType="email-address"
              />
              <Text style={styles.label}>Phone:</Text>
              <TextInput
                style={styles.input}
                value={editableUser?.phoneNumber || ''}
                onChangeText={(value) => handleChange('phoneNumber', value)}
                keyboardType="phone-pad"
              />
              <Text style={styles.label}>Address:</Text>
              <TextInput
                style={styles.input}
                value={editableUser?.address || ''}
                onChangeText={(value) => handleChange('address', value)}
              />
              <Button title="Save" onPress={saveChanges} />
            </View>
          ) : (
            <View>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.text}>{user?.name} {user?.surname}</Text>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.text}>{user?.emailAddress}</Text>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.text}>{user?.phoneNumber}</Text>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.text}>{user?.address}</Text>
              <Text style={styles.label}>Date of Birth:</Text>
              <Text style={styles.text}>{new Date(user?.dateOfBirth || '').toLocaleDateString()}</Text>
              <Text style={styles.label}>Gender:</Text>
              <Text style={styles.text}>{user?.genderName}</Text>
              <Button title="Edit" onPress={() => setIsEditing(true)} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    fontSize: 16,
    borderRadius: 5,
    marginBottom: 10,
  },
});