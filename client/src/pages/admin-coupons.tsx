import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag, Percent, DollarSign, Gift } from 'lucide-react';
import type { Coupon } from '@shared/schema';

export default function AdminCoupons() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['/api/admin/coupons'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/coupons');
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (couponData: any) => {
      const response = await apiRequest('POST', '/api/admin/coupons', couponData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      setIsCreateModalOpen(false);
      toast({
        title: "Success",
        description: "Coupon created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create coupon",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest('PUT', `/api/admin/coupons/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      setEditingCoupon(null);
      toast({
        title: "Success",
        description: "Coupon updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update coupon",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      toast({
        title: "Success",
        description: "Coupon deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive"
      });
    }
  });

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'percent': return <Percent className="w-4 h-4" />;
      case 'amount': return <DollarSign className="w-4 h-4" />;
      case 'free_month': return <Gift className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getDiscountText = (coupon: Coupon) => {
    switch (coupon.discountType) {
      case 'percent': return `${coupon.discountValue}% off`;
      case 'amount': return `$${coupon.discountValue} off`;
      case 'free_month': return 'Free first month';
      default: return coupon.discountValue;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Coupon Management</h1>
          <p className="text-zinc-400">Create and manage discount coupons</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black" data-testid="create-coupon-button">
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Coupon</DialogTitle>
            </DialogHeader>
            <CouponForm 
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupon List */}
      <div className="grid gap-4">
        {coupons?.length === 0 ? (
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-8 text-center">
              <Tag className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No coupons created yet</h3>
              <p className="text-zinc-400 mb-4">Create your first discount coupon to get started.</p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Coupon
              </Button>
            </CardContent>
          </Card>
        ) : (
          coupons?.map((coupon: Coupon) => (
            <Card key={coupon.id} className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      {getDiscountIcon(coupon.discountType)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white">{coupon.name}</h3>
                        <Badge 
                          variant={coupon.isActive ? "default" : "secondary"}
                          className={coupon.isActive ? "bg-green-500/20 text-green-400" : "bg-zinc-600 text-zinc-400"}
                        >
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400">Code: <span className="font-mono">{coupon.code}</span></p>
                      <p className="text-sm text-amber-400">{getDiscountText(coupon)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right text-sm text-zinc-400">
                      <p>Used: {coupon.currentUses || 0}{coupon.maxUses ? `/${coupon.maxUses}` : ''}</p>
                      {coupon.expiresAt && (
                        <p>Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</p>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCoupon(coupon)}
                      data-testid={`edit-coupon-${coupon.code}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(coupon.id)}
                      className="text-red-400 hover:text-red-300"
                      data-testid={`delete-coupon-${coupon.code}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingCoupon} onOpenChange={() => setEditingCoupon(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Coupon</DialogTitle>
          </DialogHeader>
          {editingCoupon && (
            <CouponForm 
              initialData={editingCoupon}
              onSubmit={(data) => updateMutation.mutate({ id: editingCoupon.id, ...data })}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CouponFormProps {
  initialData?: Coupon;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function CouponForm({ initialData, onSubmit, isLoading }: CouponFormProps) {
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    discountType: initialData?.discountType || 'percent',
    discountValue: initialData?.discountValue || '',
    isActive: initialData?.isActive ?? true,
    oneTimeUse: initialData?.oneTimeUse ?? false,
    newAccountsOnly: initialData?.newAccountsOnly ?? false,
    maxUses: initialData?.maxUses || '',
    expiresAt: initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().slice(0, 16) : ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null
    };
    
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="code" className="text-zinc-300">Coupon Code</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
          placeholder="SAVE20"
          className="bg-zinc-800 border-zinc-600 text-white"
          required
          data-testid="coupon-code-input"
        />
      </div>

      <div>
        <Label htmlFor="name" className="text-zinc-300">Display Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="20% Off Discount"
          className="bg-zinc-800 border-zinc-600 text-white"
          required
          data-testid="coupon-name-input"
        />
      </div>

      <div>
        <Label htmlFor="discountType" className="text-zinc-300">Discount Type</Label>
        <Select value={formData.discountType} onValueChange={(value) => setFormData(prev => ({ ...prev, discountType: value }))}>
          <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white" data-testid="discount-type-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-600">
            <SelectItem value="percent">Percentage Off</SelectItem>
            <SelectItem value="amount">Dollar Amount Off</SelectItem>
            <SelectItem value="free_month">Free First Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.discountType !== 'free_month' && (
        <div>
          <Label htmlFor="discountValue" className="text-zinc-300">
            Discount Value {formData.discountType === 'percent' ? '(%)' : '($)'}
          </Label>
          <Input
            id="discountValue"
            type="number"
            step={formData.discountType === 'amount' ? '0.01' : '1'}
            value={formData.discountValue}
            onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
            placeholder={formData.discountType === 'percent' ? '20' : '5.00'}
            className="bg-zinc-800 border-zinc-600 text-white"
            required
            data-testid="discount-value-input"
          />
        </div>
      )}

      <div>
        <Label htmlFor="maxUses" className="text-zinc-300">Max Uses (Optional)</Label>
        <Input
          id="maxUses"
          type="number"
          value={formData.maxUses}
          onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
          placeholder="Leave empty for unlimited"
          className="bg-zinc-800 border-zinc-600 text-white"
          data-testid="max-uses-input"
        />
      </div>

      <div>
        <Label htmlFor="expiresAt" className="text-zinc-300">Expiration Date (Optional)</Label>
        <Input
          id="expiresAt"
          type="datetime-local"
          value={formData.expiresAt}
          onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
          className="bg-zinc-800 border-zinc-600 text-white"
          data-testid="expires-at-input"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isActive" className="text-zinc-300">Active</Label>
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          data-testid="is-active-switch"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="oneTimeUse" className="text-zinc-300">One-time Use</Label>
        <Switch
          id="oneTimeUse"
          checked={formData.oneTimeUse}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, oneTimeUse: checked }))}
          data-testid="one-time-use-switch"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="newAccountsOnly" className="text-zinc-300">New Accounts Only</Label>
        <Switch
          id="newAccountsOnly"
          checked={formData.newAccountsOnly}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, newAccountsOnly: checked }))}
          data-testid="new-accounts-only-switch"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-amber-500 hover:bg-amber-600 text-black"
        disabled={isLoading}
        data-testid="submit-coupon-form"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            <span>{initialData ? 'Updating...' : 'Creating...'}</span>
          </div>
        ) : (
          initialData ? 'Update Coupon' : 'Create Coupon'
        )}
      </Button>
    </form>
  );
}