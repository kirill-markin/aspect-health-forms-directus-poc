import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { Question, QuestionChoice } from '../../api/directus';

interface MultipleChoiceFieldProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

const MultipleChoiceField: React.FC<MultipleChoiceFieldProps> = ({ question, value, onChange }) => {
  const choices: QuestionChoice[] = question.choices || [];
  
  return (
    <View style={styles.container}>
      <RadioButton.Group onValueChange={onChange} value={value || ''}>
        {choices.map((choice: QuestionChoice) => (
          <View key={choice.id} style={styles.choiceContainer}>
            <RadioButton.Item
              label={choice.label}
              value={choice.value}
              style={styles.radioItem}
            />
          </View>
        ))}
      </RadioButton.Group>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  choiceContainer: {
    marginBottom: 8,
  },
  radioItem: {
    paddingVertical: 8,
  },
});

export default MultipleChoiceField;