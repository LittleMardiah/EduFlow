import { login } from '../src/services/auth.service';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('DEBUG: Login Structure Return', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('CEK: Lihat struktur return dari login() function', async () => {
    // Setup: buat user dengan password yang bisa dicek
    const hashedPassword = await bcrypt.hash('TestPass123!', 12);
    
    await prisma.user.create({
      data: {
        email: 'debug@example.com',
        password_hash: hashedPassword,
        first_name: 'Debug',
        last_name: 'User',
        role: 'student',
        status: 'active',
      },
    });

    // CALL login() dengan password yang benar
    console.log('\n\n========== CEK: LOGIN() RETURN STRUCTURE ==========');
    const loginResult = await login('debug@example.com', 'TestPass123!');
    
    console.log('\n📊 FULL RETURN VALUE:');
    console.log(JSON.stringify(loginResult, null, 2));
    
    console.log('\n🔍 STRUKTUR ANALYSIS:');
    console.log('Top level keys:', Object.keys(loginResult));
    console.log('Has "user" top level?', 'user' in loginResult);
    console.log('Has "token" top level?', 'token' in loginResult);
    console.log('Has "success"?', 'success' in loginResult);
    console.log('Has "data"?', 'data' in loginResult);
    console.log('Has "error"?', 'error' in loginResult);
    
    if ('data' in loginResult && loginResult.data) {
      console.log('\n🔍 Inside .data:');
      console.log('  - Has "user"?', 'user' in loginResult.data);
      console.log('  - Has "token"?', 'token' in loginResult.data);
    }
    
    console.log('\n🧪 TEST DESTRUCTURING (seperti controller):');
    try {
      const { user, token } = loginResult;
      console.log('Result dari { user, token } = loginResult:');
      console.log('  - user:', user ? 'DEFINED' : 'UNDEFINED ❌');
      console.log('  - token:', token ? 'DEFINED' : 'UNDEFINED ❌');
    } catch (err: any) {
      console.log('❌ Error:', err.message);
    }
    
    console.log('\n========== SELESAI ==========\n');
    expect(loginResult).toBeDefined();
  });
});
