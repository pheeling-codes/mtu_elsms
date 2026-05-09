import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const config = {
  datasources: {
    db: {
      url: connectionString,
    },
  },
}

export default {
  datasources: {
    db: {
      url: connectionString,
    },
  },
} satisfies import('@prisma/adapter').PrismaAdapterDefinition
