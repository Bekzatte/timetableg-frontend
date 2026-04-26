const USER_STORAGE_KEY = "user";

export const getStoredUser = () => {
  const rawUser = sessionStorage.getItem(USER_STORAGE_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    console.error("Error parsing user from session storage:", error);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

export const setStoredUser = (user) => {
  if (!user) {
    sessionStorage.removeItem(USER_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredUser = () => {
  sessionStorage.removeItem(USER_STORAGE_KEY);
};
