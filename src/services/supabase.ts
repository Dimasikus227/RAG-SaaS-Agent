
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

// Initialize Supabase client with your project URL and service role key
const supabaseUrl = 'https://zvyldmazpktevdxeaavq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eWxkbWF6cGt0ZXZkeGVhYXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjgyNTcxNCwiZXhwIjoyMDU4NDAxNzE0fQ.TF20bNN5S0ChNB-KdcUPFkjUIaQ97e3whaxI3TUBftw';

export const supabase = createClient(supabaseUrl, supabaseKey);

interface User {
  id: string;
  email: string;
  name: string;
  role: 'standard' | 'pro' | 'free_access';
  avatarUrl?: string;
}

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Get user profile information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, role, avatar_url')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      // Check if this is a special free_access user (email@example.com or manually set in profile)
      const userRole = profileData?.role || 'standard';
      
      return {
        id: data.user.id,
        email: data.user.email || '',
        name: profileData?.name || 'Користувач',
        role: userRole as 'standard' | 'pro' | 'free_access',
        avatarUrl: profileData?.avatar_url,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

export const registerUser = async (name: string, email: string, password: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Create a profile for the new user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: data.user.id, 
            name, 
            email,
            role: 'standard',
            created_at: new Date(),
          }
        ]);

      if (profileError) throw profileError;

      return {
        id: data.user.id,
        email: data.user.email || '',
        name,
        role: 'standard',
      };
    }
    
    return null;
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
};

export const getUserRole = async (userId: string): Promise<'standard' | 'pro' | 'free_access'> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) throw error;
    
    return (data?.role as 'standard' | 'pro' | 'free_access') || 'standard';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'standard';
  }
};

export const saveUserQuery = async (userId: string, query: string, response: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('queries')
      .insert([
        { 
          user_id: userId, 
          query, 
          response,
          created_at: new Date()
        }
      ]);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error saving query:', error);
    return false;
  }
};

export const getUserQueries = async (userId: string): Promise<Array<{query: string, response: string, timestamp: Date}>> => {
  try {
    const { data, error } = await supabase
      .from('queries')
      .select('query, response, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(item => ({
      query: item.query,
      response: item.response,
      timestamp: new Date(item.created_at)
    }));
  } catch (error) {
    console.error('Error getting user queries:', error);
    return [];
  }
};
