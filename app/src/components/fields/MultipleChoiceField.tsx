import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../ui';
import { Question, QuestionChoice } from '../../api/directus';

interface MultipleChoiceFieldProps {
  question: Question;
  value: string[];
  onChange: (value: string[]) => void;
}

const MultipleChoiceField: React.FC<MultipleChoiceFieldProps> = ({ question, value = [], onChange }) => {
  console.log('☑️ MultipleChoiceField: rendering with value:', value, 'for question:', question.uid);
  const choices: QuestionChoice[] = question.choices || [];
  
  const handleChoiceToggle = (choiceValue: string) => {
    console.log('☑️ MultipleChoiceField: handleChoiceToggle called with:', choiceValue);
    console.log('☑️ MultipleChoiceField: current value:', value);
    
    const currentSelection = Array.isArray(value) ? value : [];
    const isSelected = currentSelection.includes(choiceValue);
    
    if (isSelected) {
      // Remove from selection
      const newSelection = currentSelection.filter(v => v !== choiceValue);
      console.log('☑️ MultipleChoiceField: removing choice, new selection:', newSelection);
      onChange(newSelection);
    } else {
      // Add to selection
      const newSelection = [...currentSelection, choiceValue];
      console.log('☑️ MultipleChoiceField: adding choice, new selection:', newSelection);
      onChange(newSelection);
    }
  };
  
  // Checkmark component
  const CheckmarkIcon = () => (
    <View style={styles.checkmarkContainer}>
      <View style={[styles.checkmarkLine, styles.checkmarkShort]} />
      <View style={[styles.checkmarkLine, styles.checkmarkLong]} />
    </View>
  );
  
  return (
    <View style={styles.container}>
      {choices.map((choice: QuestionChoice) => {
        const currentSelection = Array.isArray(value) ? value : [];
        const isSelected = currentSelection.includes(choice.value);
        return (
          <TouchableOpacity
            key={choice.id}
            style={[
              styles.choiceButton,
              isSelected && styles.selectedChoice
            ]}
            onPress={() => handleChoiceToggle(choice.value)}
          >
            <View style={[
              styles.checkbox,
              isSelected && styles.selectedCheckbox
            ]}>
              {isSelected && <CheckmarkIcon />}
            </View>
            <Text 
              variant="body" 
              color={isSelected ? '#1A202C' : '#4A5568'}
              style={[
                styles.choiceText,
                isSelected && styles.selectedChoiceText
              ]}
            >
              {choice.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  selectedChoice: {
    backgroundColor: '#EBF8FF',
    borderColor: '#0066CC',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckbox: {
    borderColor: '#0066CC',
    backgroundColor: '#0066CC',
  },
  checkmarkContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkLine: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
  },
  checkmarkShort: {
    width: 2,
    height: 6,
    transform: [{ rotate: '45deg' }],
    left: 5,
    top: 7,
  },
  checkmarkLong: {
    width: 2,
    height: 10,
    transform: [{ rotate: '-45deg' }],
    right: 3,
    top: 3,
  },
  choiceText: {
    fontSize: 16,
    color: '#4A5568',
    flex: 1,
    lineHeight: 22,
  },
  selectedChoiceText: {
    color: '#1A202C',
    fontWeight: '500',
  },
});

export default MultipleChoiceField;