import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  Image,
  useColorScheme,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { appleMusic, deer, logo } from "@/assets/images/svg";

export type ViewMode = "calendar" | "list";

// ── Glass tokens ──────────────────────────────────────────────────────────
// The reference's "glass" is a soft, slightly lighter surface than the page,
// with a faint bright rim and a wide, low-contrast shadow. Over a flat page
// background a translucent white fill and an opaque tint look identical — but
// only the opaque one lets the shadow render cleanly (elevation/shadow layers
// show *through* any transparency, which is what made the old version look
// muddy). So the surface color is computed once as an opaque blend of the
// page background and white.

type RGB = [number, number, number];

function hexToRgb(color: unknown): RGB | null {
  if (typeof color !== "string") return null;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

function mixWithWhite([r, g, b]: RGB, amount: number): string {
  const ch = (v: number) => Math.round(v + (255 - v) * amount);
  return `rgb(${ch(r)},${ch(g)},${ch(b)})`;
}

// How much white to lift the page color by. Tune these two to taste:
// higher = brighter/whiter surface.
const LIFT_LIGHT = 0.6;
const LIFT_DARK = 0.07;

export function useGlassTokens() {
  const colors = useColors();
  const scheme = useColorScheme();
  const bg = hexToRgb(colors.background);
  const dark = bg
    ? (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]) / 255 < 0.5
    : scheme === "dark";
  const lift = dark ? LIFT_DARK : LIFT_LIGHT;
  const solid = bg ? mixWithWhite(bg, lift) : dark ? "#2C2C30" : "#F7F8FA";
  const translucent = `rgba(255,255,255,${lift})`;
  return { dark, solid, translucent };
}

export function useIsDark(): boolean {
  return useGlassTokens().dark;
}

// ── Glass surface ─────────────────────────────────────────────────────────
// Outer view carries the shadow (so it isn't clipped); the inner overlay
// draws the rim and, if `blur` is on, the backdrop blur.
//
// `blur` is off by default: it only shows up when content scrolls underneath
// (e.g. a floating bottom bar), and it forces a translucent fill, which
// weakens the shadow. iOS/web get a real BlurView; Android falls back to the
// plain fill.

interface GlassProps {
  radius?: number;
  blur?: boolean;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Glass({
  radius = 999,
  blur = false,
  intensity = 50,
  style,
  children,
}: GlassProps) {
  const { dark, solid, translucent } = useGlassTokens();
  const useBlur = blur && Platform.OS !== "android";
  const fill = useBlur ? translucent : solid;
  const rim = dark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.9)";

  return (
    <View
      style={[
        {
          borderRadius: radius,
          backgroundColor: fill,
          borderWidth: 0,
          borderColor: dark
            ? "rgba(255,255,255,1 )"
            : "rgba(225,225,225,1   ) ",
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            overflow: "hidden",
            borderWidth: 1.5,
            borderColor: rim,
          },
        ]}
      >
        {useBlur && (
          <BlurView
            intensity={intensity}
            tint={dark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
      {children}
    </View>
  );
}

// ── Circular glass button (left logo slot, profile) ───────────────────────

const HEADER_HEIGHT = 36; // buttons and the pill share this height

interface GlassIconButtonProps {
  onPress?: () => void;
  size?: number;
  label?: string;
  children: React.ReactNode;
}

export function GlassIconButton({
  onPress,
  size = HEADER_HEIGHT,
  label,
  children,
}: GlassIconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Glass
        radius={size / 2}
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </Glass>
    </TouchableOpacity>
  );
}

// ── Glass pill toggle that fits its content ───────────────────────────────
// No fixed width: each label is measured, every segment becomes as wide as
// the widest label plus padding, and the pill wraps exactly that. The
// selected segment slides between them.

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface GlassSegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const SEG_PAD = 2; // gap between the pill edge and the selected segment
const SEG_HEIGHT = HEADER_HEIGHT - SEG_PAD * 2;
const SEG_H_PAD = 12; // breathing room left/right of each label

export function GlassSegmented<T extends string>({
  options,
  value,
  onChange,
}: GlassSegmentedProps<T>) {
  const colors = useColors();
  const { dark } = useGlassTokens();
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});
  const anim = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: index,
      useNativeDriver: true,
      speed: 22,
      bounciness: 5,
    }).start();
  }, [index, anim]);

  const widest = Math.max(0, ...Object.values(labelWidths));
  // undefined until the labels are measured, so the first pass sizes to content.
  const segWidth = widest > 0 ? widest + SEG_H_PAD * 2 : undefined;

  const translateX = anim.interpolate({
    inputRange: options.map((_, i) => i),
    outputRange: options.map((_, i) => i * (segWidth ?? 0)),
  });

  return (
    <Glass radius={999} style={{ padding: SEG_PAD }}>
      <View style={{ height: SEG_HEIGHT, flexDirection: "row" }}>
        {/* Selected segment — the darker gray pill from the reference */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: segWidth ?? 0,

            borderRadius: 999,
            backgroundColor: dark
              ? "rgba(255,255,255,0.14)"
              : "rgba(225,225,225,0.7 )",
            transform: [{ translateX }],
          }}
        />
        {options.map((o) => {
          const active = o.value === value;
          return (
            <TouchableOpacity
              key={o.value}
              style={{
                width: segWidth,
                paddingHorizontal: SEG_H_PAD,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (active) return;
                Haptics.selectionAsync();
                onChange(o.value);
              }}
            >
              <Text
                numberOfLines={1}
                onLayout={(e) => {
                  const w = Math.ceil(e.nativeEvent.layout.width);
                  setLabelWidths((prev) =>
                    prev[o.value] === w ? prev : { ...prev, [o.value]: w },
                  );
                }}
                style={{
                  fontSize: 16,
                  // Same weight for both so the labels never change width
                  // when you switch; only the color changes.
                  fontWeight: "600",
                  letterSpacing: -0.2,
                  color: active ? colors.foreground : colors.mutedForeground,
                }}
              >
                {o.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Glass>
  );
}

// ── Header row: [logo button]  [ Calendar | List ]  [profile button] ──────

const MODE_OPTIONS: SegmentOption<ViewMode>[] = [
  { value: "calendar", label: "Calendar" },
  { value: "list", label: "List" },
];

interface GlassHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onLeftPress?: () => void;
  onProfilePress?: () => void;
  /** Swap in your own logo/icon for the left button. */
  leftIcon?: React.ReactNode;
}

export function GlassHeader({
  viewMode,
  onViewModeChange,
  onLeftPress,
  onProfilePress,
  leftIcon,
}: GlassHeaderProps) {
  const colors = useColors();

  return (
    <View style={styles.row}>
      <TouchableOpacity style={{ height: 34, aspectRatio: 1 }}>
        <Image
          source={logo}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* flex:1 + centered → the pill wraps its content and sits in the middle */}
      <View style={styles.center}>
        <GlassSegmented
          options={MODE_OPTIONS}
          value={viewMode}
          onChange={onViewModeChange}
        />
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: colors.accentForeground,
          shadowColor: "#333",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          borderRadius: 30,
          width: 36,
          height: 36,
          elevation: 1,
          overflow: "hidden",
        }}
        onPress={onProfilePress}
      >
        <Image
          source={deer}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, // matches H_PAD on the home screen
    marginTop: 8,
    marginBottom: 22,
  },
  center: { flex: 1, alignItems: "center", marginHorizontal: 12 },
});
