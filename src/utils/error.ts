export function handleAPIError(error: unknown): Error {
  console.error('API Error:', error);

  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return new Error('API configuration error. Please contact support.');
    }
    return error;
  }

  return new Error('An unexpected error occurred. Please try again.');
}