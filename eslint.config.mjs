import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  vue: true,
}, {
  // The Worker logs to Cloudflare's observability with console
  files: ['worker/**/*.ts'],
  rules: {
    'no-console': 'off',
  },
})
