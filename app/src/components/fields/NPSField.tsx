import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
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
      buttons.push(
        <Button
          key={i}
          mode={value === i ? 'contained' : 'outlined'}
          onPress={() => onChange(i)}
          style={[
            styles.scaleButton,
            value === i && styles.selectedButton
          ]}
          compact
        >
          {i}
        </Button>
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scaleButton: {
    minWidth: 40,
    marginHorizontal: 2,
    marginVertical: 4,
  },
  selectedButton: {
    elevation: 2,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  minLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'left',
  },
  maxLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
});

export default NPSField;