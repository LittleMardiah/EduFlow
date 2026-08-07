describe('Environment Check', () => {
  test('Should have DATABASE_URL defined', () => {
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 DATABASE_URL exists?', !!process.env.DATABASE_URL);
    console.log('🔍 DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
    console.log('🔍 DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL?.length).toBeGreaterThan(0);
  });
});
