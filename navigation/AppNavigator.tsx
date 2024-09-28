import BottomTabNavigator from "../components/BottomTabNavigator";
import CloseContacts from "../components/CloseContacts";
import LoginScreen from "../components/Login";
import MapScreen from "../components/MapScreen";
import RegisterScreen from "../components/Register";
import WelcomeScreen from "../components/WelcomePage";
import { createNativeStackNavigator } from '@react-navigation/native-stack';


// Export the RootStackParamList type
export type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    Register: undefined;
    Map: undefined;
    Bottom: undefined;
    Contacts : undefined;
  };
  
  const Stack = createNativeStackNavigator<RootStackParamList>();
  
  export default function AppNavigator() {
    return (
   
        <Stack.Navigator initialRouteName="Welcome">
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="Bottom" component={BottomTabNavigator} />
          <Stack.Screen name="Contacts" component={CloseContacts} />
        </Stack.Navigator>
  
    );
  }