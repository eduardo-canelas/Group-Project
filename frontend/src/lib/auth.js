export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem('user');
}

export function getAuthErrorMessage(error, fallback) {
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) {
    return serverMessage;
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'RoutePulse could not reach the login service. Please try again.';
  }

  return fallback;
}
