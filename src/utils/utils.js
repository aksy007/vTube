const isValidEmail = (email) => {
  // Define a regular expression pattern for a valid email address
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Test the email against the pattern
  const isValid = emailPattern.test(email);

  // Return true if there is a match, indicating a valid email, otherwise return false
  return isValid;
};

export { isValidEmail };
