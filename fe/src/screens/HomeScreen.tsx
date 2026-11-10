import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { theme } from '../theme';
import type { ConcessionProduct } from '../types';

// Catálogo de las concesiones del estadio — dummyjson.com/products como API
// de práctica (título, precio, categoría e imagen ya vienen listos para
// mostrarse como productos de comida/bebida/merchandising).
const ITEMS_URL = 'https://dummyjson.com/products?limit=20';

export function HomeScreen(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['home-items'],
    queryFn: async () => {
      const response = await axios.get<{ products: ConcessionProduct[] }>(ITEMS_URL);
      return response.data.products;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se pudo cargar el contenido</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hola, {user?.firstName ?? user?.username} 👋
        </Text>
        <Text style={styles.subtitle}>Catálogo de concesiones del estadio</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
            <View style={styles.cardInfo}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.itemSubtitle}>{item.category}</Text>
              <Text style={styles.itemPrice}>${item.price}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay productos para mostrar</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  greeting: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  list: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceHover,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  itemSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  itemPrice: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.brand,
  },
  emptyText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.md,
  },
});
