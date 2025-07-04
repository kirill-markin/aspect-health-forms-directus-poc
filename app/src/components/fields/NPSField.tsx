import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Question } from '../../api/directus';

interface NPSFieldProps {
  question: Question;
  value: number;
  onChange: (value: number) => void;
}

const NPSField: React.FC<NPSFieldProps> = ({ question, value, onChange }) => {
  const settings = question.settings_json || {};
  const min = settings.min || 0;
  const max = settings.max || 10;
  const minLabel = settings.min_label || 'Not likely';
  const maxLabel = settings.max_label || 'Very likely';
  
  const renderScaleButtons = () => {
    const buttons = [];
    for (let i = min; i <= max; i++) {
      const isSelected = value === i;
      buttons.push(
        <TouchableOpacity
          key={i}
          onPress={() => onChange(i)}
          style={[
            styles.scaleButton,
            isSelected && styles.selectedButton
          ]}
        >
          <Text style={[
            styles.buttonText,
            isSelected && styles.selectedButtonText
          ]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    return buttons;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.scaleContainer}>
        {renderScaleButtons()}
      </View>
      
      <View style={styles.labelContainer}>
        <Text style={styles.minLabel}>{minLabel}</Text>
        <Text style={styles.maxLabel}>{maxLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  scaleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  selectedButton: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
  },
  selectedButtonText: {
    color: '#FFFFFF',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  minLabel: {
    fontSize: 14,
    color: '#718096',
    flex: 1,
    textAlign: 'left',
  },
  maxLabel: {
    fontSize: 14,
    color: '#718096',
    flex: 1,
    textAlign: 'right',
  },
});

export default NPSField;