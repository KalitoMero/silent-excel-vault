// Utility function to generate the correct backend URL
export const getBackendUrl = (): string => {
  // If we're in development and accessing via localhost, use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3005';
  }
  
  // If we're accessing from a network IP, use the same IP with backend port
  return `http://${window.location.hostname}:3005`;
};

// Generate media URL for videos and files
export const getMediaUrl = (filePath: string): string => {
  return `${getBackendUrl()}${filePath}`;
};