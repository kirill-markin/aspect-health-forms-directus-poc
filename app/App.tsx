import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Text } from './src/components/ui';

import HomeScreen from './src/screens/HomeScreen';
import DemoFormScreen from './src/screens/DemoFormScreen';
import SuccessScreen from './src/screens/SuccessScreen';

export type RootStackParamList = {
  Home: undefined;
  DemoForm: { formSlug: string };
  Success: { exitKey?: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: true,
            headerStyle: {
              backgroundColor: '#FF6B9D',
              elevation: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              title: 'Aspect Health Forms',
            }}
          />
          <Stack.Screen 
            name="DemoForm" 
            component={DemoFormScreen}
            options={({ navigation }) => ({
              headerTitle: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Home')}
                  style={{ alignItems: 'center' }}
                >
                  <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 18 }}>
                    Health Survey
                  </Text>
                </TouchableOpacity>
              ),
              headerLeft: () => null, // Disable back button during form
            })}
          />
          <Stack.Screen 
            name="Success" 
            component={SuccessScreen}
            options={({ navigation }) => ({
              headerTitle: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Home')}
                  style={{ alignItems: 'center' }}
                >
                  <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 18 }}>
                    Complete
                  </Text>
                </TouchableOpacity>
              ),
              headerLeft: () => null, // Disable back button on success screen
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
} 