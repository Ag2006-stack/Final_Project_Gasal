export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export function validateShippingForm(form) {
  const errors = {};
  if (!form.fullName || form.fullName.trim().length < 2) {
    errors.fullName = 'Recipient name is required.';
  }
  if (!form.phone || !/^(09|\+639)\d{9}$/.test(form.phone.trim())) {
    errors.phone = 'Enter a valid PH mobile number (e.g., 09171234567).';
  }
  if (!form.addressLine || form.addressLine.trim().length < 5) {
    errors.addressLine = 'Street address is required.';
  }
  if (!form.city || form.city.trim().length < 2) {
    errors.city = 'City / Municipality is required.';
  }
  return errors;
}