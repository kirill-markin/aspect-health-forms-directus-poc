import React from 'react';
import { TextInput } from 'react-native-paper';
import { Question } from '../../api/directus';

interface LongTextFieldProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

const LongTextField: React.FC<LongTextFieldProps> = ({ question, value, onChange }) => {
  const settings = question.settings_json || {};
  
  return (
    <TextInput
      mode="outlined"
      label={question.label}
      value={value || ''}
      onChangeText={onChange}
      placeholder={settings.placeholder || ''}
      multiline={true}
      numberOfLines={4}
      autoCapitalize="sentences"
      autoCorrect={true}
      style={{ marginBottom: 16 }}
    />
  );
};

export default LongTextField;