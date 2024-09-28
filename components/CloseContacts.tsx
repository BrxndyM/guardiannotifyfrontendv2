import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, TouchableWithoutFeedback, Keyboard } from 'react-native';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddCloseContact from './AddCloseContacts';

type ContactsStackParamList = {
  CloseContacts: undefined;
  AddCloseContact: undefined;
};

type CloseContactsNavigationProp = StackNavigationProp<ContactsStackParamList, 'CloseContacts'>;

interface Contact {
  id: string;
  name: string;
  surname: string;
  cellNumber: string;
  emailAddress: string;
}

const CloseContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const navigation = useNavigation<CloseContactsNavigationProp>();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await axios.get(`https://3ef2-41-57-177-2.ngrok-free.app/api/services/app/CloseContact/GetAllByUserId?userId=${userId}`);
        setContacts(response.data.result);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load contacts');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, [])
  );

  useEffect(() => {
    fetchAccessToken();
  }, []);
  
  useEffect(() => {
    if (accessToken) {
      fetchContacts();
    }
  }, [accessToken]);

  const handleExpand = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDetailModalVisible(true);
    setIsEditMode(false);
  };

  const fetchAccessToken = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      setAccessToken(token);
    } catch (error) {
      console.error('Failed to fetch access token', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`https://3ef2-41-57-177-2.ngrok-free.app/api/services/app/CloseContact/Delete?id=${id}`);
      fetchContacts();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete contact');
    }
  };

  const handleAddContact = () => {
    setIsAddModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsAddModalVisible(false);
    setIsDetailModalVisible(false);
    setSelectedContact(null);
    setIsEditMode(false);
    fetchContacts();
  };

  const handleUpdateContact = async () => {
    if (!selectedContact || !accessToken) {
      Alert.alert('Error', 'Unable to update contact. Missing information.');
      return;
    }
  
    try {
      // Fetch the stored userId from AsyncStorage
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User ID not found.');
        return;
      }
  
      // Fetch the personId using the userId
      const personResponse = await axios.get(`https://3ef2-41-57-177-2.ngrok-free.app/api/services/app/Person/GetPersonByUserId?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
  
      const personId = personResponse.data.result.id; // Assuming the response contains the personId in `result.id`
  
      // Validate if personId is a valid GUID
      const isValidGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(personId);
      if (!isValidGuid) {
        Alert.alert('Error', 'Invalid person ID format.');
        return;
      }
  
      // Prepare the updated contact data
      const updatedContact = {
        ...selectedContact,
        personId: personId  // Ensure the personId is correctly assigned
      };
  
      // Send the update request
      const updateResponse = await axios.put(
        `https://3ef2-41-57-177-2.ngrok-free.app/api/services/app/CloseContact/Update`,
        updatedContact,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      console.log('Update response:', updateResponse.data);
      setIsEditMode(false);
      fetchContacts();
      Alert.alert('Success', 'Contact updated successfully');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('Axios error:', err.response?.data || err.message);
        Alert.alert('Error', `Failed to update contact: ${err.response?.data?.error?.message || err.message}`);
      } else {
        console.error('Error updating contact:', err);
        Alert.alert('Error', 'An unexpected error occurred while updating the contact');
      }
    }
  };
  

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.addIconContainer} onPress={handleAddContact}>
          <Ionicons name="add-circle-outline" size={30} color="blue" />
          <Text style={styles.addIconText}>Add New Contact</Text>
        </TouchableOpacity>
        {contacts.length === 0 ? (
          <Text style={styles.emptyMessage}>Your close contacts list is empty.</Text>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <View style={styles.cardContent}>
                  <View>
                    <Text style={styles.contactName}>{`${item.name} ${item.surname}`}</Text>
                  </View>
                  <View style={styles.iconContainer}>
                    <TouchableOpacity onPress={() => handleExpand(item)}>
                      <Ionicons name="expand-outline" size={24} color="blue" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Ionicons name="trash-outline" size={24} color="red" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            )}
          />
        )}
        {isAddModalVisible && (
          <AddCloseContact
            isVisible={isAddModalVisible}
            onClose={handleCloseModal}
            onContactAdded={handleCloseModal}
          />
        )}
        <Modal
          visible={isDetailModalVisible}
          animationType="slide"
          onRequestClose={handleCloseModal}
          transparent={true}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isEditMode ? 'Edit Contact' : 'Contact Details'}
                  </Text>
                  <TouchableOpacity onPress={toggleEditMode}>
                    <Ionicons name={isEditMode ? "close-outline" : "create-outline"} size={24} color="blue" />
                  </TouchableOpacity>
                </View>
                {isEditMode ? (
                  <>
                    <TextInput
                      style={styles.input}
                      value={selectedContact?.name}
                      onChangeText={(text) => setSelectedContact(prev => prev ? {...prev, name: text} : null)}
                      placeholder="Name"
                    />
                    <TextInput
                      style={styles.input}
                      value={selectedContact?.surname}
                      onChangeText={(text) => setSelectedContact(prev => prev ? {...prev, surname: text} : null)}
                      placeholder="Surname"
                    />
                    <TextInput
                      style={styles.input}
                      value={selectedContact?.cellNumber}
                      onChangeText={(text) => setSelectedContact(prev => prev ? {...prev, cellNumber: text} : null)}
                      placeholder="Cell Number"
                      keyboardType="phone-pad"
                    />
                    <TextInput
                      style={styles.input}
                      value={selectedContact?.emailAddress}
                      onChangeText={(text) => setSelectedContact(prev => prev ? {...prev, emailAddress: text} : null)}
                      placeholder="Email Address"
                      keyboardType="email-address"
                    />
                    <TouchableOpacity style={styles.button} onPress={handleUpdateContact}>
                      <Text style={styles.buttonText}>Update</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.detailText}>Name: {selectedContact?.name}</Text>
                    <Text style={styles.detailText}>Surname: {selectedContact?.surname}</Text>
                    <Text style={styles.detailText}>Cell Number: {selectedContact?.cellNumber}</Text>
                    <Text style={styles.detailText}>Email: {selectedContact?.emailAddress}</Text>
                  </>
                )}
                <TouchableOpacity style={styles.button} onPress={handleCloseModal}>
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  emptyMessage: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  addIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  addIconText: {
    marginLeft: 8,
    fontSize: 16,
    color: 'blue',
  },
  card: {
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconContainer: {
    flexDirection: 'row',
    width: 60,
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  detailText: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default CloseContacts;
