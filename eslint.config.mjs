import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  vue: true,
}, {
  // 后端运行在 Node 上，直接使用 process / Buffer 全局变量，日志也需要 console.log
  files: ['server/**/*.ts'],
  rules: {
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
    'no-console': 'off',
  },
})
