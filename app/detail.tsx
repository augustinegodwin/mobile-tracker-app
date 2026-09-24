import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { SubscriptionIcon } from '@/components/SubscriptionIcon';

function getNextBillDate(billingDay: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[9]} ${billingDay}, 2024`;
}

function getCardBrand(last4: string): { name: string; color1: string; color2: string } {
  if (last4 === '5604' || last4.startsWith('5')) {
    return { name: 'Mastercard', color1: '#EB001B', color2: '#F79E1B' };
  }
  return { name: 'Visa', color1: '#1A1F71', color2: '#1A1F71' };
}

interface InfoRowProps {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
  isLast?: boolean;
}

function InfoRow({ label, children, colors, isLast }: InfoRowProps) {
  return (
    <>
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <View style={styles.infoValue}>{children}</View>
      </View>
      {!isLast && <View style={[styles.infoDiv, { backgroundColor: colors.border }]} />}
    </>
  );
}

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { subscriptions } = useSubscriptions();

  const sub = subscriptions.find(s => s.id === id);

  if (!sub) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Subscription not found.</Text>
      </View>
    );
  }

  const brand = getCardBrand(sub.paymentCard);
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Close button */}
      <TouchableOpacity
        style={[styles.closeBtn, { top: topPad + 12, backgroundColor: colors.cell }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Feather name="x" size={18} color={colors.foreground} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 60, paddingBottom: bottomPad + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconWrap}>
          <SubscriptionIcon name={sub.name} size={80}  src={sub.src}/>
        </View>

        {/* Name + price badge */}
        <View style={styles.nameRow}>
          <Text style={[styles.subName, { color: colors.foreground }]}>{sub.name}</Text>
          <View style={[styles.priceBadge, { backgroundColor: colors.monthly }]}>
            <Text style={styles.priceText}>${sub.price.toFixed(2)}</Text>
          </View>
        </View>

        {/* Next bill */}
        <Text style={[styles.nextBill, { color: colors.mutedForeground }]}>
          Next bill:{' '}
          <Text style={[styles.nextBillDate, { color: colors.foreground }]}>
            {getNextBillDate(sub.billingDay)}
          </Text>
        </Text>

        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <InfoRow label="Payment method" colors={colors}>
            <View style={styles.cardBrand}>
              <View style={styles.mastercardWrap}>
                <View style={[styles.mcCircle, { backgroundColor: brand.color1, opacity: 0.9 }]} />
                <View style={[styles.mcCircle, { backgroundColor: brand.color2, opacity: 0.9, marginLeft: -10 }]} />
              </View>
              <Text style={[styles.infoText, { color: colors.foreground }]}>{sub.paymentCard}</Text>
            </View>
          </InfoRow>

          <InfoRow label="Period" colors={colors}>
            <View style={styles.periodWrap}>
              <View
                style={[
                  styles.periodDot,
                  { backgroundColor: sub.period === 'monthly' ? colors.monthly : colors.yearly },
                ]}
              />
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                {sub.period === 'monthly' ? 'Monthly' : 'Yearly'}
              </Text>
            </View>
          </InfoRow>

          <InfoRow label="Plan" colors={colors}>
            <Text style={[styles.infoTextBold, { color: colors.foreground }]}>{sub.plan}</Text>
          </InfoRow>

          <InfoRow label="Remind me" colors={colors} isLast>
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              {sub.remindDays} {sub.remindDays === 1 ? 'day' : 'days'} before
            </Text>
          </InfoRow>
        </View>

        {/* Cancel button */}
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.destructive }]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="cancel" size={16} color={colors.destructive} />
          <Text style={[styles.cancelText, { color: colors.destructive }]}>Cancel Subscription</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: { alignItems: 'center', paddingHorizontal: 24 },

  iconWrap: { marginBottom: 20 ,backgroundColor: 'transparent', width:80, height:80},

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  subName: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priceText: { color: '#000000', fontSize: 14, fontWeight: '700' },

  nextBill: { fontSize: 15, marginBottom: 28 },
  nextBillDate: { fontWeight: '700' },

  infoCard: { width: '100%', borderRadius: 18, overflow: 'hidden', marginBottom: 28 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoDiv: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  infoLabel: { fontSize: 15, fontWeight: '400' },
  infoValue: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 15, fontWeight: '500' },
  infoTextBold: { fontSize: 15, fontWeight: '700' },

  cardBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mastercardWrap: { flexDirection: 'row', alignItems: 'center' },
  mcCircle: { width: 18, height: 18, borderRadius: 9 },

  periodWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  periodDot: { width: 8, height: 8, borderRadius: 4 },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
