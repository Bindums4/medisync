import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/AuthContext';
import { C } from './src/config';
import s from './src/styles';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import DoctorsScreen from './src/screens/DoctorsScreen';
import DoctorDetailScreen from './src/screens/DoctorDetailScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import AppointmentScreen from './src/screens/AppointmentScreen';
import HealthScreen from './src/screens/HealthScreen';
import SymptomsScreen from './src/screens/SymptomsScreen';
import DoctorHomeScreen from './src/screens/DoctorHomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const icon = (e) => ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{e}</Text>;
const opts = { tabBarActiveTintColor: C.brand, headerTitleStyle: { fontWeight: '800' } };

function PatientTabs() {
  return (
    <Tab.Navigator screenOptions={opts}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: icon('🏠'), title: 'MediSync' }} />
      <Tab.Screen name="Doctors" component={DoctorsScreen} options={{ tabBarIcon: icon('🩺'), title: 'Find doctors' }} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ tabBarIcon: icon('📅') }} />
      <Tab.Screen name="Health" component={HealthScreen} options={{ tabBarIcon: icon('📈') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: icon('🙂') }} />
    </Tab.Navigator>
  );
}

function DoctorTabs() {
  return (
    <Tab.Navigator screenOptions={opts}>
      <Tab.Screen name="Today" component={DoctorHomeScreen} options={{ tabBarIcon: icon('🏠'), title: 'My practice' }} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ tabBarIcon: icon('📅') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: icon('🙂') }} />
    </Tab.Navigator>
  );
}

function Root() {
  const { user, loading, logout } = useAuth();
  if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={C.brand} /></View>;
  if (!user) return <LoginScreen />;
  if (user.role === 'admin') {
    return (
      <View style={[s.screen, { justifyContent: 'center', padding: 30, gap: 14 }]}>
        <Text style={s.h1}>Admin tools are on the web</Text>
        <Text style={s.muted}>Open the MediSync website to approve doctors, view analytics and manage users.</Text>
        <TouchableOpacity style={s.btn} onPress={logout}><Text style={s.btnText}>Log out</Text></TouchableOpacity>
      </View>
    );
  }
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={user.role === 'doctor' ? DoctorTabs : PatientTabs} options={{ headerShown: false }} />
        <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} options={{ title: 'Doctor' }} />
        <Stack.Screen name="Appointment" component={AppointmentScreen} options={{ title: 'Appointment' }} />
        <Stack.Screen name="Symptoms" component={SymptomsScreen} options={{ title: 'Symptom checker' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return <AuthProvider><StatusBar style="dark" /><Root /></AuthProvider>;
}
