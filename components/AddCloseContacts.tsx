import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
import axios from 'axios';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AddCloseContactProps {
  isVisible: boolean;
  onClose: () => void;
  onContactAdded: () => void;
}

const AddCloseContact: React.FC<AddCloseContactProps> = ({ isVisible, onClose, onContactAdded }) => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [cellNumber, setCellNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          setAccessToken(token);
        } else {
          console.log('No access token found');
          Alert.alert('Error', 'User not logged in. Please log in again.');
          // You might want to navigate to the login screen here
        }
      } catch (error) {
        console.error('Failed to fetch access token', error);
        Alert.alert('Error', 'Failed to authenticate user');
      }
    };

    fetchAccessToken();
  }, [isVisible]); // Re-run when modal becomes visible

  const handleSaveContact = async () => {
    if (!name || !surname || !cellNumber || !emailAddress) {
      Alert.alert('Error', 'Please fill out all fields');
      return;
    }

    if (!accessToken) {
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      return;
    }

    const newContact = {
      name,
      surname,
      cellNumber,
      emailAddress
    };

    try {
      const response = await axios.post(
        'https://3ef2-41-57-177-2.ngrok-free.app/api/services/app/CloseContact/Create',
        newContact,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('API Response:', response.data);

      Alert.alert('Success', 'Contact saved successfully');
      resetForm();
      onContactAdded();
    } catch (error) {
      console.error('Failed to save contact', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error response:', error.response.data);
        Alert.alert('Error', `Failed to save contact: ${error.response.data.error?.message || 'Unknown error'}`);
      } else {
        Alert.alert('Error', 'Failed to save contact. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setName('');
    setSurname('');
    setCellNumber('');
    setEmailAddress('');
  };

  const handleSelectContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });

        if (data.length > 0) {
          const contact = data[0]; // Get the first contact for simplicity
          setName(contact.firstName || '');
          setSurname(contact.lastName || '');
          setCellNumber(contact.phoneNumbers?.[0]?.number || '');
          setEmailAddress(contact.emails?.[0]?.email || '');
        } else {
          Alert.alert('No Contacts', 'No contacts found on your device.');
        }
      } else {
        Alert.alert('Permission required', 'You need to grant permission to access contacts.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch contacts.');
      console.error(error);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Button title="Select from Contacts" onPress={handleSelectContacts} color="#007bff" />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter Name"
              />

              <Text style={styles.label}>Surname</Text>
              <TextInput
                style={styles.input}
                value={surname}
                onChangeText={setSurname}
                placeholder="Enter Surname"
              />

              <Text style={styles.label}>Cell Number</Text>
              <TextInput
                style={styles.input}
                value={cellNumber}
                onChangeText={setCellNumber}
                placeholder="Enter Cell Number"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={emailAddress}
                onChangeText={setEmailAddress}
                placeholder="Enter Email Address"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button title="Save Contact" onPress={handleSaveContact} />
              <Button title="Close" onPress={onClose} color="#ff3b30" />
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default AddCloseContact;