/**
 * BirthDatePicker — sélecteur de date de naissance en 3 colonnes déroulantes.
 * Ordre : Année → Mois → Jour
 * Compatible iOS & Android sans dépendance externe (utilise @react-native-picker/picker).
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

interface BirthDatePickerProps {
  visible: boolean;
  /** Valeur actuelle au format DD-MM-YYYY ou vide */
  value?: string;
  onConfirm: (date: string) => void; // retourne DD-MM-YYYY
  onCancel: () => void;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseDD_MM_YYYY(str?: string): { day: number; month: number; year: number } | null {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (year < 1920 || year > new Date().getFullYear()) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return { day, month, year };
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i); // du plus récent au plus ancien

const BirthDatePicker: React.FC<BirthDatePickerProps> = ({
  visible,
  value,
  onConfirm,
  onCancel,
}) => {
  const { colors, dark } = useTheme();

  const parsed = parseDD_MM_YYYY(value);
  const [selectedYear, setSelectedYear]   = useState(parsed?.year  ?? 1990);
  const [selectedMonth, setSelectedMonth] = useState(parsed?.month ?? 1);
  const [selectedDay, setSelectedDay]     = useState(parsed?.day   ?? 1);

  // Recalcule les jours valides quand l'année ou le mois change
  const maxDay = daysInMonth(selectedYear, selectedMonth);
  const DAYS   = Array.from({ length: maxDay }, (_, i) => i + 1);

  useEffect(() => {
    if (selectedDay > maxDay) setSelectedDay(maxDay);
  }, [selectedYear, selectedMonth]);

  // Resynchronise si la prop value change
  useEffect(() => {
    const p = parseDD_MM_YYYY(value);
    if (p) {
      setSelectedYear(p.year);
      setSelectedMonth(p.month);
      setSelectedDay(p.day);
    }
  }, [value, visible]);

  const handleConfirm = () => {
    const dd = String(selectedDay).padStart(2, '0');
    const mm = String(selectedMonth).padStart(2, '0');
    onConfirm(`${dd}-${mm}-${selectedYear}`);
  };

  const bg = dark ? COLORS.dark1 : COLORS.white;
  const txt = dark ? COLORS.white : COLORS.black;
  const border = dark ? COLORS.dark3 : COLORS.greyscale300;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: bg, borderTopColor: border }]}>
          {/* Titre */}
          <Text style={[styles.title, { color: txt }]}>Date de naissance</Text>

          {/* Labels colonnes */}
          <View style={styles.labelsRow}>
            <Text style={[styles.colLabel, { color: COLORS.primary }]}>Année</Text>
            <Text style={[styles.colLabel, { color: COLORS.primary }]}>Mois</Text>
            <Text style={[styles.colLabel, { color: COLORS.primary }]}>Jour</Text>
          </View>

          {/* Pickers */}
          <View style={[styles.pickersRow, { borderColor: border }]}>
            {/* Année */}
            <View style={styles.pickerCol}>
              <Picker
                selectedValue={selectedYear}
                onValueChange={(v) => setSelectedYear(Number(v))}
                style={[styles.picker, { color: txt }]}
                itemStyle={{ color: txt, fontSize: 16 }}
                dropdownIconColor={txt}
              >
                {YEARS.map((y) => (
                  <Picker.Item key={y} label={String(y)} value={y} />
                ))}
              </Picker>
            </View>

            {/* Mois */}
            <View style={styles.pickerCol}>
              <Picker
                selectedValue={selectedMonth}
                onValueChange={(v) => setSelectedMonth(Number(v))}
                style={[styles.picker, { color: txt }]}
                itemStyle={{ color: txt, fontSize: 16 }}
                dropdownIconColor={txt}
              >
                {MONTHS.map((m, i) => (
                  <Picker.Item key={i} label={m} value={i + 1} />
                ))}
              </Picker>
            </View>

            {/* Jour */}
            <View style={[styles.pickerCol, styles.pickerColSmall]}>
              <Picker
                selectedValue={selectedDay}
                onValueChange={(v) => setSelectedDay(Number(v))}
                style={[styles.picker, { color: txt }]}
                itemStyle={{ color: txt, fontSize: 16 }}
                dropdownIconColor={txt}
              >
                {DAYS.map((d) => (
                  <Picker.Item key={d} label={String(d).padStart(2, '0')} value={d} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Boutons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel, { borderColor: border }]}
              onPress={onCancel}
            >
              <Text style={[styles.btnText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Annuler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnConfirm, { backgroundColor: COLORS.primary }]}
              onPress={handleConfirm}
            >
              <Text style={[styles.btnText, { color: COLORS.white }]}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  colLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  pickersRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  pickerCol: {
    flex: 2,
  },
  pickerColSmall: {
    flex: 1,
  },
  picker: {
    width: '100%',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    borderWidth: 1,
  },
  btnConfirm: {},
  btnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BirthDatePicker;
