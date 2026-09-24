import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSubscriptions } from '@/context/SubscriptionContext';

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { addSubscription } = useSubscriptions();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [day, setDay] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [plan, setPlan] = useState('');
  const [card, setCard] = useState('');
  const [remind, setRemind] = useState('1');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Please enter a service name.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Invalid price', 'Please enter a valid price.');
      return;
    }
    const parsedDay = parseInt(day, 10);
    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      Alert.alert('Invalid day', 'Please enter a billing day between 1 and 31.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addSubscription({
      name: name.trim(),
      price: parsedPrice,
      billingDay: parsedDay,
      period,
      plan: plan.trim() || 'Standard',
      paymentCard: card.trim() || '0000',
      remindDays: parseInt(remind, 10) || 1,
    });
    router.back();
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Add Subscription</Text>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
          <Text style={[styles.saveBtn, { color: colors.monthly }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Service name */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SERVICE</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="e.g. Spotify, Netflix"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        {/* Price + Day */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>BILLING</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Price</Text>
            <TextInput
              style={[styles.rowInput, { color: colors.foreground }]}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              textAlign="right"
            />
          </View>
          <View style={[styles.rowDiv, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Billing day</Text>
            <TextInput
              style={[styles.rowInput, { color: colors.foreground }]}
              placeholder="1–31"
              placeholderTextColor={colors.mutedForeground}
              value={day}
              onChangeText={setDay}
              keyboardType="number-pad"
              textAlign="right"
            />
          </View>
        </View>

        {/* Period toggle */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PERIOD</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.toggleRow}>
            {(['monthly', 'yearly'] as const).map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.toggleBtn,
                  period === p && { backgroundColor: p === 'monthly' ? colors.monthly : colors.yearly },
                ]}
                onPress={() => setPeriod(p)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: period === p ? '#000000' : colors.mutedForeground },
                  ]}
                >
                  {p === 'monthly' ? 'Monthly' : 'Yearly'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Details */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DETAILS</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Plan</Text>
            <TextInput
              style={[styles.rowInput, { color: colors.foreground }]}
              placeholder="Standard"
              placeholderTextColor={colors.mutedForeground}
              value={plan}
              onChangeText={setPlan}
              textAlign="right"
            />
          </View>
          <View style={[styles.rowDiv, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Card (last 4)</Text>
            <TextInput
              style={[styles.rowInput, { color: colors.foreground }]}
              placeholder="0000"
              placeholderTextColor={colors.mutedForeground}
              value={card}
              onChangeText={t => setCard(t.slice(0, 4))}
              keyboardType="number-pad"
              textAlign="right"
              maxLength={4}
            />
          </View>
          <View style={[styles.rowDiv, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Remind me (days before)</Text>
            <TextInput
              style={[styles.rowInput, { color: colors.foreground }]}
              placeholder="1"
              placeholderTextColor={colors.mutedForeground}
              value={remind}
              onChangeText={setRemind}
              keyboardType="number-pad"
              textAlign="right"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '600' },
  saveBtn: { fontSize: 17, fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 0 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { borderRadius: 16, overflow: 'hidden' },
  input: { fontSize: 16, paddingHorizontal: 16, paddingVertical: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: { flex: 1, fontSize: 15 },
  rowInput: { fontSize: 15, minWidth: 80 },
  rowDiv: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleText: { fontSize: 15, fontWeight: '600' },
});
