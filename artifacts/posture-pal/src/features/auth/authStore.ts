export type StoredUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: number;
};

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  loggedInAt: number;
};

const USERS_KEY = "pp_users";
const SESSION_KEY = "pp_session";

async function sha256(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Tiny fallback (not cryptographic) — ok for local-only demo
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `fallback_${h}`;
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loadSession(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

function saveSession(user: CurrentUser | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export async function signupUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<CurrentUser> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Please enter a valid email address.");
  if (name.length < 2) throw new Error("Name must be at least 2 characters.");
  if (input.password.length < 6) throw new Error("Password must be at least 6 characters.");
  const users = readUsers();
  if (users.some((u) => u.email === email)) throw new Error("An account already exists for that email.");
  const passwordHash = await sha256(input.password + ":" + email);
  const user: StoredUser = {
    id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    email,
    name,
    passwordHash,
    createdAt: Date.now(),
  };
  writeUsers([...users, user]);
  const current: CurrentUser = { id: user.id, email: user.email, name: user.name, loggedInAt: Date.now() };
  saveSession(current);
  return current;
}

export async function loginUser(input: { email: string; password: string }): Promise<CurrentUser> {
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("Please enter your email.");
  if (!input.password) throw new Error("Please enter your password.");
  const users = readUsers();
  const user = users.find((u) => u.email === email);
  if (!user) throw new Error("No account found for that email.");
  const passwordHash = await sha256(input.password + ":" + email);
  if (passwordHash !== user.passwordHash) throw new Error("Wrong password — please try again.");
  const current: CurrentUser = { id: user.id, email: user.email, name: user.name, loggedInAt: Date.now() };
  saveSession(current);
  return current;
}

export function logoutUser() {
  saveSession(null);
}
