import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput } from '../ui';
import { Question } from '../../api/directus';

interface ShortTextFieldProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

const ShortTextField: React.FC<ShortTextFieldProps> = ({ question, value, onChange }) => {
  const settings = question.settings_json || {};
  const [localValue, setLocalValue] = useState(value || '');
  
  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);
  
  // Handle text input change - update both local and parent state immediately
  const handleTextChange = (text: string) => {
    setLocalValue(text);
    onChange(text); // Update parent state for canProceed logic
  };
  
  return (
    <View style={styles.container}>
      <TextInput
        variant="outlined"
        value={localValue}
        onChangeText={handleTextChange}
        placeholder={settings.placeholder || 'Enter your answer...'}
        multiline={false}
        autoCapitalize="sentences"
        autoCorrect={true}
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F7FAFC',
  },
});

export default ShortTextField;