import prisma from '../src/utils/prisma';

describe('Prisma Connection Check', () => {
  test('Should connect to database', async () => {
    console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
    console.log('🔍 Prisma client type:', typeof prisma);
    console.log('🔍 Prisma client constructor:', prisma.constructor.name);
    
    try {
      const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
      console.log('✅ Query result:', result);
      expect(result).toBeDefined();
    } catch (error: any) {
      console.error('❌ Query error:', error.message);
      throw error;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
