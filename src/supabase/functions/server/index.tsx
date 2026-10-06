// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
// @ts-ignore
import { Hono } from "https://deno.land/x/hono@v3.7.6/mod.ts"
// @ts-ignore
import { cors } from "https://deno.land/x/hono@v3.7.6/middleware.ts"
// @ts-ignore
import { logger } from "https://deno.land/x/hono@v3.7.6/middleware/logger/index.ts"
// @ts-ignore 
import * as kv from "./kv_store.tsx"

// Type declarations for better type safety
type User = {
  id: string
  username: string
  [key: string]: any
}

type Task = {
  id: string
  assignedTo: string
  [key: string]: any
}

type LoginAttempts = {
  count: number
  blockedUntil: string | null
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  return String(error)
}

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-c6a1b708/health", (c: any) => {
  return c.json({ status: "ok", message: "AlagaTrack API is running" });
});

// ==================== USER MANAGEMENT ====================

// Get all users
app.get("/make-server-c6a1b708/users", async (c: any) => {
  try {
    console.log('Fetching all users...');
    const users = await kv.getByPrefix('user:') as User[];
    console.log(`Retrieved ${users.length} users`);
    return c.json({ success: true, data: users });
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Create a new user
app.post("/make-server-c6a1b708/users", async (c: any) => {
  try {
    const body = await c.req.json();
    const { user, password } = body as { user: User; password: string };
    
    console.log('Creating new user:', user.username);
    
    if (!user || !password) {
      return c.json({ success: false, error: 'User data and password are required' }, 400);
    }
    
    // Check if username already exists
    const existingUsers = await kv.getByPrefix('user:') as User[];
    const userExists = existingUsers.some(u => u.username === user.username);
    
    if (userExists) {
      return c.json({ success: false, error: 'Username already exists' }, 400);
    }
    
    // Store user data
    await kv.set(`user:${user.id}`, user);
    
    // Store password separately
    await kv.set(`password:${user.username}`, password);
    
    console.log(`User ${user.username} created successfully`);
    return c.json({ success: true, data: user });
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Update user
app.put("/make-server-c6a1b708/users/:id", async (c: any) => {
  try {
    const userId = c.req.param('id');
    const user = await c.req.json() as User;
    
    console.log('Updating user:', userId);
    
    await kv.set(`user:${userId}`, user);
    
    console.log(`User ${userId} updated successfully`);
    return c.json({ success: true, data: user });
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Delete user
app.delete("/make-server-c6a1b708/users/:id", async (c: any) => {
  try {
    const userId = c.req.param('id');
    
    console.log('Deleting user:', userId);
    
    // Get user to find username for password deletion
    const user = await kv.get(`user:${userId}`) as User;
    
    // Delete user data
    await kv.del(`user:${userId}`);
    
    // Delete password if user exists
    if (user?.username) {
      await kv.del(`password:${user.username}`);
    }
    
    console.log(`User ${userId} deleted successfully`);
    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// ==================== AUTHENTICATION ====================

// Login
app.post("/make-server-c6a1b708/auth/login", async (c: any) => {
  try {
    const { username, password } = await c.req.json() as { username: string; password: string };
    
    console.log('Login attempt for username:', username);
    
    if (!username || !password) {
      return c.json({ success: false, error: 'Username and password are required' }, 400);
    }
    
    // Get all users to find the one with matching username
    const users = await kv.getByPrefix('user:') as User[];
    const user = users.find(u => u.username === username);
    
    if (!user) {
      console.log(`User ${username} not found`);
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
    
    // Check password
    const storedPassword = await kv.get(`password:${username}`) as string;
    
    if (storedPassword !== password) {
      console.log(`Invalid password for user ${username}`);
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
    
    console.log(`User ${username} logged in successfully`);
    return c.json({ success: true, data: user });
  } catch (error: unknown) {
    console.error('Error during login:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Update password
app.post("/make-server-c6a1b708/auth/update-password", async (c: any) => {
  try {
    const { username, oldPassword, newPassword } = await c.req.json() as {
      username: string;
      oldPassword: string;
      newPassword: string;
    };
    
    console.log('Password update attempt for username:', username);
    
    if (!username || !oldPassword || !newPassword) {
      return c.json({ success: false, error: 'All fields are required' }, 400);
    }
    
    // Verify old password
    const storedPassword = await kv.get(`password:${username}`) as string;
    
    if (storedPassword !== oldPassword) {
      console.log(`Invalid old password for user ${username}`);
      return c.json({ success: false, error: 'Current password is incorrect' }, 401);
    }
    
    // Update password
    await kv.set(`password:${username}`, newPassword);
    
    console.log(`Password updated for user ${username}`);
    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('Error updating password:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Get login attempts
app.get("/make-server-c6a1b708/auth/attempts/:username", async (c: any) => {
  try {
    const username = c.req.param('username');
    const attempts = await kv.get(`login_attempts:${username}`) as LoginAttempts;
    
    return c.json({ 
      success: true, 
      data: attempts || { count: 0, blockedUntil: null } 
    });
  } catch (error: unknown) {
    console.error('Error fetching login attempts:', error);
    return c.json({ success: true, data: { count: 0, blockedUntil: null } });
  }
});

// Update login attempts
app.post("/make-server-c6a1b708/auth/attempts", async (c: any) => {
  try {
    const { username, attempts } = await c.req.json() as { 
      username: string; 
      attempts: LoginAttempts;
    };
    
    await kv.set(`login_attempts:${username}`, attempts);
    
    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('Error updating login attempts:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Reset login attempts
app.delete("/make-server-c6a1b708/auth/attempts/:username", async (c: any) => {
  try {
    const username = c.req.param('username');
    
    await kv.del(`login_attempts:${username}`);
    
    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('Error resetting login attempts:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// ==================== TASK MANAGEMENT ====================

// Get all tasks
app.get("/make-server-c6a1b708/tasks", async (c: any) => {
  try {
    console.log('Fetching all tasks...');
    const tasks = await kv.getByPrefix('task:') as Task[];
    console.log(`Retrieved ${tasks.length} tasks`);
    return c.json({ success: true, data: tasks });
  } catch (error: unknown) {
    console.error('Error fetching tasks:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Create a new task
app.post("/make-server-c6a1b708/tasks", async (c: any) => {
  try {
    const task = await c.req.json() as Task;
    
    console.log('Creating new task:', task.id);
    
    if (!task) {
      return c.json({ success: false, error: 'Task data is required' }, 400);
    }
    
    await kv.set(`task:${task.id}`, task);
    
    console.log(`Task ${task.id} created successfully`);
    return c.json({ success: true, data: task });
  } catch (error: unknown) {
    console.error('Error creating task:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Update task
app.put("/make-server-c6a1b708/tasks/:id", async (c: any) => {
  try {
    const taskId = c.req.param('id');
    const task = await c.req.json() as Task;
    
    console.log('Updating task:', taskId);
    
    await kv.set(`task:${taskId}`, task);
    
    console.log(`Task ${taskId} updated successfully`);
    return c.json({ success: true, data: task });
  } catch (error: unknown) {
    console.error('Error updating task:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Delete task
app.delete("/make-server-c6a1b708/tasks/:id", async (c: any) => {
  try {
    const taskId = c.req.param('id');
    
    console.log('Deleting task:', taskId);
    
    await kv.del(`task:${taskId}`);
    
    console.log(`Task ${taskId} deleted successfully`);
    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting task:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Delete all tasks for a user
app.delete("/make-server-c6a1b708/tasks/user/:userId", async (c: any) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('Deleting all tasks for user:', userId);
    
    // Get all tasks
    const tasks = await kv.getByPrefix('task:') as Task[];
    
    // Filter and delete tasks assigned to this user
    const deletePromises = tasks
      .filter(task => task.assignedTo === userId)
      .map(task => kv.del(`task:${task.id}`));
    
    await Promise.all(deletePromises);
    
    console.log(`All tasks for user ${userId} deleted successfully`);
    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting user tasks:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Start the server
console.log('🚀 AlagaTrack API Server starting...');
serve(app.fetch);