import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '../schemas/authSchema';
import { FormField } from '../components/FormField';
import { useAuthStore } from '../stores/authStore';
import { theme } from '../theme';
import type { LoginScreenProps } from '../navigation/types';

export function LoginScreen({ navigation }: LoginScreenProps): React.JSX.Element {
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: 'emilys',
      password: 'emilyspass',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      // ✅ RootNavigator detecta isAuthenticated === true y cambia a AppNavigator
    } catch {
      Alert.alert('Error', 'Credenciales incorrectas');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Ingresa tus credenciales para continuar</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Usuario"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="tu_usuario"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.username?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label="Contraseña"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="••••••••"
              secureTextEntry
              error={errors.password?.message}
            />
          )}
        />

        <Pressable
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          )}
        </Pressable>
      </View>

      <Pressable
        style={styles.linkButton}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.linkText}>
          ¿No tienes cuenta?{' '}
          <Text style={styles.linkHighlight}>Crear cuenta</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xxl,
    gap: theme.spacing.xl,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  form: {
    gap: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: 14,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.fontSize.md,
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  linkHighlight: {
    color: theme.colors.brand,
    fontWeight: '600',
  },
});
