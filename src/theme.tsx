import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { Phase } from './planner';

/** Squared paper and fountain-pen ink. */
const light = {
  paper: '#FBFCFF',
  ink: '#1B2A7A',
  inkSoft: '#525D99',
  grid: '#BFD0F0',
  red: '#C81E38',
  pressed: '#E6EDFB',
  cover: '#1B2A7A',
  markInk: '#1B2A7A', // text on a highlighter
  learn: '#FFE83D',
  practise: '#7DF0A6',
  review: '#FFA3D5',
};

/** A school chalkboard. */
const dark: typeof light = {
  paper: '#17332D',
  ink: '#F1F5EC',
  inkSoft: '#AFC8BC',
  grid: '#37594F',
  red: '#FF9A8F',
  pressed: '#1F4139',
  cover: '#3A50B0',
  markInk: '#12302A',
  learn: '#F6E27A',
  practise: '#8FE0AE',
  review: '#F7A8CC',
};

export const phaseName: Record<Phase, string> = { learn: 'Learn', practise: 'Practise', review: 'Review' };

export const GUTTER = 20;
export const column = { width: '100%', maxWidth: 560, alignSelf: 'center' } as const;

type Scheme = 'light' | 'dark';
const KEY = 'theme';
const FADE_IN = 110;

const ThemeContext = createContext<{ scheme: Scheme; next: Scheme; toggle: () => void } | null>(null);

export function useTheme() {
  const theme = use(ThemeContext);
  if (!theme) throw new Error('useTheme needs a ThemeProvider');
  return { ...theme, dark: theme.scheme === 'dark', color: theme.scheme === 'dark' ? dark : light };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [choice, setChoice] = useState<Scheme | null>(); // undefined until loaded, null to follow the system
  const [switchingTo, setSwitchingTo] = useState<Scheme | null>(null);
  const scheme = choice ?? system;

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(
      (saved) => setChoice(saved === 'light' || saved === 'dark' ? saved : null),
      () => setChoice(null),
    );
  }, []);

  // Cover the screen in the next paper colour, change the theme underneath, then uncover it.
  useEffect(() => {
    if (!switchingTo) return;
    const timer = setTimeout(() => {
      setChoice(switchingTo);
      setSwitchingTo(null);
      AsyncStorage.setItem(KEY, switchingTo).catch(() => {}); // only costs the choice after a restart
    }, FADE_IN);
    return () => clearTimeout(timer);
  }, [switchingTo]);

  if (choice === undefined) return null;

  const toggle = () => setSwitchingTo((current) => current ?? (scheme === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext value={{ scheme, next: switchingTo ?? scheme, toggle }}>
      <View style={[styles.fill, { backgroundColor: (scheme === 'dark' ? dark : light).paper }]}>
        {children}
        {switchingTo && (
          <Animated.View
            entering={FadeIn.duration(FADE_IN)}
            exiting={FadeOut.duration(180)}
            style={[
              StyleSheet.absoluteFill,
              styles.veil,
              { backgroundColor: (switchingTo === 'dark' ? dark : light).paper },
            ]}
          />
        )}
      </View>
    </ThemeContext>
  );
}

type AnyStyles = Parameters<typeof StyleSheet.create>[0];

export function makeStyles<T extends AnyStyles>(make: (color: typeof light) => T & AnyStyles) {
  const styles = { light: StyleSheet.create(make(light)), dark: StyleSheet.create(make(dark)) };
  return function useStyles() {
    return styles[useTheme().scheme];
  };
}

const font = {
  regular: 'AlegreyaSans_400Regular',
  italic: 'AlegreyaSans_400Regular_Italic',
  bold: 'AlegreyaSans_700Bold',
  black: 'AlegreyaSans_900Black',
};

export const useType = makeStyles((color) => ({
  title: { fontFamily: font.black, fontSize: 40, lineHeight: 42, letterSpacing: -0.6, color: color.ink, fontVariant: ['lining-nums'] },
  heading: { fontFamily: font.black, fontSize: 25, lineHeight: 30, color: color.ink, fontVariant: ['lining-nums'] },
  strong: { fontFamily: font.bold, fontSize: 19, lineHeight: 25, color: color.ink, fontVariant: ['lining-nums'] },
  body: { fontFamily: font.regular, fontSize: 18, lineHeight: 25, color: color.ink, fontVariant: ['lining-nums'] },
  small: { fontFamily: font.regular, fontSize: 16, lineHeight: 21, color: color.inkSoft, fontVariant: ['lining-nums'] },
  note: { fontFamily: font.italic, fontSize: 17, lineHeight: 23, color: color.ink, fontVariant: ['lining-nums'] },
}));

const styles = StyleSheet.create({
  fill: { flex: 1 },
  veil: { pointerEvents: 'none' },
});
