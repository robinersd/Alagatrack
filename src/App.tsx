import { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { RegisterPage } from './components/RegisterPage';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { CHWDashboard } from './components/CHWDashboard';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import * as api from './utils/api';

export type User = {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'chw';
  email: string;
  contactNumber?: string;
  barangayZone?: string;
  chwArea?: string; // Work area for CHW
  homeAddress?: string; // Home address/location
  theme?: 'light' | 'dark';
};

export type Task = {
  id: string;
  title: string;
  description: string;
  assignedTo?: string;
  assignedToName?: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdBy: string;
  createdAt: string;
  dueDate: string;
  completionReport?: {
    workType: string[];
    beneficiaries: string;
    location: string;
    findings: string;
    recommendations: string;
    challenges: string;
    completedDate: string;
    attachments?: string[];
  };
};

export type Page = 'home' | 'about' | 'contact' | 'register' | 'login' | 'admin-dashboard' | 'chw-dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Supabase on mount
  useEffect(() => {
    loadDataFromDatabase();
  }, []);

  const loadDataFromDatabase = async () => {
    try {
      setIsLoading(true);
      console.log('Loading data from Supabase...');
      
      // Load users and tasks from Supabase
      const [usersData, tasksData] = await Promise.all([
        api.fetchUsers(),
        api.fetchTasks()
      ]);
      
      setUsers(usersData);
      setTasks(tasksData);
      console.log(`Loaded ${usersData.length} users and ${tasksData.length} tasks from Supabase`);
      
      // Check if there's a saved current user session in localStorage
      const savedCurrentUser = localStorage.getItem('alagatrack_current_user');
      if (savedCurrentUser) {
        const user = JSON.parse(savedCurrentUser);
        // Verify user still exists in database
        const userExists = usersData.find(u => u.id === user.id);
        if (userExists) {
          setCurrentUser(userExists);
          setCurrentPage(userExists.role === 'admin' ? 'admin-dashboard' : 'chw-dashboard');
        } else {
          // User no longer exists, clear session
          localStorage.removeItem('alagatrack_current_user');
        }
      }
    } catch (error) {
      console.error('Error loading data from database:', error);
      toast.error('Failed to load data from database. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('alagatrack_current_user', JSON.stringify(user));
    setCurrentPage(user.role === 'admin' ? 'admin-dashboard' : 'chw-dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('alagatrack_current_user');
    setCurrentPage('home');
  };

  const handleRegister = async (newUser: User, password: string) => {
    try {
      console.log('Registering new user:', newUser.username);
      const createdUser = await api.createUser(newUser, password);
      setUsers([...users, createdUser]);
      toast.success('Registration successful! Data saved to database.');
      return createdUser;
    } catch (error) {
      console.error('Error registering user:', error);
      toast.error('Failed to register user. Please try again.');
      throw error;
    }
  };

  const handleCreateCHW = async (newUser: User, password: string) => {
    try {
      console.log('Creating new CHW:', newUser.username);
      const createdUser = await api.createUser(newUser, password);
      setUsers([...users, createdUser]);
      toast.success('CHW created successfully! Data saved to database.');
      return createdUser;
    } catch (error) {
      console.error('Error creating CHW:', error);
      toast.error('Failed to create CHW. Please try again.');
      throw error;
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      console.log('Updating user:', updatedUser.id);
      const updated = await api.updateUser(updatedUser);
      setUsers(users.map(user => user.id === updated.id ? updated : user));
      
      // Update current user if it's the same user
      if (currentUser?.id === updated.id) {
        setCurrentUser(updated);
        localStorage.setItem('alagatrack_current_user', JSON.stringify(updated));
      }
      
      toast.success('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user. Please try again.');
      throw error;
    }
  };

  const handleCreateTask = async (newTask: Task) => {
    try {
      console.log('Creating new task:', newTask.id);
      const createdTask = await api.createTask(newTask);
      setTasks([...tasks, createdTask]);
      toast.success('Task created and saved to database!');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task. Please try again.');
      throw error;
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      console.log('Updating task:', updatedTask.id);
      const updated = await api.updateTask(updatedTask);
      setTasks(tasks.map(task => task.id === updated.id ? updated : task));
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task. Please try again.');
      throw error;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      console.log('Deleting task:', taskId);
      await api.deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
      toast.success('Task deleted from database!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task. Please try again.');
      throw error;
    }
  };

  const handleDeleteCHW = async (userId: string) => {
    try {
      console.log('Deleting CHW:', userId);
      await api.deleteUser(userId);
      await api.deleteTasksByUser(userId);
      
      setUsers(users.filter(user => user.id !== userId));
      setTasks(tasks.filter(task => task.assignedTo !== userId));
      
      toast.success('CHW and associated tasks deleted from database!');
    } catch (error) {
      console.error('Error deleting CHW:', error);
      toast.error('Failed to delete CHW. Please try again.');
      throw error;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading AlagaTrack from Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === 'home' && (
        <HomePage 
          onNavigate={setCurrentPage}
          isLoggedIn={!!currentUser}
          onLogout={handleLogout}
          currentUser={currentUser}
        />
      )}
      {currentPage === 'about' && (
        <AboutPage onNavigate={setCurrentPage} />
      )}
      {currentPage === 'contact' && (
        <ContactPage onNavigate={setCurrentPage} />
      )}
      {currentPage === 'register' && (
        <RegisterPage 
          onNavigate={setCurrentPage}
          onRegister={handleRegister}
          existingUsers={users}
        />
      )}
      {currentPage === 'login' && (
        <LoginPage 
          onNavigate={setCurrentPage}
          onLogin={handleLogin}
          users={users}
        />
      )}
      {currentPage === 'admin-dashboard' && currentUser?.role === 'admin' && (
        <AdminDashboard 
          onLogout={handleLogout}
          currentUser={currentUser}
          users={users}
          tasks={tasks}
          onCreateCHW={handleCreateCHW}
          onCreateTask={handleCreateTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onDeleteCHW={handleDeleteCHW}
          onUpdateUser={handleUpdateUser}
        />
      )}
      {currentPage === 'chw-dashboard' && currentUser?.role === 'chw' && (
        <CHWDashboard 
          onLogout={handleLogout}
          currentUser={currentUser}
          tasks={tasks}
          onUpdateTask={handleUpdateTask}
          onUpdateUser={handleUpdateUser}
        />
      )}
      <Toaster />
    </div>
  );
}

export default App;