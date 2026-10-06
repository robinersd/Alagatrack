import { useState, useEffect } from 'react';
import { Activity, Bell, LogOut, CheckCircle2, Clock, AlertCircle, User as UserIcon, FileText, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import * as api from '../utils/api';
import type { User, Task } from '../App';

interface CHWDashboardProps {
  onLogout: () => void;
  currentUser: User;
  tasks: Task[];
  onUpdateTask: (task: Task) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
}

const WORK_TYPES = [
  'Conducting health screenings',
  'Providing health education',
  'Making home visits',
  'Referring individuals to healthcare providers',
  'Collecting data',
  'Advocating for community health needs',
  'Providing social support',
  'Participating in community outreach events',
  'Monitoring medication adherence',
  'Providing basic first aid'
];

export function CHWDashboard({ onLogout, currentUser, tasks, onUpdateTask, onUpdateUser }: CHWDashboardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeView, setActiveView] = useState<'tasks' | 'profile'>('tasks');
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(currentUser.theme === 'dark');
  
  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: currentUser.fullName,
    email: currentUser.email,
    contactNumber: currentUser.contactNumber || '',
    barangayZone: currentUser.barangayZone || '',
    chwArea: currentUser.chwArea || '',
    homeAddress: currentUser.homeAddress || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Completion form state
  const [completionForm, setCompletionForm] = useState({
    workType: [] as string[],
    beneficiaries: '',
    location: '',
    findings: '',
    recommendations: '',
    challenges: ''
  });

  // Filter tasks assigned to current CHW
  const myTasks = tasks.filter(t => t.assignedTo === currentUser.id);
  const pendingTasks = myTasks.filter(t => t.status === 'pending');
  const inProgressTasks = myTasks.filter(t => t.status === 'in-progress');
  const completedTasks = myTasks.filter(t => t.status === 'completed');

  // Check for new task assignments and show notifications
  useEffect(() => {
    const lastTaskCount = parseInt(localStorage.getItem(`last_task_count_${currentUser.id}`) || '0');
    const currentTaskCount = myTasks.length;

    if (currentTaskCount > lastTaskCount) {
      const newTasksCount = currentTaskCount - lastTaskCount;
      setUnreadNotifications(newTasksCount);
      toast.success(`You have ${newTasksCount} new task${newTasksCount > 1 ? 's' : ''} assigned!`, {
        duration: 5000,
      });
    }

    localStorage.setItem(`last_task_count_${currentUser.id}`, currentTaskCount.toString());
  }, [myTasks.length, currentUser.id]);

  const handleStartTask = (task: Task) => {
    onUpdateTask({ ...task, status: 'in-progress' });
    toast.success(`Started working on: ${task.title}`);
  };

  const handleOpenCompletionForm = (task: Task) => {
    setCompletingTask(task);
    setCompletionForm({
      workType: [],
      beneficiaries: '',
      location: '',
      findings: '',
      recommendations: '',
      challenges: ''
    });
  };

  const handleSubmitCompletionForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (completionForm.workType.length === 0) {
      toast.error('Please select at least one work type');
      return;
    }

    if (!completionForm.beneficiaries || !completionForm.location || !completionForm.findings) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (completingTask) {
      const updatedTask: Task = {
        ...completingTask,
        status: 'completed',
        completionReport: {
          workType: completionForm.workType,
          beneficiaries: completionForm.beneficiaries,
          location: completionForm.location,
          findings: completionForm.findings,
          recommendations: completionForm.recommendations,
          challenges: completionForm.challenges,
          completedDate: new Date().toISOString()
        }
      };

      onUpdateTask(updatedTask);
      toast.success(`Task completed with report: ${completingTask.title}`);
      setCompletingTask(null);
    }
  };

  const handleViewNotifications = () => {
    setShowNotifications(!showNotifications);
    setUnreadNotifications(0);
  };

  const handleToggleWorkType = (workType: string) => {
    setCompletionForm(prev => ({
      ...prev,
      workType: prev.workType.includes(workType)
        ? prev.workType.filter(t => t !== workType)
        : [...prev.workType, workType]
    }));
  };

  const handleUpdateProfile = () => {
    const updatedUser: User = {
      ...currentUser,
      fullName: profileForm.fullName,
      email: profileForm.email,
      contactNumber: profileForm.contactNumber,
      barangayZone: profileForm.barangayZone,
      chwArea: profileForm.chwArea,
      homeAddress: profileForm.homeAddress
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const themeClass = isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  const cardClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headerClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = isDarkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`min-h-screen ${themeClass}`}>
      {/* Header */}
      <header className={`shadow-sm border-b ${headerClass}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-lg p-2">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl ${textClass}`}>AlagaTrack CHW</h1>
                <p className={`text-sm ${mutedClass}`}>{currentUser.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleViewNotifications}
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>
              </div>
              <Button onClick={onLogout} variant="outline" className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className={`border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveView('tasks')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeView === 'tasks'
                  ? 'border-blue-600 text-blue-600'
                  : `border-transparent ${mutedClass} hover:${textClass}`
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setActiveView('profile')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeView === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : `border-transparent ${mutedClass} hover:${textClass}`
              }`}
            >
              Profile
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className={`border-b shadow-sm ${headerClass}`}>
          <div className="container mx-auto px-4 py-4">
            <h3 className={`text-lg ${textClass} mb-3`}>Notifications</h3>
            <div className="space-y-2">
              {myTasks.slice(0, 5).map(task => (
                <div key={task.id} className="bg-blue-50 rounded-lg p-3 flex items-start gap-3">
                  <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-gray-900">Task assigned: {task.title}</p>
                    <p className="text-sm text-gray-600">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {myTasks.length === 0 && (
                <p className={`${mutedClass} text-center py-4`}>No notifications</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {activeView === 'tasks' && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className={cardClass}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm ${mutedClass}`}>Total Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl ${textClass}`}>{myTasks.length}</div>
                  <p className={`text-sm ${mutedClass} mt-1`}>Assigned to you</p>
                </CardContent>
              </Card>

              <Card className={cardClass}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm ${mutedClass}`}>Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl text-yellow-600">{pendingTasks.length}</div>
                  <p className={`text-sm ${mutedClass} mt-1`}>Not started</p>
                </CardContent>
              </Card>

              <Card className={cardClass}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm ${mutedClass}`}>In Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl text-blue-600">{inProgressTasks.length}</div>
                  <p className={`text-sm ${mutedClass} mt-1`}>Currently working</p>
                </CardContent>
              </Card>

              <Card className={cardClass}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm ${mutedClass}`}>Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl text-green-600">{completedTasks.length}</div>
                  <p className={`text-sm ${mutedClass} mt-1`}>Finished</p>
                </CardContent>
              </Card>
            </div>

            {/* Tasks Section */}
            <div className="space-y-6">
              <h2 className={`text-2xl ${textClass}`}>My Tasks</h2>

              {/* Pending Tasks */}
              {pendingTasks.length > 0 && (
                <div>
                  <h3 className={`text-lg ${textClass} mb-4 flex items-center gap-2`}>
                    <Clock className="w-5 h-5 text-yellow-600" />
                    Pending Tasks ({pendingTasks.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingTasks.map(task => (
                      <Card 
                        key={task.id} 
                        className={`border-l-4 ${isOverdue(task.dueDate) ? 'border-l-red-500' : 'border-l-yellow-500'} cursor-pointer hover:shadow-lg transition-shadow ${cardClass}`}
                        onClick={() => setSelectedTask(task)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className={textClass}>{task.title}</h4>
                            {isOverdue(task.dueDate) && (
                              <Badge variant="destructive" className="text-xs">Overdue</Badge>
                            )}
                          </div>
                          <p className={`text-sm ${mutedClass} mb-3 line-clamp-2`}>{task.description}</p>
                          <div className="space-y-2">
                            <p className={`text-xs ${mutedClass}`}>
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartTask(task);
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              Start Task
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress Tasks */}
              {inProgressTasks.length > 0 && (
                <div>
                  <h3 className={`text-lg ${textClass} mb-4 flex items-center gap-2`}>
                    <Activity className="w-5 h-5 text-blue-600" />
                    In Progress ({inProgressTasks.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inProgressTasks.map(task => (
                      <Card 
                        key={task.id} 
                        className={`border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg transition-shadow ${cardClass}`}
                        onClick={() => setSelectedTask(task)}
                      >
                        <CardContent className="p-4">
                          <h4 className={`${textClass} mb-2`}>{task.title}</h4>
                          <p className={`text-sm ${mutedClass} mb-3 line-clamp-2`}>{task.description}</p>
                          <div className="space-y-2">
                            <p className={`text-xs ${mutedClass}`}>
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCompletionForm(task);
                              }}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              Complete & Submit Report
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div>
                  <h3 className={`text-lg ${textClass} mb-4 flex items-center gap-2`}>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Completed ({completedTasks.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedTasks.map(task => (
                      <Card 
                        key={task.id} 
                        className={`border-l-4 border-l-green-500 opacity-75 cursor-pointer hover:shadow-lg transition-shadow ${cardClass}`}
                        onClick={() => setSelectedTask(task)}
                      >
                        <CardContent className="p-4">
                          <h4 className={`${textClass} mb-2`}>{task.title}</h4>
                          <p className={`text-sm ${mutedClass} mb-3 line-clamp-2`}>{task.description}</p>
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Completed</span>
                          </div>
                          {task.completionReport && (
                            <Badge className="mt-2 bg-green-600">Report Submitted</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* No Tasks Message */}
              {myTasks.length === 0 && (
                <Card className={cardClass}>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className={`w-16 h-16 ${mutedClass} mx-auto mb-4`} />
                    <p className={mutedClass}>No tasks assigned yet</p>
                    <p className={`text-sm ${mutedClass} mt-1`}>Check back later for new assignments</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Profile View */}
        {activeView === 'profile' && (
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
            
            <Card className={cardClass}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Account Details</CardTitle>
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
                    <Badge className="mt-2">Community Health Worker</Badge>
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
                    <p className={`text-sm ${mutedClass}`}>Username</p>
                    <p className={textClass}>@{currentUser.username}</p>
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
                    <p className={`text-sm ${mutedClass}`}>Barangay/Zone</p>
                    {isEditingProfile ? (
                      <Input
                        value={profileForm.barangayZone}
                        onChange={(e) => setProfileForm({ ...profileForm, barangayZone: e.target.value })}
                      />
                    ) : (
                      <p className={textClass}>{currentUser.barangayZone || 'Not assigned'}</p>
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
                          barangayZone: currentUser.barangayZone || '',
                          chwArea: currentUser.chwArea || '',
                          homeAddress: currentUser.homeAddress || ''
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

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${mutedClass} mb-1`}>Password</p>
                    <p className="text-sm">••••••••</p>
                  </div>
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

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>My Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className={`text-sm ${mutedClass}`}>Pending Tasks</p>
                    <p className={`text-2xl ${textClass} mt-1`}>{pendingTasks.length}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className={`text-sm ${mutedClass}`}>In Progress</p>
                    <p className={`text-2xl ${textClass} mt-1`}>{inProgressTasks.length}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className={`text-sm ${mutedClass}`}>Completed</p>
                    <p className={`text-2xl ${textClass} mt-1`}>{completedTasks.length}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className={`text-sm ${mutedClass}`}>Total Tasks</p>
                    <p className={`text-2xl ${textClass} mt-1`}>{myTasks.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl text-gray-900 mb-2">{selectedTask.title}</h2>
                <Badge
                  variant={
                    selectedTask.status === 'completed' ? 'default' :
                    selectedTask.status === 'in-progress' ? 'secondary' : 'outline'
                  }
                >
                  {selectedTask.status}
                </Badge>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedTask(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-600 mb-2">Description</h3>
                <p className="text-gray-900">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm text-gray-600 mb-2">Due Date</h3>
                  <p className="text-gray-900">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                  {isOverdue(selectedTask.dueDate) && selectedTask.status !== 'completed' && (
                    <p className="text-red-600 text-sm mt-1">⚠️ This task is overdue</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm text-gray-600 mb-2">Created</h3>
                  <p className="text-gray-900">{new Date(selectedTask.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedTask.completionReport && (
                <div className="border-t pt-4">
                  <h3 className="text-lg text-gray-900 mb-3">Completion Report</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Work Type</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedTask.completionReport.workType.map((type, index) => (
                          <Badge key={index} variant="secondary">{type}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Beneficiaries</p>
                      <p className="text-gray-900">{selectedTask.completionReport.beneficiaries}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="text-gray-900">{selectedTask.completionReport.location}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                {selectedTask.status === 'pending' && (
                  <Button
                    onClick={() => {
                      handleStartTask(selectedTask);
                      setSelectedTask(null);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Start Task
                  </Button>
                )}
                {selectedTask.status === 'in-progress' && (
                  <Button
                    onClick={() => {
                      setSelectedTask(null);
                      handleOpenCompletionForm(selectedTask);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Complete & Submit Report
                  </Button>
                )}
                <Button
                  onClick={() => setSelectedTask(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Completion Form Modal - Fixed Size */}
      {completingTask && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setCompletingTask(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl text-gray-900 mb-2">Task Completion Report</h2>
                <p className="text-gray-600">{completingTask.title}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setCompletingTask(null)}
              >
                ✕
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmitCompletionForm} className="space-y-6">
                <div>
                  <Label className="text-base mb-3 block">Type of Work Performed *</Label>
                  <p className="text-sm text-gray-600 mb-3">Select all that apply:</p>
                  <div className="space-y-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {WORK_TYPES.map((workType) => (
                      <div key={workType} className="flex items-start gap-3">
                        <Checkbox
                          id={workType}
                          checked={completionForm.workType.includes(workType)}
                          onCheckedChange={() => handleToggleWorkType(workType)}
                        />
                        <label
                          htmlFor={workType}
                          className="text-sm text-gray-900 cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {workType}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="beneficiaries">Number of Beneficiaries *</Label>
                    <Input
                      id="beneficiaries"
                      value={completionForm.beneficiaries}
                      onChange={(e) => setCompletionForm({ ...completionForm, beneficiaries: e.target.value })}
                      placeholder="e.g., 25 families"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={completionForm.location}
                      onChange={(e) => setCompletionForm({ ...completionForm, location: e.target.value })}
                      placeholder="e.g., Barangay Hall"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="findings">Key Findings/Observations *</Label>
                  <textarea
                    id="findings"
                    value={completionForm.findings}
                    onChange={(e) => setCompletionForm({ ...completionForm, findings: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows={4}
                    placeholder="Describe what you observed during this task..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="recommendations">Recommendations</Label>
                  <textarea
                    id="recommendations"
                    value={completionForm.recommendations}
                    onChange={(e) => setCompletionForm({ ...completionForm, recommendations: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows={3}
                    placeholder="Any recommendations for future actions..."
                  />
                </div>

                <div>
                  <Label htmlFor="challenges">Challenges Encountered</Label>
                  <textarea
                    id="challenges"
                    value={completionForm.challenges}
                    onChange={(e) => setCompletionForm({ ...completionForm, challenges: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows={3}
                    placeholder="Any challenges or difficulties you faced..."
                  />
                </div>
              </form>
            </div>

            <div className="border-t p-6">
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitCompletionForm}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Submit Report & Complete Task
                </Button>
                <Button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
