import React from 'react';
import { Platform, useWindowDimensions, Linking } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import ChurchSelector from '../screens/ChurchSelector';
import HomeScreen from '../screens/HomeScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';
import TeamScreen from '../screens/TeamScreen';
import SongsScreen from '../screens/SongsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import CreateServiceScreen from '../screens/CreateServiceScreen';
import AddSongScreen from '../screens/AddSongScreen';
import InviteUserScreen from '../screens/InviteUserScreen';
import TemplateListScreen from '../screens/TemplateListScreen';
import CreateTemplateScreen from '../screens/CreateTemplateScreen';
import AgentScreen from '../screens/AgentScreen';
import SearchScreen from '../screens/SearchScreen';
import AdminScreen from '../screens/AdminScreen';
import DashboardScreen from '../screens/DashboardScreen';
import { BREAKPOINTS } from '../utils/responsive';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

const linking: LinkingOptions<any> = {
  prefixes: ['churchplanning://', 'https://church-planning-production.up.railway.app'],
  config: {
    screens: {
      Login: 'login',
      ChurchSelector: 'select-church',
      Home: {
        screens: {
          Perfil: {
            screens: {
              Notifications: 'notifications',
            },
          },
        },
      },
      ServiceDetail: 'service/:serviceId',
    },
  },
};

const defaultHeader = {
  headerStyle: { backgroundColor: '#5B5EA6' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' as const },
};

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar Perfil', ...defaultHeader }} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Cambiar Contraseña', ...defaultHeader }} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificaciones', ...defaultHeader }} />
      <ProfileStack.Screen name="CreateService" component={CreateServiceScreen} options={{ title: 'Nuevo Servicio', ...defaultHeader }} />
      <ProfileStack.Screen name="InviteUser" component={InviteUserScreen} options={{ title: 'Invitar Miembro', ...defaultHeader }} />
      <ProfileStack.Screen name="TemplateList" component={TemplateListScreen} options={{ title: 'Plantillas', ...defaultHeader }} />
      <ProfileStack.Screen name="CreateTemplate" component={CreateTemplateScreen} options={{ title: 'Nueva Plantilla', ...defaultHeader }} />
      <ProfileStack.Screen name="Agent" component={AgentScreen} options={{ title: 'Agente Inteligente', ...defaultHeader }} />
      <ProfileStack.Screen name="Admin" component={AdminScreen} options={{ title: 'Administración', ...defaultHeader }} />
      <ProfileStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard', ...defaultHeader }} />
    </ProfileStack.Navigator>
  );
}

function HomeTabs() {
  const { width } = useWindowDimensions();
  const isWideScreen = width >= BREAKPOINTS.desktop && Platform.OS === 'web';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Inicio') iconName = 'home';
          else if (route.name === 'Buscar') iconName = 'search';
          else if (route.name === 'Equipo') iconName = 'people';
          else if (route.name === 'Canciones') iconName = 'musical-notes';
          else if (route.name === 'Perfil') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#5B5EA6',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#5B5EA6' },
        headerTintColor: '#fff',
        tabBarStyle: isWideScreen ? {
          maxWidth: 1200,
          alignSelf: 'center',
          width: '100%',
        } : undefined,
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Buscar" component={SearchScreen} options={{ title: 'Buscar' }} />
      <Tab.Screen name="Equipo" component={TeamScreen} />
      <Tab.Screen name="Canciones" component={SongsScreen} options={{ title: 'Canciones' }} />
      <Tab.Screen name="Perfil" component={ProfileStackScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChurchSelector" component={ChurchSelector} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} />
        <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: 'Detalle del Servicio', ...defaultHeader }} />
        <Stack.Screen name="AddSong" component={AddSongScreen} options={{ title: 'Agregar Canción', ...defaultHeader }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
