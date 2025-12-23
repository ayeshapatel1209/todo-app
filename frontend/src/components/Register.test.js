import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Register from './Register';
import API from '../api';

// Mock the API module
jest.mock('../api');

describe('Register Component', () => {
  const mockOnSwitchToLogin = jest.fn();
  const mockOnRegisterSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form', () => {
    render(
      <Register
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegisterSuccess={mockOnRegisterSuccess}
      />
    );

   expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();

    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-button')).toBeInTheDocument();
  });

  test('displays error when fields are empty', async () => {
    render(
      <Register
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegisterSuccess={mockOnRegisterSuccess}
      />
    );

    const submitButton = screen.getByTestId('register-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  test('displays error when passwords do not match', async () => {
    render(
      <Register
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegisterSuccess={mockOnRegisterSuccess}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'password456' },
    });

    fireEvent.click(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  test('displays error for invalid email format', async () => {
    render(
      <Register
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegisterSuccess={mockOnRegisterSuccess}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  test('displays error for short password', async () => {
    render(
      <Register
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegisterSuccess={mockOnRegisterSuccess}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: '12345' },
    });

    fireEvent.click(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  test('successful registration', async () => {
    API.post.mockResolvedValueOnce({ data: { id: 1, email: 'test@example.com' } });

    render(
      <Register
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegisterSuccess={mockOnRegisterSuccess}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(screen.getByText(/Registration successful/i)).toBeInTheDocument();
    });

    // Wait for redirect
    await waitFor(() => {
      expect(mockOnRegisterSuccess).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });
  });

  test('handles email already registered error', async () => {
    API.post.mockRejectedValueOnce({
      response: { status: 400, data: { detail: 'Email already registered' } },
    });

    render(
      <Register
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegisterSuccess={mockOnRegisterSuccess}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });

  test('handles network error', async () => {
    API.post.mockRejectedValueOnce({ request: {} });

    render(
      <Register
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegisterSuccess={mockOnRegisterSuccess}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(screen.getByText(/Cannot connect to server/i)).toBeInTheDocument();
    });
  });

  test('switch to login button works', () => {
    render(
      <Register
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegisterSuccess={mockOnRegisterSuccess}
      />
    );

    fireEvent.click(screen.getByTestId('switch-to-login'));
    expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1);
  });

  test('shows loading state during submission', async () => {
    API.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <Register
        onSwitchToLogin={mockOnSwitchToLogin}
        onRegisterSuccess={mockOnRegisterSuccess}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('register-button'));

    expect(screen.getByText(/Creating account/i)).toBeInTheDocument();
    expect(screen.getByTestId('register-button')).toBeDisabled();
  });
});