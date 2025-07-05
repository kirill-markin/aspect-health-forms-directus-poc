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
  const choices: QuestionChoice[] = question.choices || [];
  
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
            onPress={() => onChange(choice.value)}
          >
            <View style={[
              styles.radioCircle,
              isSelected && styles.selectedRadio
            ]}>
              {isSelected && <View style={styles.radioDot} />}
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
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: '#0066CC',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0066CC',
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

export default SingleChoiceField; 