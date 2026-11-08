import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  vue: true,
  // Templater templates are JavaScript inside <%* %>; the Markdown formatter would break them
  ignores: ['docs/obsidian-template/模板/**'],
}, {
  // The Worker logs to Cloudflare's observability with console
  files: ['worker/**/*.ts'],
  rules: {
    'no-console': 'off',
  },
})
