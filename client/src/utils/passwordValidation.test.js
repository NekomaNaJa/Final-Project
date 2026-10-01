import { passwordRules, isPasswordValid, getPasswordError } from './passwordValidation';

describe('passwordValidation utility', () => {
  describe('passwordRules', () => {
    it('should validate minimum length rule', () => {
      const lengthRule = passwordRules.find((r) => r.id === 'length');
      expect(lengthRule.test('1234567')).toBe(false);
      expect(lengthRule.test('12345678')).toBe(true);
    });

    it('should validate lowercase rule', () => {
      const lowerRule = passwordRules.find((r) => r.id === 'lowercase');
      expect(lowerRule.test('ABCDEFG1!')).toBe(false);
      expect(lowerRule.test('ABCDefg1!')).toBe(true);
    });

    it('should validate uppercase rule', () => {
      const upperRule = passwordRules.find((r) => r.id === 'uppercase');
      expect(upperRule.test('abcdefg1!')).toBe(false);
      expect(upperRule.test('Abcdefg1!')).toBe(true);
    });

    it('should validate number rule', () => {
      const numRule = passwordRules.find((r) => r.id === 'number');
      expect(numRule.test('Abcdefgh!')).toBe(false);
      expect(numRule.test('Abcdefg1!')).toBe(true);
    });

    it('should validate special character rule', () => {
      const specialRule = passwordRules.find((r) => r.id === 'special');
      expect(specialRule.test('Abcdefg12')).toBe(false);
      expect(specialRule.test('Abcdefg1!')).toBe(true);
      expect(specialRule.test('Abc_1234')).toBe(true);
    });
  });

  describe('isPasswordValid', () => {
    it('should return false for invalid password', () => {
      expect(isPasswordValid('weak')).toBe(false);
      expect(isPasswordValid('NoSpecial123')).toBe(false);
    });

    it('should return true for valid strong password', () => {
      expect(isPasswordValid('Pass@word123')).toBe(true);
    });
  });

  describe('getPasswordError', () => {
    it('should return appropriate error message when a rule fails', () => {
      expect(getPasswordError('short')).toBe('รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร');
      expect(getPasswordError('12345678')).toBe('รหัสผ่านต้องมีตัวพิมพ์เล็ก (a-z)');
      expect(getPasswordError('abcdefgh')).toBe('รหัสผ่านต้องมีตัวพิมพ์ใหญ่ (A-Z)');
      expect(getPasswordError('Abcdefgh')).toBe('รหัสผ่านต้องมีตัวเลข (0-9)');
      expect(getPasswordError('Abcdefg1')).toBe('รหัสผ่านต้องมีอักขระพิเศษ (!@#$%^&* เป็นต้น)');
    });

    it('should return empty string when password is valid', () => {
      expect(getPasswordError('Pass@word123')).toBe('');
    });

    it('should return a prompt message when password is empty', () => {
      expect(getPasswordError('')).toBe('กรุณากรอกรหัสผ่าน');
    });

    it('should return a prompt message when password is not a string', () => {
      expect(getPasswordError(undefined)).toBe('กรุณากรอกรหัสผ่าน');
      expect(getPasswordError(12345678)).toBe('กรุณากรอกรหัสผ่าน');
      expect(getPasswordError(null)).toBe('กรุณากรอกรหัสผ่าน');
    });
  });

  describe('isPasswordValid with non-string input', () => {
    it('should return false when password is not a string', () => {
      expect(isPasswordValid(undefined)).toBe(false);
      expect(isPasswordValid(null)).toBe(false);
      expect(isPasswordValid(12345678)).toBe(false);
    });
  });
});
