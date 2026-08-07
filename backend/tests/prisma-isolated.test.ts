import prisma from '../src/utils/prisma';

// TIDAK ADA beforeAll, TIDAK ADA afterAll
// HANYA 1 test sederhana untuk cek koneksi

test('Prisma should connect to database', async () => {
  console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
  console.log('🔍 Prisma client type:', typeof prisma);
  
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('✅ Query result:', result);
    expect(result).toBeDefined();
    
    // Disconnect immediately after test to clean up
    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Query error:', error.message);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
}, 10000); // 10 seconds timeout
