/**
 * 식단 날짜 선택 컴포넌트 (MealPlanDatePicker)
 *
 * 날짜 뱃지(탭하면 펼침) + 미니 캘린더로 날짜를 변경합니다.
 */

import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { WEEKDAYS } from '../../utils/date';

/** 타임존 영향 없이 로컬 날짜로 파싱 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface MealPlanDatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function MealPlanDatePicker({ selectedDate, onDateChange }: MealPlanDatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [dpYear, setDpYear] = useState(() => parseLocalDate(selectedDate).getFullYear());
  const [dpMonth, setDpMonth] = useState(() => parseLocalDate(selectedDate).getMonth() + 1);

  const openPicker = () => {
    const d = parseLocalDate(selectedDate);
    setDpYear(d.getFullYear());
    setDpMonth(d.getMonth() + 1);
    setShowPicker((v) => !v);
  };

  const dateLabel = (() => {
    const d = parseLocalDate(selectedDate);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
  })();

  const cells = (() => {
    const firstDay = new Date(dpYear, dpMonth - 1, 1).getDay();
    const lastDay = new Date(dpYear, dpMonth, 0).getDate();
    const arr: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: lastDay }, (_, i) => i + 1),
    ];
    const rem = arr.length % 7;
    if (rem !== 0) arr.push(...Array(7 - rem).fill(null));
    return arr;
  })();

  return (
    <>
      <TouchableOpacity style={styles.dateBadge} onPress={openPicker}>
        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
        <Text style={styles.dateBadgeText}>{dateLabel}</Text>
        <Ionicons name={showPicker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => {
              if (dpMonth === 1) { setDpYear((y) => y - 1); setDpMonth(12); }
              else setDpMonth((m) => m - 1);
            }}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>{dpYear}년 {dpMonth}월</Text>
            <TouchableOpacity onPress={() => {
              if (dpMonth === 12) { setDpYear((y) => y + 1); setDpMonth(1); }
              else setDpMonth((m) => m + 1);
            }}>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={styles.weekLabel}>{d}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (day === null) return <View key={`e-${idx}`} style={styles.cell} />;
              const dateStr = `${dpYear}-${String(dpMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.cell, isSelected && styles.cellSelected]}
                  onPress={() => { onDateChange(dateStr); setShowPicker(false); }}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  dateBadgeText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },
  cellSelected: { backgroundColor: colors.primary, borderRadius: 16 },
  dayText: { fontSize: 13, color: colors.text },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
});
