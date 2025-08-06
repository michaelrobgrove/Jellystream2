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
import { Users, Crown, DollarSign, UserPlus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  planType: 'standard' | 'premium';
  jellyfinUserId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'inactive' | 'suspended';
  isAdmin: boolean;
  createdAt: string;
  expiresAt?: string;
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  
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
  });

  // Fetch Jellyfin users for import
  const { data: jellyfinUsers } = useQuery({
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
    onError: () => {
      toast({ title: 'Failed to update user', variant: 'destructive' });
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

  // Stats calculations
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter((u: AdminUser) => u.status === 'active').length || 0;
  const premiumUsers = users?.filter((u: AdminUser) => u.planType === 'premium').length || 0;
  const totalRevenue = premiumUsers * 14.99 + (activeUsers - premiumUsers) * 9.99;

  const handleUserUpdate = (updates: Partial<AdminUser>) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ id: selectedUser.id, updates });
  };

  const handleJellyfinImport = (jellyfinUser: JellyfinUserImport, planType: string) => {
    importUserMutation.mutate({ ...jellyfinUser, planType });
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
              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full text-xs">Import Jellyfin Users</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md luxury-card">
                  <DialogHeader>
                    <DialogTitle>Import Jellyfin Users</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {jellyfinUsers?.map((jfUser: JellyfinUserImport) => (
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
                    {jellyfinUsers?.length === 0 && (
                      <div className="text-center py-8 text-zinc-400">
                        <p>No Jellyfin users found</p>
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
                      <Dialog open={userDialogOpen && selectedUser?.id === u.id} onOpenChange={(open) => {
                        setUserDialogOpen(open);
                        if (open) setSelectedUser(u);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">Edit</Button>
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
                                  <SelectItem value="standard">Standard ($9.99/mo)</SelectItem>
                                  <SelectItem value="premium">Premium ($14.99/mo)</SelectItem>
                                </SelectContent>
                              </Select>
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