import { createContext, useContext, useEffect, useState } from 'react';
import { jellyfinApi, type JellyfinUser } from '@/lib/jellyfin-api';

interface AuthUser extends JellyfinUser {
  planType: 'standard' | 'premium';
  accessToken: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('alfredflix_user');
    const storedToken = localStorage.getItem('alfredflix_token');

    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        const authUser = { ...userData, accessToken: storedToken };
        setUser(authUser);
        
        // Set the API token for Jellyfin requests
        jellyfinApi.setCredentials(storedToken, userData.Id);
      } catch (error) {
        console.error('Failed to restore user session:', error);
        localStorage.removeItem('alfredflix_user');
        localStorage.removeItem('alfredflix_token');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const authResult = await jellyfinApi.authenticate(username, password);
      
      // Determine plan type based on Jellyfin user policy
      const planType = determinePlanType(authResult.User);
      
      const authUser: AuthUser = {
        ...authResult.User,
        planType,
        accessToken: authResult.AccessToken
      };

      setUser(authUser);
      
      // Store in localStorage for session persistence
      localStorage.setItem('alfredflix_user', JSON.stringify(authUser));
      localStorage.setItem('alfredflix_token', authResult.AccessToken);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    jellyfinApi.logout();
    localStorage.removeItem('alfredflix_user');
    localStorage.removeItem('alfredflix_token');
  };

  const determinePlanType = (user: JellyfinUser): 'standard' | 'premium' => {
    // Check if user has access to UHD libraries or more than 2 streams
    const maxStreams = user.Policy?.MaxActiveSessions || 1;
    const enabledFolders = user.Policy?.EnabledFolders || [];
    
    // If user has 4+ streams or access to UHD content, they're premium
    if (maxStreams >= 4 || enabledFolders.length > 2) {
      return 'premium';
    }
    
    return 'standard';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
