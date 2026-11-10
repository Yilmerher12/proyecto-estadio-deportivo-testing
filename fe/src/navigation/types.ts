import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Stack de autenticación (sin sesión)
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Stack de la app (con sesión)
export type AppStackParamList = {
  Home: undefined;
  Profile: undefined;
};

// Screen props helpers
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
export type HomeScreenProps = BottomTabScreenProps<AppStackParamList, 'Home'>;
export type ProfileScreenProps = BottomTabScreenProps<AppStackParamList, 'Profile'>;
