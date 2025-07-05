import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../ui';
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
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
        >
          <Text 
            variant="body" 
            style={[
              styles.buttonText,
              isSelected && styles.selectedButtonText
            ]}
          >
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
        <Text variant="small" style={styles.minLabel}>{minLabel}</Text>
        <Text variant="small" style={styles.maxLabel}>{maxLabel}</Text>
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
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  scaleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8E9EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    outline: 'none',
    outlineWidth: 0,
  },
  selectedButton: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  selectedButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  minLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
  },
  maxLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});

export default NPSField;