import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Crown, Menu, X, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';

interface NavigationProps {
  onAuthModal?: () => void;
}

export function Navigation({ onAuthModal }: NavigationProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPublicRoute = location === '/' || location === '/login';

  const publicNavItems = [
    { href: '/#home', label: 'Home' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/#contact', label: 'Contact' }
  ];

  const privateNavItems = [
    { href: '/dashboard', label: 'Browse' },
    { href: '/search', label: 'Search' }
  ];

  const currentNavItems = isPublicRoute ? publicNavItems : privateNavItems;

  return (
    <nav className="fixed top-0 w-full z-50 bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-800/50" data-testid="navigation">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-3" data-testid="logo-link">
            <div className="w-10 h-10 rounded-lg alfredflix-gradient flex items-center justify-center">
              <Crown className="text-zinc-900 w-5 h-5" />
            </div>
            <span className="font-serif text-xl font-semibold alfredflix-text-gradient">
              AlfredFlix
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {currentNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop Auth/User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-zinc-400 capitalize" data-testid="user-plan">
                  {user.planType}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-8 h-8 rounded-full alfredflix-gradient p-0" data-testid="user-menu">
                      <User className="w-4 h-4 text-zinc-900" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="flex items-center space-x-2" data-testid="menu-profile">
                      <User className="w-4 h-4" />
                      <span>{user.Name}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center space-x-2 cursor-pointer" 
                      onClick={() => window.location.href = '/dashboard'}
                      data-testid="menu-settings"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Library</span>
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem 
                        className="flex items-center space-x-2 cursor-pointer" 
                        onClick={() => window.location.href = '/admin'}
                        data-testid="menu-admin"
                      >
                        <Crown className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      className="flex items-center space-x-2 text-red-400" 
                      onClick={logout}
                      data-testid="menu-logout"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button 
                onClick={onAuthModal}
                className="alfredflix-gradient text-zinc-900 font-medium hover:shadow-lg hover:shadow-amber-500/25"
                data-testid="signin-button"
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" data-testid="mobile-menu-button">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-6 mt-8">
                {currentNavItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-lg text-zinc-300 hover:text-amber-500 transition-colors"
                    onClick={() => setMobileOpen(false)}
                    data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </a>
                ))}
                
                {user ? (
                  <div className="pt-6 border-t border-zinc-800">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 rounded-full alfredflix-gradient flex items-center justify-center">
                        <User className="w-4 h-4 text-zinc-900" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.Name}</p>
                        <p className="text-sm text-zinc-400 capitalize">{user.planType}</p>
                      </div>
                    </div>
                    {user.isAdmin && (
                      <Button 
                        onClick={() => { window.location.href = '/admin'; setMobileOpen(false); }}
                        variant="ghost" 
                        className="w-full justify-start text-amber-400 mb-2"
                        data-testid="mobile-admin"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Button>
                    )}
                    <Button 
                      onClick={() => { logout(); setMobileOpen(false); }}
                      variant="ghost" 
                      className="w-full justify-start text-red-400"
                      data-testid="mobile-logout"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => { onAuthModal?.(); setMobileOpen(false); }}
                    className="alfredflix-gradient text-zinc-900 font-medium"
                    data-testid="mobile-signin"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
