import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrate: {
    async url() {
      return process.env.DIRECT_URL ?? process.env.DATABASE_URL!
    },
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
