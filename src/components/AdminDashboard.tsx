import { useState } from 'react';
import { Activity, Users, ClipboardList, Plus, Trash2, LogOut, User as UserIcon, FileText, LayoutDashboard, Eye, EyeOff, Sun, Moon, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import * as api from '../utils/api';
import type { User, Task } from '../App';

interface AdminDashboardProps {
  onLogout: () => void;
  currentUser: User;
  users: User[];
  tasks: Task[];
  onCreateCHW: (user: User, password: string) => Promise<User>;
  onCreateTask: (task: Task) => Promise<void>;
  onUpdateTask: (task: Task) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onDeleteCHW: (userId: string) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
}

export function AdminDashboard({
  onLogout,
  currentUser,
  users,
  tasks,
  onCreateCHW,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onDeleteCHW,
  onUpdateUser
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'chw' | 'tasks' | 'reports' | 'profile'>('overview');
  const [isCreateCHWOpen, setIsCreateCHWOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Task | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(currentUser.theme === 'dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: currentUser.fullName,
    email: currentUser.email,
    contactNumber: currentUser.contactNumber || '',
    homeAddress: currentUser.homeAddress || '',
    chwArea: currentUser.chwArea || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // CHW form state
  const [chwForm, setCHWForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    contactNumber: '',
    barangayZone: '',
    chwArea: '',
    homeAddress: ''
  });

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed'
  });

  const chws = users.filter(u => u.role === 'chw');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const tasksWithReports = tasks.filter(t => t.completionReport);

  const handleCreateCHW = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chwForm.username || !chwForm.fullName || !chwForm.email || !chwForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (users.some(u => u.username === chwForm.username)) {
      toast.error('Username already exists');
      return;
    }

    const newCHW: User = {
      id: `chw_${Date.now()}`,
      username: chwForm.username,
      fullName: chwForm.fullName,
      email: chwForm.email,
      role: 'chw',
      contactNumber: chwForm.contactNumber,
      barangayZone: chwForm.barangayZone,
      chwArea: chwForm.chwArea,
      homeAddress: chwForm.homeAddress,
      theme: 'light'
    };

    try {
      await onCreateCHW(newCHW, chwForm.password);
      toast.success(`CHW ${newCHW.fullName} created and saved to database!`);
      setIsCreateCHWOpen(false);
      setCHWForm({
        username: '',
        fullName: '',
        email: '',
        password: '',
        contactNumber: '',
        barangayZone: '',
        chwArea: '',
        homeAddress: ''
      });
    } catch (error) {
      // Error already handled in parent
      console.error('Failed to create CHW:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskForm.title || !taskForm.description || !taskForm.assignedTo || !taskForm.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const assignedCHW = users.find(u => u.id === taskForm.assignedTo);

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: taskForm.title,
      description: taskForm.description,
      assignedTo: taskForm.assignedTo,
      assignedToName: assignedCHW?.fullName,
      status: 'pending',
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      dueDate: taskForm.dueDate
    };

    try {
      await onCreateTask(newTask);
      toast.success(`Task assigned to ${assignedCHW?.fullName} and saved to database!`);
      setIsCreateTaskOpen(false);
      setTaskForm({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
        status: 'pending'
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTaskStatus = (task: Task, newStatus: 'pending' | 'in-progress' | 'completed') => {
    onUpdateTask({ ...task, status: newStatus });
    toast.success('Task status updated');
  };

  const handleDeleteCHW = (chw: User) => {
    if (confirm(`Are you sure you want to delete CHW ${chw.fullName}? This will also delete all assigned tasks.`)) {
      onDeleteCHW(chw.id);
      toast.success(`CHW ${chw.fullName} deleted`);
    }
  };

  const handleDeleteTask = (task: Task) => {
    if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      onDeleteTask(task.id);
      toast.success('Task deleted');
    }
  };

  const handleUpdateProfile = () => {
    const updatedUser: User = {
      ...currentUser,
      fullName: profileForm.fullName,
      email: profileForm.email,
      contactNumber: profileForm.contactNumber,
      homeAddress: profileForm.homeAddress,
      chwArea: profileForm.chwArea
    };
    onUpdateUser(updatedUser);
    setIsEditingProfile(false);
    toast.success('Profile updated successfully');
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      await api.updatePassword(currentUser.username, passwordForm.currentPassword, passwordForm.newPassword);
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
      toast.success('Password changed successfully and saved to database!');
    } catch (error) {
      console.error('Password change failed:', error);
      toast.error('Current password is incorrect or update failed');
    }
  };

  const handleToggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    const updatedUser: User = {
      ...currentUser,
      theme: newTheme
    };
    onUpdateUser(updatedUser);
    toast.success(`Theme changed to ${newTheme} mode`);
  };

  const themeClass = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const cardClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const sidebarClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const hoverClass = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} ${sidebarClass} border-r flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}>
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-lg p-2">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className={`text-xl ${textClass}`}>AlagaTrack</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-50 text-blue-600'
                : `${textClass} ${hoverClass}`
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeTab === 'tasks'
                ? 'bg-blue-50 text-blue-600'
                : `${textClass} ${hoverClass}`
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Manage Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('chw')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeTab === 'chw'
                ? 'bg-blue-50 text-blue-600'
                : `${textClass} ${hoverClass}`
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Manage CHWs</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeTab === 'reports'
                ? 'bg-blue-50 text-blue-600'
                : `${textClass} ${hoverClass}`
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>View Reports</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-50 text-blue-600'
                : `${textClass} ${hoverClass}`
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </nav>

        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button onClick={onLogout} variant="outline" className="w-full gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className={`${themeClass} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`${textClass}`}
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div>
              <h1 className={`text-2xl ${textClass}`}>
                Welcome, {currentUser.fullName}
              </h1>
              <p className={mutedClass}>Here's your analytics overview for today.</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className={`border ${cardClass}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${mutedClass}`}>Total CHWs</p>
                        <p className={`text-3xl ${textClass} mt-2`}>{chws.length}</p>
                      </div>
                      <div className="bg-blue-100 rounded-lg p-3">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border ${cardClass}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${mutedClass}`}>Active Tasks</p>
                        <p className={`text-3xl ${textClass} mt-2`}>{inProgressTasks.length}</p>
                      </div>
                      <div className="bg-purple-100 rounded-lg p-3">
                        <ClipboardList className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border ${cardClass}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${mutedClass}`}>Completed Tasks</p>
                        <p className={`text-3xl ${textClass} mt-2`}>{completedTasks.length}</p>
                      </div>
                      <div className="bg-green-100 rounded-lg p-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border ${cardClass}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${mutedClass}`}>Pending Reports</p>
                        <p className={`text-3xl ${textClass} mt-2`}>{completedTasks.filter(t => !t.completionReport).length}</p>
                      </div>
                      <div className="bg-orange-100 rounded-lg p-3">
                        <FileText className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analytics Overview */}
              <div>
                <h2 className={`text-xl ${textClass} mb-4`}>Analytics Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className={`border ${cardClass}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${mutedClass}`}>Task Completion Rate</p>
                          <p className={`text-3xl ${textClass} mt-2`}>
                            {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
                          </p>
                        </div>
                        <div className="bg-green-100 rounded-lg p-3">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`border ${cardClass}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${mutedClass}`}>Active CHWs</p>
                          <p className={`text-3xl ${textClass} mt-2`}>{chws.length}</p>
                        </div>
                        <div className="bg-blue-100 rounded-lg p-3">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`border ${cardClass}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${mutedClass}`}>Total Tasks</p>
                          <p className={`text-3xl ${textClass} mt-2`}>{tasks.length}</p>
                        </div>
                        <div className="bg-purple-100 rounded-lg p-3">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`border ${cardClass}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${mutedClass}`}>Completed Tasks</p>
                          <p className={`text-3xl ${textClass} mt-2`}>{completedTasks.length}</p>
                        </div>
                        <div className="bg-orange-100 rounded-lg p-3">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className={`border ${cardClass}`}>
                  <CardHeader>
                    <CardTitle className={textClass}>Recent Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tasks.slice(0, 5).map(task => (
                        <div key={task.id} className={`flex items-center justify-between p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                          <div>
                            <p className={textClass}>{task.title}</p>
                            <p className={`text-sm ${mutedClass}`}>{task.assignedToName}</p>
                          </div>
                          <Badge
                            variant={
                              task.status === 'completed' ? 'default' :
                              task.status === 'in-progress' ? 'secondary' : 'outline'
                            }
                          >
                            {task.status}
                          </Badge>
                        </div>
                      ))}
                      {tasks.length === 0 && (
                        <p className={`${mutedClass} text-center py-4`}>No tasks yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border ${cardClass}`}>
                  <CardHeader>
                    <CardTitle className={textClass}>Active CHWs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {chws.slice(0, 5).map(chw => (
                        <div key={chw.id} className={`flex items-center gap-3 p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                          <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center text-white">
                            {chw.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className={textClass}>{chw.fullName}</p>
                            <p className={`text-sm ${mutedClass}`}>{chw.barangayZone || 'Not assigned'}</p>
                          </div>
                        </div>
                      ))}
                      {chws.length === 0 && (
                        <p className={`${mutedClass} text-center py-4`}>No CHWs registered</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
{/* Manage CHW Tab */}
{activeTab === 'chw' && (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className={`text-2xl ${textClass}`}>Manage Community Health Workers</h2>
      <Dialog open={isCreateCHWOpen} onOpenChange={setIsCreateCHWOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm">
            <Plus className="w-4 h-4" />
            Create CHW
          </Button>
        </DialogTrigger>

        {/* 🟦 Rounded, fixed-width, clean modal */}
        <DialogContent
          className="max-w-md w-full mx-auto bg-white dark:bg-neutral-900 
                     rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 
                     p-6 transition-all duration-200"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Create New CHW Account
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Enter the details for the new CHW account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCHW} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="chw-fullName">Full Name *</Label>
              <Input
                id="chw-fullName"
                value={chwForm.fullName}
                onChange={(e) => setCHWForm({ ...chwForm, fullName: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="chw-username">Username *</Label>
              <Input
                id="chw-username"
                value={chwForm.username}
                onChange={(e) => setCHWForm({ ...chwForm, username: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="chw-email">Email *</Label>
              <Input
                id="chw-email"
                type="email"
                value={chwForm.email}
                onChange={(e) => setCHWForm({ ...chwForm, email: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="chw-password">Password *</Label>
              <Input
                id="chw-password"
                type="password"
                value={chwForm.password}
                onChange={(e) => setCHWForm({ ...chwForm, password: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="chw-contact">Contact Number</Label>
              <Input
                id="chw-contact"
                value={chwForm.contactNumber}
                onChange={(e) => setCHWForm({ ...chwForm, contactNumber: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="chw-zone">Barangay/Zone</Label>
              <Input
                id="chw-zone"
                value={chwForm.barangayZone}
                onChange={(e) => setCHWForm({ ...chwForm, barangayZone: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="chw-area">CHW Work Area</Label>
              <Input
                id="chw-area"
                value={chwForm.chwArea}
                onChange={(e) => setCHWForm({ ...chwForm, chwArea: e.target.value })}
                placeholder="e.g., Province of Rizal, Antipolo City"
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="chw-address">Home Address</Label>
              <Input
                id="chw-address"
                value={chwForm.homeAddress}
                onChange={(e) => setCHWForm({ ...chwForm, homeAddress: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium mt-4 rounded-full py-2 shadow-sm"
            >
              Create CHW Account
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    {/* CHW Cards Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {chws.map((chw) => {
        const chwTasks = tasks.filter((t) => t.assignedTo === chw.id);
        return (
          <Card key={chw.id} className={`border ${cardClass} rounded-2xl shadow-sm`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-white text-xl">
                    {chw.fullName.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className={`text-lg ${textClass}`}>{chw.fullName}</CardTitle>
                    <p className={`text-sm ${mutedClass}`}>@{chw.username}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteCHW(chw)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              <div className={`flex items-center gap-2 text-sm ${mutedClass}`}>
                <span>📧</span>
                <span>{chw.email}</span>
              </div>
              {chw.contactNumber && (
                <div className={`flex items-center gap-2 text-sm ${mutedClass}`}>
                  <span>📱</span>
                  <span>{chw.contactNumber}</span>
                </div>
              )}
              {chw.barangayZone && (
                <div className={`flex items-center gap-2 text-sm ${mutedClass}`}>
                  <span>📍</span>
                  <span>{chw.barangayZone}</span>
                </div>
              )}
              <div className="pt-3 border-t mt-3">
                <p className={`text-sm ${mutedClass}`}>
                  Assigned Tasks: <span className={textClass}>{chwTasks.length}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>

    {/* Empty State */}
    {chws.length === 0 && (
      <Card className={`border ${cardClass} rounded-2xl shadow-sm`}>
        <CardContent className="py-12 text-center">
          <Users className={`w-16 h-16 ${mutedClass} mx-auto mb-4`} />
          <p className={mutedClass}>No CHWs registered yet</p>
          <p className={`text-sm ${mutedClass} mt-1`}>
            Create your first CHW account to get started
          </p>
        </CardContent>
      </Card>
    )}
  </div>
)}
          {/* Manage Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl ${textClass}`}>Manage Tasks</h2>
                <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                      Create Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                      <DialogDescription>
                        Enter the details for the new task.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                      <div>
                        <Label htmlFor="task-title">Task Title *</Label>
                        <Input
                          id="task-title"
                          value={taskForm.title}
                          onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                          placeholder="e.g., Vaccination Drive"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-description">Description *</Label>
                        <textarea
                          id="task-description"
                          value={taskForm.description}
                          onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                          rows={3}
                          placeholder="Task details..."
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-assign">Assign to CHW *</Label>
                        <select
                          id="task-assign"
                          value={taskForm.assignedTo}
                          onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                          required
                        >
                          <option value="">Select a CHW</option>
                          {chws.map(chw => (
                            <option key={chw.id} value={chw.id}>
                              {chw.fullName} - {chw.barangayZone || 'Unassigned'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="task-due">Due Date *</Label>
                        <Input
                          id="task-due"
                          type="date"
                          value={taskForm.dueDate}
                          onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                        Create Task
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Tasks */}
                <div>
                  <h3 className={`text-lg ${textClass} mb-4`}>Pending ({pendingTasks.length})</h3>
                  <div className="space-y-3">
                    {pendingTasks.map(task => (
                      <Card key={task.id} className="border-l-4 border-l-yellow-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className={textClass}>{task.title}</h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTask(task)}
                              className="h-8 w-8 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className={`text-sm ${mutedClass} mb-3`}>{task.description}</p>
                          <div className="space-y-2">
                            <p className={`text-xs ${mutedClass}`}>
                              Assigned to: <span className={textClass}>{task.assignedToName}</span>
                            </p>
                            <p className={`text-xs ${mutedClass}`}>
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateTaskStatus(task, 'in-progress')}
                              className="w-full"
                            >
                              Move to In Progress
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {pendingTasks.length === 0 && (
                      <p className={`${mutedClass} text-center py-8`}>No pending tasks</p>
                    )}
                  </div>
                </div>

                {/* In Progress Tasks */}
                <div>
                  <h3 className={`text-lg ${textClass} mb-4`}>In Progress ({inProgressTasks.length})</h3>
                  <div className="space-y-3">
                    {inProgressTasks.map(task => (
                      <Card key={task.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className={textClass}>{task.title}</h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTask(task)}
                              className="h-8 w-8 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className={`text-sm ${mutedClass} mb-3`}>{task.description}</p>
                          <div className="space-y-2">
                            <p className={`text-xs ${mutedClass}`}>
                              Assigned to: <span className={textClass}>{task.assignedToName}</span>
                            </p>
                            <p className={`text-xs ${mutedClass}`}>
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateTaskStatus(task, 'pending')}
                                className="flex-1"
                              >
                                ← Pending
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateTaskStatus(task, 'completed')}
                                className="flex-1"
                              >
                                Complete →
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {inProgressTasks.length === 0 && (
                      <p className={`${mutedClass} text-center py-8`}>No tasks in progress</p>
                    )}
                  </div>
                </div>

                {/* Completed Tasks */}
                <div>
                  <h3 className={`text-lg ${textClass} mb-4`}>Completed ({completedTasks.length})</h3>
                  <div className="space-y-3">
                    {completedTasks.map(task => (
                      <Card key={task.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className={textClass}>{task.title}</h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTask(task)}
                              className="h-8 w-8 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className={`text-sm ${mutedClass} mb-3`}>{task.description}</p>
                          <div className="space-y-2">
                            <p className={`text-xs ${mutedClass}`}>
                              Completed by: <span className={textClass}>{task.assignedToName}</span>
                            </p>
                            <p className={`text-xs ${mutedClass}`}>
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                            {task.completionReport && (
                              <Badge className="bg-green-600">Report Submitted</Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateTaskStatus(task, 'in-progress')}
                              className="w-full"
                            >
                              ← Move to In Progress
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {completedTasks.length === 0 && (
                      <p className={`${mutedClass} text-center py-8`}>No completed tasks</p>
                    )}
                  </div>
                </div>
              </div>

              {tasks.length === 0 && (
                <Card className={`border ${cardClass}`}>
                  <CardContent className="py-12 text-center">
                    <ClipboardList className={`w-16 h-16 ${mutedClass} mx-auto mb-4`} />
                    <p className={mutedClass}>No tasks created yet</p>
                    <p className={`text-sm ${mutedClass} mt-1`}>Create your first task to get started</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* View Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h2 className={`text-2xl ${textClass}`}>Task Completion Reports</h2>

              {tasksWithReports.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {tasksWithReports.map(task => (
                    <Card key={task.id} className={`border ${cardClass}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className={textClass}>{task.title}</CardTitle>
                            <p className={`text-sm ${mutedClass} mt-1`}>Completed by: {task.assignedToName}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(task)}
                          >
                            View Full Report
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className={`text-sm ${mutedClass}`}>Work Type</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {task.completionReport?.workType.map((type, index) => (
                                <Badge key={index} variant="secondary">{type}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className={`text-sm ${mutedClass}`}>Beneficiaries</p>
                            <p className={textClass}>{task.completionReport?.beneficiaries}</p>
                          </div>
                          <div>
                            <p className={`text-sm ${mutedClass}`}>Location</p>
                            <p className={textClass}>{task.completionReport?.location}</p>
                          </div>
                          <div>
                            <p className={`text-sm ${mutedClass}`}>Completed Date</p>
                            <p className={textClass}>{task.completionReport?.completedDate ? new Date(task.completionReport.completedDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className={`border ${cardClass}`}>
                  <CardContent className="py-12 text-center">
                    <FileText className={`w-16 h-16 ${mutedClass} mx-auto mb-4`} />
                    <p className={mutedClass}>No completion reports yet</p>
                    <p className={`text-sm ${mutedClass} mt-1`}>Reports will appear here when CHWs submit task completion forms</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl ${textClass}`}>Profile Information</h2>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={handleToggleTheme}
                  />
                  <Moon className="w-4 h-4" />
                </div>
              </div>
              
              <Card className={`border ${cardClass}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={textClass}>Account Details</CardTitle>
                    {!isEditingProfile && (
                      <Button
                        onClick={() => setIsEditingProfile(true)}
                        variant="outline"
                        size="sm"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 rounded-full w-20 h-20 flex items-center justify-center text-white text-3xl">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div>
                      {isEditingProfile ? (
                        <Input
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                          className="mb-2"
                        />
                      ) : (
                        <h3 className={`text-xl ${textClass}`}>{currentUser.fullName}</h3>
                      )}
                      <p className={mutedClass}>@{currentUser.username}</p>
                      <Badge className="mt-2">Administrator</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className={`text-sm ${mutedClass}`}>Email Address</p>
                      {isEditingProfile ? (
                        <Input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        />
                      ) : (
                        <p className={textClass}>{currentUser.email}</p>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm ${mutedClass}`}>Contact Number</p>
                      {isEditingProfile ? (
                        <Input
                          value={profileForm.contactNumber}
                          onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                        />
                      ) : (
                        <p className={textClass}>{currentUser.contactNumber || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm ${mutedClass}`}>Username</p>
                      <p className={textClass}>@{currentUser.username}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${mutedClass}`}>Home Address</p>
                      {isEditingProfile ? (
                        <Input
                          value={profileForm.homeAddress}
                          onChange={(e) => setProfileForm({ ...profileForm, homeAddress: e.target.value })}
                          placeholder="Your home location"
                        />
                      ) : (
                        <p className={textClass}>{currentUser.homeAddress || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm ${mutedClass}`}>CHW Work Area</p>
                      {isEditingProfile ? (
                        <Input
                          value={profileForm.chwArea}
                          onChange={(e) => setProfileForm({ ...profileForm, chwArea: e.target.value })}
                          placeholder="e.g., Province of Rizal, Antipolo City"
                        />
                      ) : (
                        <p className={textClass}>{currentUser.chwArea || 'Not set'}</p>
                      )}
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleUpdateProfile}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileForm({
                            fullName: currentUser.fullName,
                            email: currentUser.email,
                            contactNumber: currentUser.contactNumber || '',
                            homeAddress: currentUser.homeAddress || '',
                            chwArea: currentUser.chwArea || ''
                          });
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={`border ${cardClass}`}>
                <CardHeader>
                  <CardTitle className={textClass}>Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className={`text-sm ${mutedClass} mb-2`}>Password</p>
                    {!isChangingPassword && (
                      <Button
                        onClick={() => setIsChangingPassword(true)}
                        variant="outline"
                      >
                        Change Password
                      </Button>
                    )}
                  </div>

                  {isChangingPassword && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <Label>Current Password</Label>
                        <Input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="Enter new password (min 6 chars)"
                        />
                      </div>
                      <div>
                        <Label>Confirm New Password</Label>
                        <Input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleChangePassword}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Update Password
                        </Button>
                        <Button
                          onClick={() => {
                            setIsChangingPassword(false);
                            setPasswordForm({
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: ''
                            });
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={`border ${cardClass}`}>
                <CardHeader>
                  <CardTitle className={textClass}>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className={`text-sm ${mutedClass}`}>Total CHWs Managed</p>
                      <p className={`text-2xl ${textClass} mt-1`}>{chws.length}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className={`text-sm ${mutedClass}`}>Total Tasks Created</p>
                      <p className={`text-2xl ${textClass} mt-1`}>{tasks.length}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className={`text-sm ${mutedClass}`}>Completed Tasks</p>
                      <p className={`text-2xl ${textClass} mt-1`}>{completedTasks.length}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className={`text-sm ${mutedClass}`}>Reports Received</p>
                      <p className={`text-2xl ${textClass} mt-1`}>{tasksWithReports.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && selectedReport.completionReport && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedReport(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl text-gray-900 mb-2">{selectedReport.title}</h2>
                <p className="text-gray-600">Completion Report</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedReport(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm text-gray-600 mb-2">Work Type Performed</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedReport.completionReport.workType.map((type, index) => (
                    <Badge key={index} variant="secondary">{type}</Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm text-gray-600 mb-2">Number of Beneficiaries</h3>
                  <p className="text-gray-900">{selectedReport.completionReport.beneficiaries}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-600 mb-2">Location</h3>
                  <p className="text-gray-900">{selectedReport.completionReport.location}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-600 mb-2">Assigned To</h3>
                  <p className="text-gray-900">{selectedReport.assignedToName}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-600 mb-2">Completed Date</h3>
                  <p className="text-gray-900">{new Date(selectedReport.completionReport.completedDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-600 mb-2">Key Findings</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedReport.completionReport.findings}</p>
              </div>

              <div>
                <h3 className="text-sm text-gray-600 mb-2">Recommendations</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedReport.completionReport.recommendations}</p>
              </div>

              <div>
                <h3 className="text-sm text-gray-600 mb-2">Challenges Encountered</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedReport.completionReport.challenges}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
