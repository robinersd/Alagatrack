import { projectId, publicAnonKey } from './supabase/info';
import type { User, Task } from '../App';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c6a1b708`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

// ============= LOCAL STORAGE KEYS FOR OFFLINE / FALLBACK =============
const STORAGE_KEYS = {
  USERS: 'alagatrack_local_users',
  PASSWORDS: 'alagatrack_local_passwords',
  TASKS: 'alagatrack_local_tasks',
  ATTEMPTS: 'alagatrack_local_login_attempts',
};

// Initial admin account setup for fallback/local testing
const DEFAULT_USERS: User[] = [
  {
    id: 'user_admin_default',
    username: 'admin',
    fullName: 'System Administrator',
    role: 'admin',
    email: 'admin@alagatrack.com',
    contactNumber: '09123456789',
    theme: 'light'
  }
];

const DEFAULT_PASSWORDS: Record<string, string> = {
  'admin': 'admin123'
};

function getLocalUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(DEFAULT_PASSWORDS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
}

function saveLocalUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getLocalPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(DEFAULT_PASSWORDS));
      return DEFAULT_PASSWORDS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PASSWORDS;
  }
}

function saveLocalPasswords(passwords: Record<string, string>) {
  localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));
}

function getLocalTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

// ============= USER API =============

export async function fetchUsers(): Promise<User[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_BASE_URL}/users`, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch users');
    }
    
    const users = data.data || [];
    saveLocalUsers(users);
    return users;
  } catch (error) {
    console.warn('Supabase fetchUsers unavailable, using local storage fallback:', error);
    return getLocalUsers();
  }
}

export async function createUser(user: User, password: string): Promise<User> {
  // Always update local storage first or as fallback
  const localUsers = getLocalUsers();
  const existingUser = localUsers.find(u => u.username === user.username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  try {
    console.log('Creating user via API:', { username: user.username, url: `${API_BASE_URL}/users` });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user, password }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create user');
    }
    
    console.log('User created successfully via Supabase:', data.data);
    const created = data.data;
    saveLocalUsers([...localUsers, created]);
    const passwords = getLocalPasswords();
    passwords[user.username] = password;
    saveLocalPasswords(passwords);
    return created;
  } catch (error) {
    console.warn('Supabase createUser failed/offline, saving user locally:', error);
    const updatedUsers = [...localUsers, user];
    saveLocalUsers(updatedUsers);
    const passwords = getLocalPasswords();
    passwords[user.username] = password;
    saveLocalPasswords(passwords);
    return user;
  }
}

export async function updateUser(user: User): Promise<User> {
  const localUsers = getLocalUsers();
  const updatedList = localUsers.map(u => (u.id === user.id ? user : u));
  saveLocalUsers(updatedList);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(user),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update user');
    }
    
    return data.data;
  } catch (error) {
    console.warn('Supabase updateUser failed/offline, updated locally:', error);
    return user;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const localUsers = getLocalUsers();
  const userToDelete = localUsers.find(u => u.id === userId);
  saveLocalUsers(localUsers.filter(u => u.id !== userId));

  if (userToDelete?.username) {
    const passwords = getLocalPasswords();
    delete passwords[userToDelete.username];
    saveLocalPasswords(passwords);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete user');
    }
  } catch (error) {
    console.warn('Supabase deleteUser failed/offline, deleted locally:', error);
  }
}

// ============= AUTHENTICATION API =============

export async function login(username: string, password: string): Promise<User> {
  try {
    console.log('Login attempt:', { username, url: `${API_BASE_URL}/auth/login` });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Invalid credentials');
    }
    
    console.log('Login successful via Supabase for user:', username);
    return data.data;
  } catch (error) {
    console.warn('Supabase login failed or unreachable. Falling back to local storage auth:', error);
    const localUsers = getLocalUsers();
    const user = localUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    const passwords = getLocalPasswords();

    if (!user || passwords[user.username] !== password) {
      throw new Error('Invalid credentials');
    }

    return user;
  }
}

export async function updatePassword(username: string, oldPassword: string, newPassword: string): Promise<void> {
  const passwords = getLocalPasswords();
  if (passwords[username] !== oldPassword) {
    throw new Error('Current password is incorrect');
  }
  passwords[username] = newPassword;
  saveLocalPasswords(passwords);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_BASE_URL}/auth/update-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, oldPassword, newPassword }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update password');
    }
  } catch (error) {
    console.warn('Supabase updatePassword failed/offline, updated locally:', error);
  }
}

// ============= TASK API =============

export async function fetchTasks(): Promise<Task[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_BASE_URL}/tasks`, { headers, signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch tasks');
    }
    
    const tasks = data.data || [];
    saveLocalTasks(tasks);
    return tasks;
  } catch (error) {
    console.warn('Supabase fetchTasks failed/offline, using local storage fallback:', error);
    return getLocalTasks();
  }
}

export async function createTask(task: Task): Promise<Task> {
  const localTasks = getLocalTasks();
  saveLocalTasks([...localTasks, task]);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(task),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create task');
    }
    
    return data.data;
  } catch (error) {
    console.warn('Supabase createTask failed/offline, stored locally:', error);
    return task;
  }
}

export async function updateTask(task: Task): Promise<Task> {
  const localTasks = getLocalTasks();
  const updatedList = localTasks.map(t => (t.id === task.id ? task : t));
  saveLocalTasks(updatedList);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(task),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update task');
    }
    
    return data.data;
  } catch (error) {
    console.warn('Supabase updateTask failed/offline, stored locally:', error);
    return task;
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const localTasks = getLocalTasks();
  saveLocalTasks(localTasks.filter(t => t.id !== taskId));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete task');
    }
  } catch (error) {
    console.warn('Supabase deleteTask failed/offline, deleted locally:', error);
  }
}

export async function deleteTasksByUser(userId: string): Promise<void> {
  const localTasks = getLocalTasks();
  saveLocalTasks(localTasks.filter(t => t.assignedTo !== userId));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_BASE_URL}/tasks/user/${userId}`, {
      method: 'DELETE',
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete user tasks');
    }
  } catch (error) {
    console.warn('Supabase deleteTasksByUser failed/offline, deleted locally:', error);
  }
}

// ============= LOGIN ATTEMPT TRACKING =============

export async function getLoginAttempts(username: string): Promise<{ count: number; blockedUntil: number | null }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${API_BASE_URL}/auth/attempts/${username}`, { headers, signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await response.json();
    
    if (!data.success) {
      return { count: 0, blockedUntil: null };
    }
    
    return data.data;
  } catch (error) {
    return { count: 0, blockedUntil: null };
  }
}

export async function updateLoginAttempts(username: string, attempts: { count: number; blockedUntil: number | null }): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${API_BASE_URL}/auth/attempts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, attempts }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update login attempts');
    }
  } catch (error) {
    // Non-blocking for offline
  }
}

export async function resetLoginAttempts(username: string): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${API_BASE_URL}/auth/attempts/${username}`, {
      method: 'DELETE',
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to reset login attempts');
    }
  } catch (error) {
    // Non-blocking for offline
  }
}
