/**
 * Login Form Component
 * Interactive form for user authentication
 * Uses SolidJS for reactive state management
 */
import { createSignal, Show } from 'solid-js';
import { authService } from '../lib/client/authService';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginForm() {
  const [formData, setFormData] = createSignal<FormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = createSignal<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Update form field
  const updateField = (field: keyof FormData, value: string) => {
    setFormData({ ...formData(), [field]: value });
    // Clear error for this field when user starts typing
    if (errors()[field as keyof FormErrors]) {
      setErrors({ ...errors(), [field]: undefined });
    }
  };

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const data = formData();

    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!data.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const data = formData();
      const response = await authService.login(data.email, data.password);

      // Success - redirect based on user role
      const redirectPath = authService.getRoleBasedRedirect(response.user.role);
      window.location.href = redirectPath;

    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setErrors({ general: errorMessage });
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Show when={errors().general}>
        <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {errors().general}
        </div>
      </Show>

      <form onSubmit={handleSubmit} class="space-y-6">
        {/* Email */}
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">
            Email Address <span class="text-primary-orange">*</span>
          </label>
          <input
            type="email"
            value={formData().email}
            onInput={(e) => updateField('email', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent text-gray-900 bg-white"
            placeholder="john.doe@company.com"
            autocomplete="email"
          />
          <Show when={errors().email}>
            <p class="text-red-600 text-sm mt-1">{errors().email}</p>
          </Show>
        </div>

        {/* Password */}
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-sm font-medium text-text-primary">
              Password <span class="text-primary-orange">*</span>
            </label>
            <a href="/forgot-password" class="text-sm text-primary-orange hover:underline">
              Forgot password?
            </a>
          </div>
          <input
            type="password"
            value={formData().password}
            onInput={(e) => updateField('password', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent text-gray-900 bg-white"
            placeholder="Enter your password"
            autocomplete="current-password"
          />
          <Show when={errors().password}>
            <p class="text-red-600 text-sm mt-1">{errors().password}</p>
          </Show>
        </div>

        {/* Submit Button */}
        <div class="pt-4">
          <button
            type="submit"
            disabled={isSubmitting()}
            class="w-full bg-primary-orange text-white font-semibold py-3 px-6 rounded-md hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-ca-md"
          >
            {isSubmitting() ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        {/* Demo Credentials */}
        <div class="bg-blue-50 border border-blue-200 rounded p-4">
          <p class="text-sm font-semibold text-blue-900 mb-2">Demo Credentials:</p>
          <div class="text-xs text-blue-800 space-y-1">
            <p><strong>Owner:</strong> owner@demo.com / password123</p>
            <p><strong>GC:</strong> gc@demo.com / password123</p>
            <p><strong>Architect:</strong> architect@demo.com / password123</p>
            <p><strong>Subcontractor:</strong> sub@demo.com / password123</p>
          </div>
        </div>
      </form>
    </div>
  );
}
