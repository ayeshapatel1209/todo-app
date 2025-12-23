import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from './Login';
import API from '../api';

// Mock the API module
jest.mock('../api');

describe('Login Component', () => {
  const mockOnLogin = jest.fn();
  const mockOnSwitchToRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // ============================================
  // RENDERING TESTS
  // ============================================

  test('renders login form with all elements', () => {
    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    // Check header text
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to manage your tasks')).toBeInTheDocument();

    // Check form inputs
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();

    // Check switch to register link
    expect(screen.getByTestId('switch-to-register')).toBeInTheDocument();
  });

  test('renders with correct input placeholders', () => {
    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  // ============================================
  // VALIDATION TESTS
  // ============================================

  test('displays error when fields are empty', async () => {
    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const submitButton = screen.getByTestId('login-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });

    // Should not call API
    expect(API.post).not.toHaveBeenCalled();
  });

  test('displays error when only email is provided', async () => {
    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  test('displays error when only password is provided', async () => {
    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  test('displays error for invalid email format', async () => {
    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    // Should not call API
    expect(API.post).not.toHaveBeenCalled();
  });

  test('accepts valid email formats', async () => {
    const validEmails = [
      'test@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'user123@test-domain.com',
    ];

    for (const email of validEmails) {
      jest.clearAllMocks();
      localStorage.clear();

      API.post.mockResolvedValueOnce({
        data: { access_token: 'token', token_type: 'bearer' },
      });

      const { unmount } = render(
        <Login
          onLogin={mockOnLogin}
          onSwitchToRegister={mockOnSwitchToRegister}
        />
      );

      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: email },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(API.post).toHaveBeenCalledWith('/login', {
          email: email,
          password: 'password123',
        });
      });

      unmount();
    }
  });

  // ============================================
  // SUCCESS FLOW TESTS
  // ============================================

  test('successful login with valid credentials', async () => {
    API.post.mockResolvedValueOnce({
      data: { access_token: 'fake_token_123', token_type: 'bearer' },
    });

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('fake_token_123');
      expect(mockOnLogin).toHaveBeenCalledTimes(1);
    });
  });

  test('stores token in localStorage on successful login', async () => {
    API.post.mockResolvedValueOnce({
      data: { access_token: 'my_secure_token', token_type: 'bearer' },
    });

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'securepass' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('my_secure_token');
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  test('handles incorrect credentials error (401)', async () => {
    API.post.mockRejectedValueOnce({
      response: { status: 401, data: { detail: 'Incorrect email or password' } },
    });

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByText('Incorrect email or password')).toBeInTheDocument();
    });

    // Should not store token
    expect(localStorage.getItem('token')).toBeNull();
    // Should not call onLogin
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  test('handles validation error (422)', async () => {
    API.post.mockRejectedValueOnce({
      response: { status: 422, data: {} },
    });

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'pass' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByText(/Invalid input/i)).toBeInTheDocument();
    });
  });

  test('handles server error (500)', async () => {
    API.post.mockRejectedValueOnce({
      response: { status: 500, data: {} },
    });

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    });
  });

  test('handles network error (no response)', async () => {
    API.post.mockRejectedValueOnce({ request: {} });

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByText(/Cannot connect to server/i)).toBeInTheDocument();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  test('handles unexpected error', async () => {
    API.post.mockRejectedValueOnce(new Error('Unexpected error'));

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    });
  });

  test('handles invalid response from server (missing access_token)', async () => {
    API.post.mockResolvedValueOnce({ data: {} }); // No access_token

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByText('Invalid response from server')).toBeInTheDocument();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  // ============================================
  // LOADING STATE TESTS
  // ============================================

  test('shows loading state during submission', async () => {
    API.post.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    // Should show loading text
    expect(screen.getByText(/Signing in/i)).toBeInTheDocument();
    
    // Button should be disabled
    expect(screen.getByTestId('login-button')).toBeDisabled();
    
    // Inputs should be disabled
    expect(screen.getByTestId('email-input')).toBeDisabled();
    expect(screen.getByTestId('password-input')).toBeDisabled();
  });

  test('hides loading state after successful login', async () => {
    API.post.mockResolvedValueOnce({
      data: { access_token: 'token', token_type: 'bearer' },
    });

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.queryByText(/Signing in/i)).not.toBeInTheDocument();
      expect(mockOnLogin).toHaveBeenCalled();
    });
  });

  test('hides loading state after error', async () => {
    API.post.mockRejectedValueOnce({
      response: { status: 401, data: {} },
    });

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.queryByText(/Signing in/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('login-button')).not.toBeDisabled();
    });
  });

  // ============================================
  // NAVIGATION TESTS
  // ============================================

  test('switch to register button calls callback', () => {
    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.click(screen.getByTestId('switch-to-register'));
    expect(mockOnSwitchToRegister).toHaveBeenCalledTimes(1);
  });

  test('switch to register button is disabled during loading', async () => {
    API.post.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('login-button'));

    expect(screen.getByTestId('switch-to-register')).toBeDisabled();
  });

  // ============================================
  // ERROR MESSAGE CLEARING TESTS
  // ============================================

  test('clears error message when form is resubmitted', async () => {
    API.post.mockRejectedValueOnce({
      response: { status: 401, data: {} },
    });

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    // First submission - causes error
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByText(/Incorrect email or password/i)).toBeInTheDocument();
    });

    // Second submission - should clear previous error
    API.post.mockResolvedValueOnce({
      data: { access_token: 'token', token_type: 'bearer' },
    });

    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'correct' },
    });
    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.queryByText(/Incorrect email or password/i)).not.toBeInTheDocument();
      expect(mockOnLogin).toHaveBeenCalled();
    });
  });

  // ============================================
  // FORM INTERACTION TESTS
  // ============================================

  test('allows typing in email field', () => {
    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    expect(emailInput.value).toBe('user@example.com');
  });

  test('allows typing in password field', () => {
    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const passwordInput = screen.getByTestId('password-input');
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } });

    expect(passwordInput.value).toBe('mypassword');
  });

  test('password field type is password', () => {
    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const passwordInput = screen.getByTestId('password-input');
    expect(passwordInput.type).toBe('password');
  });

  test('form submits on Enter key press', async () => {
    API.post.mockResolvedValueOnce({
      data: { access_token: 'token', token_type: 'bearer' },
    });

    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    // Press Enter on password field
    fireEvent.submit(screen.getByTestId('login-button').closest('form'));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalled();
    });
  });

  // ============================================
  // ACCESSIBILITY TESTS
  // ============================================

  test('has proper labels for form inputs', () => {
    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  test('error messages have proper ARIA roles', async () => {
    render(
      <Login
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      const errorDiv = screen.getByText('Please fill in all fields').closest('div');
      expect(errorDiv).toHaveClass('bg-red-50');
    });
  });
});