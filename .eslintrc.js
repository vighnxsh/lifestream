module.exports = {
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    // Disable specific rules that are causing issues
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn', // Downgrade to warning instead of error
    'react/no-unescaped-entities': ['error', { 'forbid': ['>', '"', '}'] }], // Allow apostrophes
    '@typescript-eslint/no-empty-object-type': 'warn'
  }
}
