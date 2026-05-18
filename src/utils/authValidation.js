const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_REQUIREMENTS = {
  minLength: 6,
  hasLetter: /[a-zA-Z]/,
  hasDigit: /\d/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
};

function msg(t, key, fallback) {
  return t ? t(key) : fallback;
}

export function validateEmail(email, t) {
  if (!email) {
    return { isValid: false, error: msg(t, "auth.validation.emailRequired", "Email is required") };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: msg(t, "auth.validation.emailInvalid", "Please enter a valid email address") };
  }
  return { isValid: true, error: null };
}

export function validatePassword(password, isSignup = false, t) {
  if (!password) {
    return { isValid: false, error: msg(t, "auth.validation.passwordRequired", "Password is required"), strength: 0 };
  }
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return { isValid: false, error: msg(t, "auth.validation.passwordTooShort", "Password must be at least 6 characters"), strength: 0 };
  }

  // Calculate strength
  const checks = [
    password.length >= 8,
    PASSWORD_REQUIREMENTS.hasLetter.test(password),
    PASSWORD_REQUIREMENTS.hasDigit.test(password),
    PASSWORD_REQUIREMENTS.hasSpecialChar.test(password),
  ];
  const strength = checks.filter(Boolean).length;

  // Login: only min length required — don't block users with simple passwords
  if (!isSignup) {
    return { isValid: true, error: null, strength };
  }

  // Signup: require at least letters + numbers
  if (strength < 2) {
    return { isValid: false, error: msg(t, "auth.validation.passwordWeak", "Password must contain at least letters and numbers"), strength };
  }

  return { isValid: true, error: null, strength };
}

export function validateAuthForm(formData, isSignup = false, t) {
  const { email, password } = formData;
  const emailValidation = validateEmail(email, t);
  const passwordValidation = validatePassword(password, isSignup, t);

  return {
    isValid: emailValidation.isValid && passwordValidation.isValid,
    errors: {
      email: emailValidation.error,
      password: passwordValidation.error,
    },
    strength: passwordValidation.strength,
  };
}

export function getPasswordStrengthText(strength, t) {
  const keys = ["auth.strength.weak", "auth.strength.weak", "auth.strength.fair", "auth.strength.good", "auth.strength.strong"];
  const fallbacks = ["Weak", "Weak", "Fair", "Good", "Strong"];
  const i = Math.min(strength, 4);
  return msg(t, keys[i], fallbacks[i]);
}

export function getPasswordStrengthColor(strength) {
  switch (strength) {
    case 0:
    case 1: return "text-red-500";
    case 2: return "text-yellow-500";
    case 3: return "text-blue-500";
    case 4: return "text-green-500";
    default: return "text-gray-500";
  }
}
