import { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, Crown, DollarSign, UserPlus, RefreshCw, Trash2, Edit3, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  planType: 'standard' | 'premium';
  monthlyPrice?: string;
  jellyfinUserId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'inactive' | 'suspended';
  isAdmin: boolean;
  createdAt: string;
  expiresAt?: string;
  neverExpires?: boolean;
}

interface JellyfinUserImport {
  id: string;
  name: string;
  hasPassword: boolean;
  lastLoginDate?: string;
  lastActivityDate?: string;
  isAdmin?: boolean;
  isDisabled?: boolean;
}

interface JellyfinLibrary {
  id: string;
  name: string;
  collectionType: string;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [bulkDays, setBulkDays] = useState('');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    planType: 'standard' as 'standard' | 'premium',
    monthlyPrice: '9.99',
    isAdmin: false,
  });
  
  // Admin verification
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <Navigation />
        <div className="container mx-auto px-4 pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-zinc-400">You don't have permission to access the admin panel.</p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch users 
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => apiRequest('GET', '/api/admin/users').then(r => r.json()),
    enabled: !!user?.isAdmin,
  });

  // Fetch Jellyfin users for import
  const { data: jellyfinUsers, isLoading: jellyfinUsersLoading, error: jellyfinUsersError } = useQuery({
    queryKey: ['admin', 'jellyfin-users'],
    queryFn: () => apiRequest('GET', '/api/admin/jellyfin-users').then(r => r.json()),
    enabled: importDialogOpen,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AdminUser> }) =>
      apiRequest('PATCH', `/api/admin/users/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User updated successfully' });
      setUserDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update user', description: error.message, variant: 'destructive' });
    }
  });

  // Import Jellyfin user mutation
  const importUserMutation = useMutation({
    mutationFn: (jellyfinUser: JellyfinUserImport & { planType: string }) =>
      apiRequest('POST', '/api/admin/import-user', jellyfinUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User imported successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to import user', variant: 'destructive' });
    }
  });

  // Create new user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: typeof newUser) =>
      apiRequest('POST', '/api/admin/create-user', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User created successfully' });
      setCreateUserDialogOpen(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        planType: 'standard',
        monthlyPrice: '9.99',
        isAdmin: false,
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create user', 
        description: error.message || 'Unknown error',
        variant: 'destructive' 
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest('DELETE', `/api/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User deleted successfully' });
      setUserDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete user', description: error.message, variant: 'destructive' });
    }
  });

  // Stats calculations
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter((u: AdminUser) => u.status === 'active').length || 0;
  const premiumUsers = users?.filter((u: AdminUser) => u.planType === 'premium').length || 0;
  
  // Calculate revenue using actual individual pricing instead of plan defaults
  const totalRevenue = users?.reduce((sum, user) => {
    if (user.status === 'active') {
      const monthlyPrice = parseFloat(user.monthlyPrice || '0');
      return sum + monthlyPrice;
    }
    return sum;
  }, 0) || 0;

  const handleUserUpdate = (updates: Partial<AdminUser>) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ id: selectedUser.id, updates });
  };

  const handleJellyfinImport = (jellyfinUser: JellyfinUserImport, planType: string) => {
    importUserMutation.mutate({ ...jellyfinUser, planType });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900" data-testid="admin-panel">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-zinc-400">Manage users, billing, and system settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="luxury-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">Total Users</CardTitle>
              <Users className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalUsers}</div>
              <p className="text-xs text-zinc-500">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">Active Users</CardTitle>
              <Crown className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activeUsers}</div>
              <p className="text-xs text-zinc-500">{premiumUsers} premium subscribers</p>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-zinc-500">Recurring revenue</p>
            </CardContent>
          </Card>

          <Card className="luxury-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">Actions</CardTitle>
              <UserPlus className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full text-xs bg-amber-500 hover:bg-amber-600 text-black">
                    <Plus className="w-3 h-3 mr-1" />
                    Create New User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md luxury-card">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <Label htmlFor="username" className="text-zinc-300">Username</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        className="bg-zinc-700 border-zinc-600"
                        placeholder="Enter username"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-zinc-300">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        className="bg-zinc-700 border-zinc-600"
                        placeholder="Enter email"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-zinc-300">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="bg-zinc-700 border-zinc-600"
                        placeholder="Enter password"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan" className="text-zinc-300">Plan Type</Label>
                      <Select value={newUser.planType} onValueChange={(value: 'standard' | 'premium') => {
                        const defaultPrice = value === 'premium' ? '14.99' : '9.99';
                        setNewUser({...newUser, planType: value, monthlyPrice: defaultPrice});
                      }}>
                        <SelectTrigger className="bg-zinc-700 border-zinc-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard (Default: $9.99/month)</SelectItem>
                          <SelectItem value="premium">Premium (Default: $14.99/month)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="monthlyPrice" className="text-zinc-300">Monthly Price ($)</Label>
                      <Input
                        id="monthlyPrice"
                        type="number"
                        step="0.01"
                        value={newUser.monthlyPrice}
                        onChange={(e) => setNewUser({...newUser, monthlyPrice: e.target.value})}
                        className="bg-zinc-700 border-zinc-600"
                        placeholder="9.99"
                      />
                      <p className="text-xs text-zinc-500 mt-1">Set to 0.00 for free users or custom pricing</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAdmin"
                        checked={newUser.isAdmin}
                        onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="isAdmin" className="text-zinc-300">Admin privileges</Label>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        type="submit" 
                        disabled={createUserMutation.isPending}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
                      >
                        {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setCreateUserDialogOpen(false)}
                        className="border-zinc-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full text-xs border-zinc-600">Import Jellyfin Users</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto luxury-card">
                  <DialogHeader>
                    <DialogTitle>Import Jellyfin Users</DialogTitle>
                    <p className="text-sm text-zinc-400">Only showing users not already imported to AlfredFlix</p>
                  </DialogHeader>
                  <div className="space-y-4">
                    {jellyfinUsersLoading && (
                      <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-zinc-400">Loading Jellyfin users...</p>
                      </div>
                    )}
                    {jellyfinUsersError && (
                      <div className="text-center py-8 text-red-400">
                        <p>Failed to load Jellyfin users</p>
                        <p className="text-sm text-zinc-500 mt-2">{jellyfinUsersError.message}</p>
                      </div>
                    )}
                    {!jellyfinUsersLoading && !jellyfinUsersError && jellyfinUsers?.filter((jfUser: JellyfinUserImport) => {
                      // Filter out users that already exist in AlfredFlix
                      const existsInAlfredFlix = users?.some((user: AdminUser) => 
                        user.username.toLowerCase() === jfUser.name.toLowerCase() ||
                        user.jellyfinUserId === jfUser.id
                      );
                      return !existsInAlfredFlix;
                    }).map((jfUser: JellyfinUserImport) => (
                      <div key={jfUser.id} className="flex items-center justify-between p-4 border border-zinc-700 rounded-lg bg-zinc-800/50">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-white">{jfUser.name}</p>
                            {jfUser.isAdmin && <Badge className="bg-amber-500 text-xs">JF Admin</Badge>}
                            {jfUser.isDisabled && <Badge variant="destructive" className="text-xs">Disabled</Badge>}
                          </div>
                          <div className="text-sm text-zinc-400 space-y-1">
                            {jfUser.lastLoginDate && (
                              <p>Last login: {new Date(jfUser.lastLoginDate).toLocaleDateString()}</p>
                            )}
                            {jfUser.lastActivityDate && (
                              <p>Last activity: {new Date(jfUser.lastActivityDate).toLocaleDateString()}</p>
                            )}
                            {!jfUser.lastLoginDate && !jfUser.lastActivityDate && (
                              <p>Never logged in</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!jfUser.isDisabled && (
                            <Select onValueChange={(planType) => handleJellyfinImport(jfUser, planType)}>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Import as..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    ))}
                    {!jellyfinUsersLoading && !jellyfinUsersError && jellyfinUsers?.filter((jfUser: JellyfinUserImport) => {
                      const existsInAlfredFlix = users?.some((user: AdminUser) => 
                        user.username.toLowerCase() === jfUser.name.toLowerCase() ||
                        user.jellyfinUserId === jfUser.id
                      );
                      return !existsInAlfredFlix;
                    }).length === 0 && (
                      <div className="text-center py-8 text-zinc-400">
                        <p>All Jellyfin users have already been imported to AlfredFlix</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="text-white">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-zinc-300">Username</TableHead>
                  <TableHead className="text-zinc-300">Email</TableHead>
                  <TableHead className="text-zinc-300">Plan</TableHead>
                  <TableHead className="text-zinc-300">Price/Month</TableHead>
                  <TableHead className="text-zinc-300">Status</TableHead>
                  <TableHead className="text-zinc-300">Admin</TableHead>
                  <TableHead className="text-zinc-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u: AdminUser) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-white font-medium">{u.username}</TableCell>
                    <TableCell className="text-zinc-300">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.planType === 'premium' ? 'default' : 'secondary'}>
                        {u.planType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      ${u.monthlyPrice || '9.99'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={u.status === 'active' ? 'default' : u.status === 'suspended' ? 'destructive' : 'secondary'}
                      >
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.isAdmin ? <Badge className="bg-amber-500">Admin</Badge> : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog open={userDialogOpen && selectedUser?.id === u.id} onOpenChange={(open) => {
                          setUserDialogOpen(open);
                          if (open) setSelectedUser(u);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit3 className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="sm:max-w-md luxury-card">
                          <DialogHeader>
                            <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="planType">Plan Type</Label>
                              <Select 
                                value={selectedUser?.planType} 
                                onValueChange={(value) => handleUserUpdate({ planType: value as 'standard' | 'premium' })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">Standard</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="monthlyPrice">Monthly Price ($)</Label>
                              <Input
                                id="monthlyPrice"
                                type="number"
                                step="0.01"
                                value={editingPrice || selectedUser?.monthlyPrice || '9.99'}
                                onChange={(e) => setEditingPrice(e.target.value)}
                                onBlur={(e) => {
                                  handleUserUpdate({ monthlyPrice: e.target.value });
                                  setEditingPrice('');
                                }}
                                onFocus={(e) => setEditingPrice(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUserUpdate({ monthlyPrice: e.currentTarget.value });
                                    setEditingPrice('');
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="bg-zinc-700 border-zinc-600"
                                placeholder="9.99"
                              />
                              <p className="text-xs text-zinc-500 mt-1">Set to 0.00 for free users or enter custom pricing</p>
                            </div>
                            <div>
                              <Label htmlFor="status">Status</Label>
                              <Select 
                                value={selectedUser?.status} 
                                onValueChange={(value) => handleUserUpdate({ status: value as 'active' | 'inactive' | 'suspended' })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="isAdmin"
                                checked={selectedUser?.isAdmin}
                                onChange={(e) => handleUserUpdate({ isAdmin: e.target.checked })}
                                className="w-4 h-4"
                              />
                              <Label htmlFor="isAdmin">Admin Access</Label>
                            </div>
                          </div>
                        </DialogContent>
                        </Dialog>
                        {user?.id !== u.id && ( // Don't allow deleting yourself
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}