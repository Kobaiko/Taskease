export function handleAPIError(error: unknown): Error {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Handle HTML error responses
    if (error.message.includes('<!DOCTYPE')) {
      return new Error('API service is unavailable. Please try again later.');
    }
    
    // Handle API key errors
    if (error.message.includes('API key')) {
      return new Error('API configuration error. Please contact support.');
    }

    // Handle JSON parsing errors
    if (error.message.includes('Unexpected token')) {
      return new Error('Invalid response from server. Please try again.');
    }

    return error;
  }

  return new Error('An unexpected error occurred. Please try again.');
}