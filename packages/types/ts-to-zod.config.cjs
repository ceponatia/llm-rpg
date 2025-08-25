/* eslint-env node */
module.exports = [
  {
    name: 'common',
    input: 'src/common.ts',
    output: 'src/zod/common.zod.ts'
  },
  {
    name: 'memory',
    input: 'src/memory.ts',
    output: 'src/zod/memory.zod.ts'
  },
  {
    name: 'chat',
    input: 'src/chat.ts',
    output: 'src/zod/chat.zod.ts'
  },
  {
    name: 'mca',
    input: 'src/mca.ts',
    output: 'src/zod/mca.zod.ts'
  }
];
