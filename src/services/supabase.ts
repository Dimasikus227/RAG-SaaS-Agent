
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with your project URL and anon key
const supabaseUrl = 'https://zvyldmazpktevdxeaavq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eWxkbWF6cGt0ZXZkeGVhYXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MjU3MTQsImV4cCI6MjA1ODQwMTcxNH0.imdsb6IJfScPYjn1W_NB4B4HJkdx5s9ABgsFaPPKQOc';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

interface User {
  id: string;
  email: string;
  name: string;
  role: 'standard' | 'pro' | 'free_access';
  avatarUrl?: string;
}

interface Subscription {
  id: string;
  userId: string;
  plan: 'standard' | 'pro';
  status: 'active' | 'canceled' | 'expired';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
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
      options: {
        data: {
          name: name,
        }
      }
    });

    if (error) throw error;

    if (data.user) {
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

export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear local storage
    localStorage.removeItem('user');
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    return false;
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

// New functions for subscription management

export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id,
      userId: data.user_id,
      plan: data.plan,
      status: data.status,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      autoRenew: data.auto_renew,
    };
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
};

export const createOrUpdateSubscription = async (
  userId: string, 
  plan: 'standard' | 'pro',
  startDate: Date,
  endDate: Date,
  autoRenew: boolean = true
): Promise<boolean> => {
  try {
    // First check if user already has an active subscription
    const existingSubscription = await getUserSubscription(userId);
    
    if (existingSubscription) {
      // Update existing subscription
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          auto_renew: autoRenew,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id);
        
      if (error) throw error;
    } else {
      // Create new subscription
      const { error } = await supabase
        .from('subscriptions')
        .insert([{
          user_id: userId,
          plan,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          auto_renew: autoRenew,
          created_at: new Date().toISOString()
        }]);
        
      if (error) throw error;
    }
    
    // Update user role based on subscription
    await updateUserRole(userId, plan);
    
    return true;
  } catch (error) {
    console.error('Error creating/updating subscription:', error);
    return false;
  }
};

export const cancelSubscription = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        auto_renew: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
};

export const updateUserRole = async (userId: string, role: 'standard' | 'pro' | 'free_access'): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
};

export const setFreeAccessForUser = async (userId: string): Promise<boolean> => {
  return updateUserRole(userId, 'free_access');
};
