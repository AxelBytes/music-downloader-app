/**
 * API Configuration
 * Production: Koyeb backend
 * Development: Local backend
 */

export const API_URL = 'https://criminal-piper-lioneldev-d5cc2db7.koyeb.app';

export const getApiEndpoint = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_URL}/${cleanPath}`;
};

export default {
  API_URL,
  getApiEndpoint,
};
