import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  private supabasePublic: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  private authToken: string | null = null;

  async setAuthToken(token: string) {
    this.authToken = token;
  }

  private getHeaders() {
    const token = this.authToken || environment.supabaseAnonKey;
    return { Authorization: `Bearer ${token}` };
  }

  async getAvailability(date: string, userId: string): Promise<{ slots: { time: string; available: boolean }[]; error?: string }> {
    const response = await fetch(
      `${environment.supabaseUrl}/functions/v1/check-availability`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${environment.supabaseAnonKey}`,
          'apikey': environment.supabaseAnonKey
        },
        body: JSON.stringify({ date, userId })
      }
    );
    
    const result = await response.json();
    return result;
  }

  async createBooking(
    name: string,
    email: string,
    date: string,
    startTime: string,
    endTime: string,
    reason: string,
    userId: string,
    phone: string,
    services: number[] = []
  ): Promise<{ data?: any; error?: string }> {
    const response = await fetch(
      `${environment.supabaseUrl}/functions/v1/create-booking`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${environment.supabaseAnonKey}`,
          'apikey': environment.supabaseAnonKey
        },
        body: JSON.stringify({ name, email, phone, date, startTime, endTime, comment: reason, userId, services })
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.error || 'Error creating booking' };
    }
    
    return { data: result };
  }

  async checkAvailability(date: string, time: string, userId?: string): Promise<boolean> {
    const { slots, error } = await this.getAvailability(date, userId || '');
    
    if (error) {
      console.error('Error checking availability:', error);
      return false;
    }
    
    const slot = slots?.find(s => s.time === time);
    return slot ? slot.available : false;
  }

  async getBookingsByDate(date: string, userId?: string): Promise<any[]> {
    const { slots } = await this.getAvailability(date, userId || '');
    return slots || [];
  }

  async getBookingsWithClient(date: string, userId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${environment.supabaseUrl}/functions/v1/get-bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${environment.supabaseAnonKey}`,
            'apikey': environment.supabaseAnonKey
          },
          body: JSON.stringify({ userId, date })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error fetching bookings:', result.error);
        return [];
      }
      
      return result || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }

  async getBookingServices(bookingId: number): Promise<string[]> {
    try {
      const response = await fetch(
        `${environment.supabaseUrl}/functions/v1/get-booking-services`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${environment.supabaseAnonKey}`,
            'apikey': environment.supabaseAnonKey
          },
          body: JSON.stringify({ bookingId })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error fetching services:', result.error);
        return [];
      }
      
      return result || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  async cancelBooking(bookingId: number): Promise<{ success?: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${environment.supabaseUrl}/functions/v1/cancel-booking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${environment.supabaseAnonKey}`,
            'apikey': environment.supabaseAnonKey
          },
          body: JSON.stringify({ bookingId })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error canceling booking:', result.error);
        return { error: result.error };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error canceling booking:', error);
      return { error: 'Error al cancelar la cita' };
    }
  }

  async getUserTypes(): Promise<{ id: number; type: string }[]> {
    try {
      const headers: Record<string, string> = {
        'apikey': environment.supabaseAnonKey,
        'Authorization': `Bearer ${environment.supabaseAnonKey}`
      };
      
      const response = await fetch(
        `${environment.supabaseUrl}/rest/v1/user_type?select=id,type`,
        { headers }
      );
      
      if (!response.ok) {
        console.error('Error fetching user types:', response.status);
        return [];
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user types:', error);
      return [];
    }
  }

  async loginUser(user: string, password: string, keepSession: boolean): Promise<{ data?: any; error?: string }> {
    try {
      const hashedPassword = this.hashPassword(password);
      
      const { data, error } = await this.supabase
        .from('user')
        .select('id, user, user_type_id')
        .eq('user', user)
        .eq('password', hashedPassword)
        .single();
      
      if (error || !data) {
        return { error: 'Usuario o contrasena incorrectos' };
      }

      const expiresIn = keepSession ? '10000d' : '2h';
      
      const response = await fetch(
        `${environment.supabaseUrl}/functions/v1/generate-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${environment.supabaseAnonKey}`,
            'apikey': environment.supabaseAnonKey
          },
          body: JSON.stringify({ 
            userId: data.id,
            username: data.user,
            userTypeId: data.user_type_id,
            expiresIn
          })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        return { error: result.error || 'Error al iniciar sesion' };
      }

      this.setAuthToken(result.token);
      
      if (keepSession) {
        localStorage.setItem('auth_token', result.token);
      } else {
        sessionStorage.setItem('auth_token', result.token);
      }
      
      return { data: result };
    } catch (error) {
      console.error('Error logging in:', error);
      return { error: 'Error al iniciar sesion' };
    }
  }

  async createUser(user: string, phone: string, password: string, userTypeId: number): Promise<{ data?: any; error?: string }> {
    try {
      const token = this.getToken();
      
      const response = await fetch(
        `${environment.supabaseUrl}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || environment.supabaseAnonKey}`,
            'apikey': environment.supabaseAnonKey
          },
          body: JSON.stringify({ 
            username: user,
            phone: phone,
            password: password,
            user_type_id: userTypeId
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error creating user:', response.status, errorText);
        return { error: `Error al crear usuario: ${response.status} - ${errorText}` };
      }
      
      const resultText = await response.text();
      console.log('Create user response:', resultText);
      const result = resultText ? JSON.parse(resultText) : {};
      return { data: result };
    } catch (error) {
      console.error('Error creating user:', error);
      return { error: 'Error al crear usuario' };
    }
  }

  async updateUser(userId: number, user: string, phone: string, password: string, userTypeId: number): Promise<{ error?: string }> {
    try {
      const response = await fetch(
        `${environment.supabaseUrl}/functions/v1/update-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${environment.supabaseAnonKey}`,
            'apikey': environment.supabaseAnonKey
          },
          body: JSON.stringify({ 
            user_id: userId,
            username: user,
            phone: phone,
            password: password || null,
            user_type_id: userTypeId
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error updating user:', response.status, errorText);
        return { error: `Error al actualizar usuario: ${response.status}` };
      }
      
      return {};
    } catch (error) {
      console.error('Error updating user:', error);
      return { error: 'Error al actualizar usuario' };
    }
  }

  private hashPassword(password: string): string {
    return btoa(password);
  }

  async getServices(): Promise<{ data?: any[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('service')
        .select('id, name, price')
        .order('name');
      
      if (error) {
        console.error('Error fetching services:', error);
        return { error: error.message };
      }
      
      return { data: data || [] };
    } catch (error) {
      console.error('Error fetching services:', error);
      return { error: 'Error al obtener servicios' };
    }
  }

  async createService(name: string, price: number): Promise<{ data?: any; error?: string }> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { error: 'No hay sesión activa' };
      }
      
      const response = await fetch(
        `${environment.supabaseUrl}/functions/v1/create-service`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': environment.supabaseAnonKey
          },
          body: JSON.stringify({ name, price })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error creating service:', response.status, errorText);
        return { error: errorText };
      }
      
      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Error creating service:', error);
      return { error: 'Error al crear servicio' };
    }
  }

  async updateService(id: number, name: string, price: number): Promise<{ error?: string }> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { error: 'No hay sesión activa' };
      }
      
      const response = await fetch(
        `${environment.supabaseUrl}/functions/v1/update-service`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': environment.supabaseAnonKey
          },
          body: JSON.stringify({ id, name, price })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error updating service:', response.status, errorText);
        return { error: errorText };
      }
      
      const result = await response.json();
      return {};
    } catch (error) {
      console.error('Error updating service:', error);
      return { error: 'Error al actualizar servicio' };
    }
  }

  async deleteService(id: number): Promise<{ error?: string }> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { error: 'No hay sesión activa' };
      }
      
      const response = await fetch(
        `${environment.supabaseUrl}/functions/v1/delete-service`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': environment.supabaseAnonKey
          },
          body: JSON.stringify({ id })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error deleting service:', response.status, errorText);
        return { error: errorText };
      }
      
      return {};
    } catch (error) {
      console.error('Error deleting service:', error);
      return { error: 'Error al eliminar servicio' };
    }
  }

  private decodePassword(encodedPassword: string): string {
    if (!encodedPassword) return '';
    
    try {
      const decoded = atob(encodedPassword);
      if (decoded && decoded.length >= 8 && /^[a-zA-Z0-9#$,%!@]+$/.test(decoded)) {
        return decoded;
      }
      return encodedPassword;
    } catch {
      return encodedPassword;
    }
  }

  async getUsers(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('user')
        .select('id, user, phone, password, user_type_id, created_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error.message);
        return [];
      }
      
      const decodedUsers = (data || []).map(user => ({
        ...user,
        password: this.decodePassword(user.password)
      }));
      
      return decodedUsers || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getUsersByType(userTypeId: number): Promise<any[]> {
    console.log('=== getUsersByType called ===', userTypeId);
    try {
      const { data, error } = await this.supabase
        .from('user')
        .select('id, user, phone, password, user_type_id, created_at')
        .eq('user_type_id', userTypeId)
        .order('user', { ascending: true });
      
      console.log('getUsersByType response - data:', data, 'error:', error);
      
      if (error) {
        console.error('Error fetching users by type:', error.message);
        return [];
      }
      
      const decodedUsers = (data || []).map(user => ({
        ...user,
        password: this.decodePassword(user.password)
      }));
      
      return decodedUsers || [];
    } catch (error) {
      console.error('Error fetching users by type:', error);
      return [];
    }
  }

  async getUserById(userId: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('user')
        .select('id, user, phone')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user by id:', error.message);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user by id:', error);
      return null;
    }
  }

  async deleteUser(userId: number): Promise<{ error?: string }> {
    try {
      const response = await fetch(
        `${environment.supabaseUrl}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${environment.supabaseAnonKey}`,
            'apikey': environment.supabaseAnonKey
          },
          body: JSON.stringify({ user_id: userId })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error deleting user:', response.status, errorText);
        return { error: `Error al eliminar usuario: ${response.status}` };
      }
      
      return {};
    } catch (error) {
      console.error('Error deleting user:', error);
      return { error: 'Error al eliminar usuario' };
    }
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      const isExpired = decoded.exp * 1000 < Date.now();
      return !isExpired;
    } catch {
      return false;
    }
  }

  getUserInfo(): { userId?: number; username?: string; userTypeId?: number } | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      let payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      while (payload.length % 4) {
        payload += '=';
      }
      
      const decoded = JSON.parse(atob(payload));
      return {
        userId: parseInt(decoded.sub),
        username: decoded.username,
        userTypeId: decoded.userTypeId
      };
    } catch {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  }

  async createWorkSchedule(day: string, startHour: string, endHour: string): Promise<{ data?: any; error?: string }> {
    let token = this.authToken;
    
    if (!token) {
      token = localStorage.getItem('auth_token');
    }
    if (!token) {
      token = sessionStorage.getItem('auth_token');
    }
    
    if (!token) {
      return { error: 'No hay sesión activa. Por favor inicia sesión.' };
    }

    let userId: string | null = null;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        userId = payload.sub;
      }
    } catch (e) {
      console.error('Error parsing token:', e);
    }

    if (!userId) {
      return { error: 'No se pudo obtener el ID de usuario' };
    }
    
    try {
      const response = await fetch(
        `${environment.supabaseUrl}/functions/v1/create-work-schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': environment.supabaseAnonKey
          },
          body: JSON.stringify({ day, start_hour: startHour, end_hour: endHour })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        return { error: result.error || 'Error creating work schedule' };
      }
      
      return { data: result };
    } catch (error: any) {
      console.error('Error creating work schedule:', error);
      return { error: 'Error de conexión: ' + (error.message || 'Unknown error') };
    }
  }

  async deleteWorkSchedule(id: number): Promise<{ data?: any; error?: string }> {
    let token = this.authToken;
    
    if (!token) {
      token = localStorage.getItem('auth_token');
    }
    if (!token) {
      token = sessionStorage.getItem('auth_token');
    }

    console.log('Token being used:', token);
    console.log('Token length:', token?.length);
    console.log('Token preview:', token?.substring(0, 50));
    
    if (!token) {
      return { error: 'No hay sesión activa' };
    }
    
    try {
      const response = await fetch(
        `${environment.supabaseUrl}/functions/v1/delete-work-schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${environment.supabaseAnonKey}`,
            'apikey': environment.supabaseAnonKey
          },
          body: JSON.stringify({ id, token })
        }
      );

      console.log('Delete response status:', response.status);
      const responseText = await response.text();
      console.log('Delete response text:', responseText);
      
      if (!response.ok) {
        return { error: responseText };
      }
      
      return {};
    } catch (error: any) {
      console.error('Error deleting work schedule:', error);
      return { error: 'Error de conexión: ' + (error.message || 'Unknown error') };
    }
  }

  async getWorkSchedules(): Promise<{ data?: any; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('work_schedule')
        .select('*')
        .order('day', { ascending: true });
      
      if (error) {
        return { error: error.message };
      }
      
      return { data: data || [] };
    } catch (error) {
      console.error('Error fetching work schedules:', error);
      return { error: 'Error al obtener horarios' };
    }
  }

  async getClients(): Promise<any[]> {
    try {
      console.log('Fetching clients from Supabase...');
      const { data, error } = await this.supabasePublic
        .from('client')
        .select('id, name, email, phone')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching clients:', error.message);
        return [];
      }
      
      console.log('Clients fetched:', data);
      return data || [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  }

  async getAllBookings(): Promise<any[]> {
    try {
      const { data, error } = await this.supabasePublic
        .from('calendar_detail')
        .select('id');
      
      if (error) {
        console.error('Error fetching bookings:', error.message);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }

  async getAllBookingsByDate(date: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabasePublic
        .from('calendar_detail')
        .select('id')
        .eq('date', date);
      
      if (error) {
        console.error('Error fetching bookings:', error.message);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }
}
