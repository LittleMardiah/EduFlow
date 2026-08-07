import prisma1 from '../src/utils/prisma';
import { PrismaClient } from '@prisma/client';

describe('Prisma Instances Check', () => {
  test('Should identify if instances are different', async () => {
    const prisma2 = new PrismaClient();
    const prisma3 = new PrismaClient();
    
    console.log('🔍 prisma1 (singleton) constructor:', prisma1.constructor.name);
    console.log('🔍 prisma2 (new) constructor:', prisma2.constructor.name);
    console.log('🔍 prisma3 (new) constructor:', prisma3.constructor.name);
    console.log('🔍 prisma1 === prisma2?', prisma1 === prisma2);
    console.log('🔍 prisma2 === prisma3?', prisma2 === prisma3);
    
    expect(prisma1).toBeDefined();
    expect(prisma2).toBeDefined();
  });

  afterAll(async () => {
    await prisma1.$disconnect();
  });
});
