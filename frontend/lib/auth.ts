export interface User {
  id: number;
  name: string;
  email: string;
}

const TOKEN_KEY = "access_token";
const USER_KEY = "user";

export function saveAuth(
  token: string,
  user: User
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    TOKEN_KEY,
    token
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );
}

export function setAuth(
  token: string,
  user: User
): void {
  saveAuth(token, user);
}

export function getToken(): string | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  return localStorage.getItem(
    TOKEN_KEY
  );
}

export function getUser(): User | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const storedUser =
    localStorage.getItem(
      USER_KEY
    );

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(
      storedUser
    ) as User;
  } catch {
    return null;
  }
}

export function logout(): void {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    TOKEN_KEY
  );

  localStorage.removeItem(
    USER_KEY
  );
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}