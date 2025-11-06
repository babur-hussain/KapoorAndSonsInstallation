import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import BookingFormScreen from '../screens/BookingFormScreen';

export type RootStackParamList = {
  Home: undefined;
  BookingForm: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3498db',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Kapoor & Sons' }}
        />
        <Stack.Screen 
          name="BookingForm" 
          component={BookingFormScreen}
          options={{ title: 'Book Demo' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

