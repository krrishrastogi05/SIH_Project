import { AuthService } from './modules/auth/auth.service.js';

async function testAuth() {
  const authService = new AuthService();

  try {
    console.log('Testing Registration...');
    const registered = await authService.register({
      email: 'test@example.com',
      password: 'Test123!@#',
      name: 'Test User',
      role: 'BENEFICIARY'
    });
    console.log('✓ Registration successful:', registered.user.email);

    console.log('\nTesting Login...');
    const loggedIn = await authService.login({
      email: 'test@example.com',
      password: 'Test123!@#'
    });
    console.log('✓ Login successful:', loggedIn.user.email);

    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error);
  }
}

testAuth();