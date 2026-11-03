import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  vue: true,
}, {
  // Backend runs on Node and uses process/Buffer globals and console logging directly
  files: ['server/**/*.ts'],
  rules: {
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
    'no-console': 'off',
  },
})
