/**
 * Registration Form Component
 * Interactive form for user registration with role selection
 * Uses SolidJS for reactive state management
 */
import { createSignal, Show, For } from 'solid-js';
import type { UserRole } from '../lib/db/schemas/User';
import { authService } from '../lib/client/authService';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole | '';
  companyName: string;
  trade: string; // For subcontractors
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  general?: string;
}

const roles = [
  { value: 'OWNER', label: 'Owner', description: 'Project financier/client' },
  { value: 'ARCHITECT', label: 'Architect/Design Team/Consultant', description: 'Design professional' },
  { value: 'GC', label: 'General Contractor', description: 'Prime contractor' },
  { value: 'SUB', label: 'Subcontractor', description: 'Specialty trade contractor' }
];

const trades = [
  'Electrical',
  'Plumbing',
  'HVAC',
  'Carpentry',
  'Concrete',
  'Masonry',
  'Roofing',
  'Painting',
  'Steel',
  'Other'
];

export default function RegistrationForm() {
  const [formData, setFormData] = createSignal<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: '',
    companyName: '',
    trade: ''
  });

  const [errors, setErrors] = createSignal<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [submitSuccess, setSubmitSuccess] = createSignal(false);

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

    if (!data.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!data.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!data.password) {
      newErrors.password = 'Password is required';
    } else if (data.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!data.role) {
      newErrors.role = 'Please select a role';
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
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData()),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({ general: result.message || 'Registration failed. Please try again.' });
        setIsSubmitting(false);
        return;
      }

      // Store authentication tokens
      if (result.accessToken && result.refreshToken) {
        authService.setAuth(
          {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          },
          result.user
        );
      }

      // Success - show success message
      setSubmitSuccess(true);

      // Redirect based on user role after 2 seconds (user is now logged in)
      const redirectPath = authService.getRoleBasedRedirect(result.user.role);
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Show when={submitSuccess()}>
        <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
          <p class="font-semibold">Registration successful!</p>
          <p class="text-sm">Please check your email to verify your account.</p>
        </div>
      </Show>

      <Show when={errors().general}>
        <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {errors().general}
        </div>
      </Show>

      <form onSubmit={handleSubmit} class="space-y-6">
        {/* Personal Information */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              First Name <span class="text-primary-orange">*</span>
            </label>
            <input
              type="text"
              value={formData().firstName}
              onInput={(e) => updateField('firstName', e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              placeholder="John"
            />
            <Show when={errors().firstName}>
              <p class="text-red-600 text-sm mt-1">{errors().firstName}</p>
            </Show>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Last Name <span class="text-primary-orange">*</span>
            </label>
            <input
              type="text"
              value={formData().lastName}
              onInput={(e) => updateField('lastName', e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              placeholder="Doe"
            />
            <Show when={errors().lastName}>
              <p class="text-red-600 text-sm mt-1">{errors().lastName}</p>
            </Show>
          </div>
        </div>

        {/* Email */}
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">
            Email Address <span class="text-primary-orange">*</span>
          </label>
          <input
            type="email"
            value={formData().email}
            onInput={(e) => updateField('email', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
            placeholder="john.doe@company.com"
          />
          <Show when={errors().email}>
            <p class="text-red-600 text-sm mt-1">{errors().email}</p>
          </Show>
        </div>

        {/* Phone */}
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={formData().phone}
            onInput={(e) => updateField('phone', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Password */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Password <span class="text-primary-orange">*</span>
            </label>
            <input
              type="password"
              value={formData().password}
              onInput={(e) => updateField('password', e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              placeholder="Min. 8 characters"
            />
            <Show when={errors().password}>
              <p class="text-red-600 text-sm mt-1">{errors().password}</p>
            </Show>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Confirm Password <span class="text-primary-orange">*</span>
            </label>
            <input
              type="password"
              value={formData().confirmPassword}
              onInput={(e) => updateField('confirmPassword', e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
              placeholder="Re-enter password"
            />
            <Show when={errors().confirmPassword}>
              <p class="text-red-600 text-sm mt-1">{errors().confirmPassword}</p>
            </Show>
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label class="block text-sm font-medium text-text-primary mb-3">
            Select Your Role <span class="text-primary-orange">*</span>
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <For each={roles}>
              {(role) => (
                <label class="relative flex cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData().role === role.value}
                    onChange={(e) => updateField('role', e.currentTarget.value)}
                    class="sr-only peer"
                  />
                  <div class="w-full p-4 border-2 border-gray-200 rounded-lg peer-checked:border-primary-orange peer-checked:bg-orange-50 hover:bg-gray-50 transition-colors">
                    <p class="font-semibold text-text-primary">{role.label}</p>
                    <p class="text-sm text-text-secondary">{role.description}</p>
                  </div>
                </label>
              )}
            </For>
          </div>
          <Show when={errors().role}>
            <p class="text-red-600 text-sm mt-1">{errors().role}</p>
          </Show>
        </div>

        {/* Company Name */}
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">
            Company Name (Optional)
          </label>
          <input
            type="text"
            value={formData().companyName}
            onInput={(e) => updateField('companyName', e.currentTarget.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
            placeholder="Your Company LLC"
          />
        </div>

        {/* Trade Selection (only for Subcontractors) */}
        <Show when={formData().role === 'SUB'}>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Trade/Specialty
            </label>
            <select
              value={formData().trade}
              onChange={(e) => updateField('trade', e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
            >
              <option value="">Select your trade...</option>
              <For each={trades}>
                {(trade) => <option value={trade}>{trade}</option>}
              </For>
            </select>
          </div>
        </Show>

        {/* Submit Button */}
        <div class="pt-4">
          <button
            type="submit"
            disabled={isSubmitting()}
            class="w-full bg-primary-orange text-white font-semibold py-3 px-6 rounded-md hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-ca-md"
          >
            {isSubmitting() ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>

        {/* Terms */}
        <p class="text-xs text-text-secondary text-center">
          By creating an account, you agree to our{' '}
          <a href="/terms" class="text-primary-orange hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" class="text-primary-orange hover:underline">Privacy Policy</a>
        </p>
      </form>
    </div>
  );
}
