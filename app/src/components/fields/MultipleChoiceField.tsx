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
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
          >
            <Text 
              variant="body" 
              style={[
                styles.choiceText,
                isSelected && styles.selectedChoiceText
              ]}
            >
              {choice.label}
            </Text>
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
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
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8E9EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    outline: 'none',
    outlineWidth: 0,
  },
  selectedChoice: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  choiceText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    flex: 1,
    lineHeight: 24,
  },
  selectedChoiceText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmark: {
    fontSize: 14,
    color: '#FF6B9D',
    fontWeight: 'bold',
  },
});

export default MultipleChoiceField;