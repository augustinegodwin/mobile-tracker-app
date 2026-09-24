import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  useWindowDimensions,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { SubscriptionIcon } from '@/components/SubscriptionIcon';
import { GlassHeader, ViewMode } from '@/components/appHeader';
import { Subscription, getMonthlyTotal, getDayLabel } from '@/constants/subscriptions';
import colors from '@/constants/colors';

const H_PAD = 16;
const GAP = 1 ;

// Caps the whole calendar column so it doesn't stretch edge-to-edge on
// tablets or wide/web windows — it's centered instead. Tune freely.
const MAX_CONTENT_WIDTH = 480;

// ── Carousel tuning ───────────────────────────────────────────────────────
// How many months back/forward to generate around "today". The carousel is
// a plain ScrollView (not virtualized) so this stays cheap even at 25 cards.
const MONTHS_BEFORE = 12;
const MONTHS_AFTER = 12;
// Gap between cards as you scroll past them.
const CARD_SPACING = 16;
// Inner padding of each month card, around the day grid.
const CARD_PADDING = 0;
const GRID_ROWS = 6; // every month is padded to 6 rows so card heights match

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// ── Date helpers (month is 0-indexed, matches Date) ──────────────────────

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstWeekdayOffset(year: number, month: number) {
  const jsDay = new Date(year, month, 1).getDay(); // Sun = 0
  return (jsDay + 6) % 7; // convert to Mon = 0
}

// Just the month name ("September") — used for the big title.
function monthName(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long' });
}

function buildMonthCells(year: number, month: number): (number | null)[] {
  const offset = firstWeekdayOffset(year, month);
  const total = daysInMonth(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length < GRID_ROWS * 7) cells.push(null);
  return cells.slice(0, GRID_ROWS * 7);
}

interface MonthMeta {
  key: string;
  year: number;
  month: number;
}

function useMonthRange(before: number, after: number): MonthMeta[] {
  return useMemo(() => {
    const now = new Date();
    const baseYear = now.getFullYear();
    const baseMonth = now.getMonth();
    const list: MonthMeta[] = [];
    for (let i = -before; i <= after; i++) {
      const d = new Date(baseYear, baseMonth + i, 1);
      list.push({ key: `${d.getFullYear()}-${d.getMonth()}`, year: d.getFullYear(), month: d.getMonth() });
    }
    return list;
  }, [before, after]);
}

// Grid sizing keyed off the *capped* content width (not the raw screen
// width) so cells scale with the centered column on tablets/wide screens
// instead of the full display. Reactive so rotation/resize recalculates it.
function useGridMetrics(containerWidth: number) {
  return useMemo(() => {
    const gridWidth = containerWidth - H_PAD * 2 - CARD_PADDING * 2;
    const cellSize = Math.floor((gridWidth - GAP * 6) / 7);
    const cardHeight = GRID_ROWS * cellSize + (GRID_ROWS - 1) * GAP + CARD_PADDING * 2;
    const itemHeight = cardHeight + CARD_SPACING;
    return { cellSize, cardHeight, itemHeight };
  }, [containerWidth]);
}

// ── Screen ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { subscriptions } = useSubscriptions();
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH);
  const { cellSize, cardHeight, itemHeight } = useGridMetrics(contentWidth);

  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const today = useMemo(() => new Date(), []);
  const [activeYear, setActiveYear] = useState(today.getFullYear());
  const [activeMonth, setActiveMonth] = useState(today.getMonth());
  const activeMonthName = useMemo(() => monthName(activeYear, activeMonth), [activeYear, activeMonth]);
  // Only show the year when you've scrolled into a different year than today's.
  const showYear = activeYear !== today.getFullYear();

  const monthlyTotal = useMemo(() => getMonthlyTotal(subscriptions), [subscriptions]);

  const selectedDaySubs = useMemo(
    () => (selectedDay ? subscriptions.filter(s => s.billingDay === selectedDay) : []),
    [selectedDay, subscriptions],
  );

  const dayTotal = useMemo(
    () => selectedDaySubs.reduce((sum, s) => sum + s.price, 0),
    [selectedDaySubs],
  );

  const handleDayPress = useCallback(
    (day: number) => {
      const daySubs = subscriptions.filter(s => s.billingDay === day);
      if (daySubs.length > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedDay(day);
      }
    },
    [subscriptions],
  );

  const handleSubPress = useCallback((sub: Subscription) => {
    setSelectedDay(null);
    setTimeout(() => {
      router.push({ pathname: '/detail', params: { id: sub.id } });
    }, 150);
  }, []);

  const handleMonthChange = useCallback((year: number, month: number) => {
    setActiveYear(year);
    setActiveMonth(month);
  }, []);

  // Header buttons — hook these up to wherever they should go.
  const handleLeftPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: open menu / go home
  }, []);

  const handleProfilePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: router.push('/profile')
  }, []);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: topPad }]}>
      {/* Everything below is capped at MAX_CONTENT_WIDTH and centered by
          styles.screen's alignItems: 'center'. On a phone this is just
          100% width (maxWidth never kicks in); on a tablet/wide window it
          becomes a centered column instead of stretching edge-to-edge. */}
      <View style={styles.contentWrap}>
        {/* ── Glass header: [logo]  [ Calendar | List ]  [profile] ── */}
        <GlassHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onLeftPress={handleLeftPress}
          onProfilePress={handleProfilePress}
        />

        {/* ── Big month title (updates as the carousel scrolls) ── */}
        <View style={styles.titleRow}>
          <Text style={[styles.bigTitle, { color: colors.foreground }]}>
            {activeMonthName}
            {showYear && (
              <Text style={[styles.bigTitleYear, { color: colors.mutedForeground }]}> {activeYear}</Text>
            )}
          </Text>
          <Text style={[styles.monthTotal, { color: colors.mutedForeground }]}>
            Monthly total: ${monthlyTotal.toFixed(2)}
          </Text>
        </View>

        {/* ── Legend (sits where the "Previous 7 Days" subheading is) ── */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.yearly }]} />
            <Text style={[styles.legendText, { color: colors.foreground }]}>Yearly</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.monthly }]} />
            <Text style={[styles.legendText, { color: colors.foreground }]}>Monthly</Text>
          </View>
        </View>

        {viewMode === 'calendar' ? (
          <>
            {/* Weekday header stays pinned above the carousel so it doesn't
                repeat (and re-fade) inside every scrolling card. */}
            <View style={styles.dayNamesRow}>
              {DAY_NAMES.map(n => (
                <View key={n} style={[styles.dayNameCell, { width: cellSize, backgroundColor: colors.cell }]}>
                  <Text style={[styles.dayNameText, { color: colors.mutedForeground }]}>{n}</Text>
                </View>
              ))}
            </View>

            <MonthCarousel
              subscriptions={subscriptions}
              colors={colors}
              cellSize={cellSize}
              cardHeight={cardHeight}
              itemHeight={itemHeight}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
            />
          </>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
          >
            <ListView subscriptions={subscriptions} colors={colors} onSubPress={handleSubPress} />
          </ScrollView>
        )}
      </View>

      {/* ── Day Detail Modal ── */}
      <Modal
        visible={selectedDay !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDay(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedDay(null)}>
          <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={styles.modalInner}>
                <View style={[styles.totalPill, { backgroundColor: colors.pill }]}>
                  <Text style={[styles.totalPillText, { color: colors.foreground }]}>
                    TOTAL: ${dayTotal.toFixed(2)}
                  </Text>
                </View>

                <View style={[styles.dayCard, { backgroundColor: colors.card }]}>
                  {selectedDaySubs.map((sub, i) => (
                    <React.Fragment key={sub.id}>
                      <TouchableOpacity
                        style={styles.dayRow}
                        onPress={() => handleSubPress(sub)}
                        activeOpacity={0.7}
                      >
                        <View style={{width:36, height:36}}>
                          <SubscriptionIcon name={sub.name} size={36} src={sub.src} />
                        </View>
                        <Text style={[styles.dayRowName, { color: colors.foreground }]}>{sub.name}</Text>
                        <Text style={[styles.dayRowPrice, { color: colors.foreground }]}>
                          ${sub.price.toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                      {i < selectedDaySubs.length - 1 && (
                        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                      )}
                    </React.Fragment>
                  ))}
                  <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>
                    {selectedDay ? getDayLabel(selectedDay) : ''}
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// ── Month carousel: vertical snap-scroll, TOP-aligned. The active card
// sits flush under the weekday header at full opacity; only the next
// month's card peeks in below it, dimmed and untappable, until you scroll
// it into place. ─────────────────────────────────────────────────────────

interface MonthCarouselProps {
  subscriptions: Subscription[];
  colors: ReturnType<typeof useColors>;
  cellSize: number;
  cardHeight: number;
  itemHeight: number;
  onDayPress: (day: number) => void;
  onMonthChange: (year: number, month: number) => void;
}

function MonthCarousel({
  subscriptions,
  colors,
  cellSize,
  cardHeight,
  itemHeight,
  onDayPress,
  onMonthChange,
}: MonthCarouselProps) {
  const months = useMonthRange(MONTHS_BEFORE, MONTHS_AFTER);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(MONTHS_BEFORE * itemHeight)).current;
  // Which card is currently the top-aligned one — only this one accepts
  // taps. Everything peeking in below it is dimmed AND inert.
  const activeIndexRef = useRef(MONTHS_BEFORE);
  const [activeIndex, setActiveIndexState] = useState(MONTHS_BEFORE);
  const setActiveIndex = useCallback((i: number) => {
    activeIndexRef.current = i;
    setActiveIndexState(i);
  }, []);
  // The carousel area is flex:1 (fills whatever's left below the weekday
  // header), so its height isn't known up front — measure it so we can
  // leave enough trailing space for the very last month to still reach a
  // top-aligned position instead of stopping short.
  const [viewportHeight, setViewportHeight] = useState(0);

  // Re-snap to the active month whenever itemHeight changes — covers both
  // the initial mount and any later resize (rotation, tablet split-view,
  // window resize) so the carousel stays on the same month instead of
  // drifting when MAX_CONTENT_WIDTH's effective size changes.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: activeIndexRef.current * itemHeight, animated: false });
    });
    const m = months[activeIndexRef.current];
    if (m) onMonthChange(m.year, m.month);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemHeight]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true },
  );

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.max(0, Math.min(months.length - 1, Math.round(y / itemHeight)));
      setActiveIndex(index);
      const m = months[index];
      if (m) onMonthChange(m.year, m.month);
    },
    [months, itemHeight, onMonthChange, setActiveIndex],
  );

  return (
    <View style={{ flex: 1 }} onLayout={e => setViewportHeight(e.nativeEvent.layout.height)}>
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingBottom: Math.max(0, viewportHeight - cardHeight) }}
      >
        {months.map((m, index) => {
          // Dimmed while it's still below the active card (hasn't reached
          // the top yet), full opacity the moment it gets there. Once it's
          // scrolled further up and off-screen it's clipped by the
          // ScrollView anyway, so nothing past that point matters.
          const inputRange = [(index - 1) * itemHeight, index * itemHeight];
          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.1, 1],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={m.key}
              pointerEvents={index === activeIndex ? 'auto' : 'none'}
              style={[
                styles.card,
                {
                  height: cardHeight,
                  marginBottom: index === months.length - 1 ? 0 : CARD_SPACING,
                  backgroundColor: 'transparent',
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // opacity,
                },
              ]}
            >
              <MonthGrid
                year={m.year}
                month={m.month}
                cellSize={cellSize}
                subscriptions={subscriptions}
                colors={colors}
                onDayPress={onDayPress}
                opacity={opacity}
              />
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

// ── Single month's day grid (lives inside a carousel card) ────────────────

interface MonthGridProps {
  year: number;
  month: number;
  cellSize: number;
  subscriptions: Subscription[];
  colors: ReturnType<typeof useColors>;
  onDayPress: (day: number) => void;
  opacity: any
}

function MonthGrid({ year, month, cellSize, subscriptions, colors, onDayPress, opacity }: MonthGridProps) {
  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  return (
    <View style={[styles.grid, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }]}>
      {cells.map((day, i) => {
        const daySubs = day ? subscriptions.filter(s => s.billingDay === day) : [];
        const first = daySubs[0];
        const extra = daySubs.length - 1;
        const hasYearly = daySubs.some(s => s.period === 'yearly');
        const dotColor = hasYearly ? colors.yearly : colors.monthly;

        return (
          <TouchableOpacity
            key={i}
            style={[
              styles.cell,
              {
                width: cellSize,
                height: cellSize,
                backgroundColor: colors.cell,
                opacity: day ? 1 : 0.7  ,
                borderRadius: 10,
                marginBottom: GAP,
                marginRight: (i + 1) % 7 === 0 ? 0 : GAP,
              },
            ]}
            onPress={() => day && onDayPress(day)}
            disabled={!day}
            activeOpacity={daySubs.length > 0 ? 0.75 : 1}
          >
            {day != null && (
              <>
                {first && <View style={[styles.periodDot, { backgroundColor: dotColor }]} />}
                {first && (
                  <View style={styles.cellIconWrap}>
                    <SubscriptionIcon src={first.src} name={first.name} size={Math.floor(cellSize * 0.6)} />
                    {extra > 0 && (
                      <View style={[styles.badge, { backgroundColor: colors.secondary , outlineColor:colors.card }]}>
                        <Text style={[styles.badgeText, { color: colors.foreground }]}>+{extra}</Text>
                      </View>
                    )}
                  </View>
                )}
                <Text style={[styles.cellDayNum, { color: colors.foreground }]}>{day}</Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── List view ────────────────────────────────────────────────────────────────

interface ListProps {
  subscriptions: Subscription[];
  colors: ReturnType<typeof useColors>;
  onSubPress: (sub: Subscription) => void;
}

function ListView({ subscriptions, colors, onSubPress }: ListProps) {
  const grouped = useMemo(() => {
    const map: Record<number, Subscription[]> = {};
    for (const s of subscriptions) {
      if (!map[s.billingDay]) map[s.billingDay] = [];
      map[s.billingDay].push(s);
    }
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([day, subs]) => ({ day: Number(day), subs }));
  }, [subscriptions]);

  return (
    <View style={styles.listWrap}>
      {grouped.map(({ day, subs }) => (
        <View key={day} style={styles.listGroup}>
          <Text style={[styles.listGroupHeader, { color: colors.mutedForeground }]}>
            {getDayLabel(day)}
          </Text>
          <View style={[styles.listCard, { backgroundColor: colors.card }]}>
            {subs.map((sub, i) => (
              <React.Fragment key={sub.id}>
                <TouchableOpacity style={styles.listRow} onPress={() => onSubPress(sub)} activeOpacity={0.7}>
                  <View style={{width:40, height:40}}>
                  <SubscriptionIcon src={sub.src} name={sub.name} size={40} />
                  </View>
                  <View style={styles.listRowMid}>
                    <Text style={[styles.listRowName, { color: colors.foreground }]}>{sub.name}</Text>
                    <View
                      style={[
                        styles.periodChip,
                        {
                          backgroundColor:
                            sub.period === 'monthly' ? `${colors.monthly}22` : `${colors.yearly}22`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.periodChipText,
                          { color: sub.period === 'monthly' ? colors.monthly : colors.yearly },
                        ]}
                      >
                        {sub.period === 'monthly' ? 'Monthly' : 'Yearly'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.listRowPrice, { color: colors.foreground }]}>
                    ${sub.price.toFixed(2)}
                  </Text>
                </TouchableOpacity>
                {i < subs.length - 1 && <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  // Capped + centered column. width:'100%' resolves against the screen's
  // full width first; maxWidth then clamps it on tablets/wide windows, and
  // the parent's alignItems:'center' centers whatever width results.
  contentWrap: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH },

  // Big month title + monthly total on the same baseline row.
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    marginBottom: 8,
  },
  bigTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  bigTitleYear: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3 },
  monthTotal: { fontSize: 13, fontWeight: '400', marginBottom: 6 },

  // Legend doubles as the section subheading under the title.
  legendRow: {
    flexDirection: 'row',
    gap: 18,
    paddingHorizontal: H_PAD,
    marginBottom: 20,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },

  divider: { height: StyleSheet.hairlineWidth, marginBottom: 10, marginTop: 4 },

  // Pinned weekday header, aligned to the H_PAD + CARD_PADDING inset so its
  // columns line up with the grid inside each carousel card.
  dayNamesRow: {
    flexDirection: 'row',
    gap: GAP,
    paddingHorizontal: H_PAD + CARD_PADDING,
    marginBottom: 8,
  },
  dayNameCell: { alignItems: 'center', paddingVertical: 5, borderRadius: 10 },
  dayNameText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },

  // Carousel card
  card: {
    marginHorizontal: H_PAD,
    borderRadius: 22,
    borderWidth: 0,
    padding: CARD_PADDING,
    justifyContent: 'center',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    // Soft floating-pill shadow, matching the reference screenshot.
    flexDirection:"column",
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1 ,
    paddingBottom:4,
    paddingLeft:4,
    paddingRight:4,
    paddingTop:6 ,
    gap:3,
    elevation: 1, // Android — shadowOffset/Opacity/Radius above are iOS-only
  },
  cardshad:{
     shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1, // Android — shadowOffset/Opacity/Radius above are iOS-only
  },
  cellIconWrap: { alignItems: 'center', justifyContent: 'center' ,flexDirection:"row", flex:1, aspectRatio:1, },
  periodDot: {
    position: 'absolute', 
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    zIndex: 5,
    borderRadius: 3,
  },
  badge: {
    height:"100%",
     aspectRatio:1,
    borderRadius: 20,
    zIndex:3,
    marginLeft:-10,
    justifyContent: 'center',
    outlineWidth:1.5,
    outlineStyle:'solid',
    alignItems: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cellDayNum: {
    
    fontSize: 11,
    fontWeight: '500',
  },

  // Modal overlay
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalInner: { alignItems: 'center', gap: 10, width: '82%' },
  totalPill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  totalPillText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  dayCard: { width: '100%', borderRadius: 20, overflow: 'hidden', paddingBottom: 10 },
  dayRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  dayRowName: { flex: 1, fontSize: 16, fontWeight: '600' },
  dayRowPrice: { fontSize: 16, fontWeight: '500' },
  dayLabel: { textAlign: 'center', fontSize: 11, fontWeight: '500', letterSpacing: 0.6, marginTop: 6 },
  rowDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 8},

  // List view
  listWrap: { paddingHorizontal: H_PAD, gap: 20, marginTop: 4 },
  listGroup: { gap: 8 },
  listGroupHeader: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8 },
  listCard: { borderRadius: 16, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  listRowMid: { flex: 1, gap: 4 },
  listRowName: { fontSize: 15, fontWeight: '600' },
  periodChip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  periodChipText: { fontSize: 11, fontWeight: '600' },
  listRowPrice: { fontSize: 15, fontWeight: '500' },
});