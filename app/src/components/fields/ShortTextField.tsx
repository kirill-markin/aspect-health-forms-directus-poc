import React from 'react';
import { TextInput } from 'react-native-paper';
import { Question } from '../../api/directus';

interface ShortTextFieldProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

const ShortTextField: React.FC<ShortTextFieldProps> = ({ question, value, onChange }) => {
  const settings = question.settings_json || {};
  
  return (
    <TextInput
      mode="outlined"
      label={question.label}
      value={value || ''}
      onChangeText={onChange}
      placeholder={settings.placeholder || ''}
      multiline={false}
      autoCapitalize="sentences"
      autoCorrect={true}
      style={{ marginBottom: 16 }}
    />
  );
};

export default ShortTextField;