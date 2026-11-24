import {
  AlegreyaSans_400Regular,
  AlegreyaSans_400Regular_Italic,
  AlegreyaSans_700Bold,
  AlegreyaSans_900Black,
  useFonts,
} from '@expo-google-fonts/alegreya-sans';
import { DefaultTheme, Stack, ThemeProvider as NavigationTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { PlansProvider, usePlans } from '@/plans';
import { GUTTER, makeStyles, ThemeProvider, useTheme, useType } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Opening a plan by link still gives a way back to the list.
export const unstable_settings = { anchor: 'index' };

export default function RootLayout() {
  return (
    <ThemeProvider>
      <PlansProvider>
        <Screens />
      </PlansProvider>
    </ThemeProvider>
  );
}

function Screens() {
  const [fontsLoaded, fontError] = useFonts({
    AlegreyaSans_400Regular,
    AlegreyaSans_400Regular_Italic,
    AlegreyaSans_700Bold,
    AlegreyaSans_900Black,
  });
  const { plans, loadFailed, saveFailed, load } = usePlans();
  const { color, dark } = useTheme();
  const styles = useStyles();
  const type = useType();
  const ready = (fontsLoaded || !!fontError) && (!!plans || loadFailed);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(color.paper);
  }, [color.paper]);

  if (!ready) return null;

  const statusBar = <StatusBar style={dark ? 'light' : 'dark'} />;

  if (!plans) {
    return (
      <SafeAreaView style={[styles.fill, styles.problem]}>
        {statusBar}
        <Text style={type.heading}>Your saved plans could not be opened</Text>
        <Text style={type.body}>Nothing was deleted. Try again, or restart the app.</Text>
        <Button label="Try again" onPress={load} />
      </SafeAreaView>
    );
  }

  return (
    <NavigationTheme
      value={{
        ...DefaultTheme,
        dark,
        colors: {
          primary: color.ink,
          background: color.paper,
          card: color.paper,
          text: color.ink,
          border: color.grid,
          notification: color.red,
        },
      }}>
      {statusBar}
      <View style={styles.fill}>
        <Stack screenOptions={{ headerTitle: '', headerTintColor: color.ink, headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="index" options={{ headerShown: false, title: 'Your exams' }} />
          <Stack.Screen name="new" options={{ title: 'Add an exam' }} />
          <Stack.Screen name="proposal" options={{ title: 'Proposed plan' }} />
          <Stack.Screen name="plan/[id]" options={{ title: 'Study plan' }} />
        </Stack>
        {saveFailed && (
          <SafeAreaView edges={['bottom']} style={styles.banner}>
            <Text accessibilityRole="alert" style={[type.strong, styles.bannerText]}>
              Your last change was not saved. Free up some storage, then make the change again.
            </Text>
          </SafeAreaView>
        )}
      </View>
    </NavigationTheme>
  );
}

const useStyles = makeStyles((color) => ({
  fill: { flex: 1, backgroundColor: color.paper },
  problem: { justifyContent: 'center', gap: 12, padding: GUTTER },
  banner: { backgroundColor: color.red, padding: GUTTER },
  bannerText: { color: color.paper },
}));
