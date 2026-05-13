import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

/**
 * Returns design tokens for the current color scheme.
 * Automatically switches between dark/light based on device setting.
 * Falls back to dark palette if light palette is not defined.
 */
export function useColors() {
  const scheme = useColorScheme();
  const palette =
    scheme === "light" && "light" in colors
      ? (colors as unknown as { light: typeof colors.dark }).light
      : colors.dark;
  return { ...palette, radius: colors.radius };
}
