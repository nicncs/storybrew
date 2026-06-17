import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/state/AppProvider';
import { colors, fonts } from '@/theme/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textDark,
            headerTitleStyle: { fontWeight: fonts.heavy },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'StoryBrew' }} />
          <Stack.Screen name="create" options={{ title: 'New Story', presentation: 'modal' }} />
          <Stack.Screen name="review" options={{ title: 'Read & Approve', headerBackVisible: false }} />
          <Stack.Screen name="player/[id]" options={{ title: 'Story Time' }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
