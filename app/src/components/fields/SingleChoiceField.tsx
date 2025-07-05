import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../ui';
import { Question, QuestionChoice } from '../../api/directus';

interface SingleChoiceFieldProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

const SingleChoiceField: React.FC<SingleChoiceFieldProps> = ({ question, value, onChange }) => {
  console.log('📻 SingleChoiceField: rendering with value:', value, 'for question:', question.uid);
  const choices: QuestionChoice[] = question.choices || [];
  
  const handleChoiceSelect = (choiceValue: string) => {
    console.log('📻 SingleChoiceField: choice selected:', choiceValue, 'for question:', question.uid);
    onChange(choiceValue);
  };
  
  return (
    <View style={styles.container}>
      {choices.map((choice: QuestionChoice) => {
        const isSelected = value === choice.value;
        return (
          <TouchableOpacity
            key={choice.id}
            style={[
              styles.choiceButton,
              isSelected && styles.selectedChoice
            ]}
            onPress={() => handleChoiceSelect(choice.value)}
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
    textAlign: 'center',
    lineHeight: 24,
  },
  selectedChoiceText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default SingleChoiceField; 