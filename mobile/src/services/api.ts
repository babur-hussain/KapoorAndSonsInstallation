// API service for backend communication
// This will be used to connect to the backend server
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use IP address for Expo Go
const API_BASE_URL = 'http://192.168.29.132:4000';
const TOKEN_KEY = 'auth_token';

export interface BookingFormData {
  name: string;
  email?: string;
  phone: string;
  address: string;
  brand: string;
  model: string;
  invoiceNo?: string;
  preferredAt?: string; // ISO string format
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Main function to submit booking
export const submitBooking = async (data: BookingFormData): Promise<BookingResponse> => {
  try {
    console.log('Submitting booking to:', `${API_BASE_URL}/api/v1/bookings`);
    console.log('Booking data:', data);

    // Get token from secure storage
    const token = await SecureStore.getItemAsync(TOKEN_KEY);

    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('Using token:', token.substring(0, 20) + '...');

    // Use axios with explicit authorization header
    const response = await axios.post(`${API_BASE_URL}/api/v1/bookings`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Booking submitted successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to submit booking');
  }
};

// Legacy API object (keeping for backward compatibility)
export const api = {
  // Get bookings count
  async getBookingsCount(): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/count`);
      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
};

