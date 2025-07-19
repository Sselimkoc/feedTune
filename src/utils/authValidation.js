/**
 * Authentication form validation utilities
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 6,
  hasLetter: /[a-zA-Z]/,
  hasDigit: /\d/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {Object} Validation result with isValid and error message
 */
export function validateEmail(email) {
  if (!email) {
    return {
      isValid: false,
      error: "Email is required",
    };
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      isValid: false,
      error: "Please enter a valid email address",
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid, error message, and strength score
 */
export function validatePassword(password) {
  if (!password) {
    return {
      isValid: false,
      error: "Password is required",
      strength: 0,
    };
  }

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
      strength: 0,
    };
  }

  // Calculate password strength
  let strength = 0;
  const checks = [
    password.length >= 8, // Length bonus
    PASSWORD_REQUIREMENTS.hasLetter.test(password), // Has letter
    PASSWORD_REQUIREMENTS.hasDigit.test(password), // Has digit
    PASSWORD_REQUIREMENTS.hasSpecialChar.test(password), // Has special char
  ];

  strength = checks.filter(Boolean).length;

  // For signup, require at least 2 out of 4 checks
  const isValid = strength >= 2;

  let error = null;
  if (!isValid) {
    error = "Password must contain at least letters and numbers";
  }

  return {
    isValid,
    error,
    strength,
  };
}

/**
 * Validate form data for authentication
 * @param {Object} formData - Form data object with email and password
 * @param {boolean} isSignup - Whether this is for signup (stricter validation)
 * @returns {Object} Validation result
 */
export function validateAuthForm(formData, isSignup = false) {
  const { email, password } = formData;

  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);

  const isValid = emailValidation.isValid && passwordValidation.isValid;

  return {
    isValid,
    errors: {
      email: emailValidation.error,
      password: passwordValidation.error,
    },
    strength: passwordValidation.strength,
  };
}

/**
 * Get password strength indicator text
 * @param {number} strength - Password strength score (0-4)
 * @returns {string} Strength description
 */
export function getPasswordStrengthText(strength) {
  switch (strength) {
    case 0:
    case 1:
      return "Weak";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Strong";
    default:
      return "Unknown";
  }
}

/**
 * Get password strength color class
 * @param {number} strength - Password strength score (0-4)
 * @returns {string} Tailwind color class
 */
export function getPasswordStrengthColor(strength) {
  switch (strength) {
    case 0:
    case 1:
      return "text-red-500";
    case 2:
      return "text-yellow-500";
    case 3:
      return "text-blue-500";
    case 4:
      return "text-green-500";
    default:
      return "text-gray-500";
  }
}
