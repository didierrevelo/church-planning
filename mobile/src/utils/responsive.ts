import { useWindowDimensions, Platform } from 'react-native';

export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1400,
};

export function useResponsive() {
  const { width } = useWindowDimensions();

  return {
    isMobile: width < BREAKPOINTS.tablet,
    isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
    isDesktop: width >= BREAKPOINTS.desktop,
    isWide: width >= BREAKPOINTS.wide,
    width,
    isWeb: Platform.OS === 'web',
    isNative: Platform.OS !== 'web',
    contentMaxWidth: Platform.OS === 'web' ? Math.min(width, 1200) : width,
  };
}
