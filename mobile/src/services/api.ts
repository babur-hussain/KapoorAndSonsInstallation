// API service for backend communication
// This will be used to connect to the backend server
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use centralized API_HOST and API_BASE_URL
import { API_HOST, API_BASE_URL } from '../config/api';
const TOKEN_KEY = 'auth_token';

export interface BookingFormData {
  name: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  alternateAddress?: string;
  landmark?: string;
  serialNumber?: string;
  city: string;
  state: string;
  pinCode: string;
  serviceType?: string; // 'New Installation' or 'Service Complaint'
  problemDescription?: string; // Required when serviceType is 'Service Complaint'
  category?: string; // MongoDB ObjectId of the category
  categoryName?: string;
  brand: string;
  model: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Main function to submit booking
export const submitBooking = async (data: BookingFormData): Promise<BookingResponse> => {
  try {
    console.log('Submitting booking to:', `${API_BASE_URL}/bookings`);
    console.log('Booking data:', data);

    // Get token from secure storage
    const token = await SecureStore.getItemAsync(TOKEN_KEY);

    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('Using token:', token.substring(0, 20) + '...');

    // Use axios with explicit authorization header
    const response = await axios.post(`${API_BASE_URL}/bookings`, data, {
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

// Fetch email thread for a booking
export async function getBookingEmails(bookingId: string, token: string) {
  const response = await axios.get(`${API_BASE_URL}/bookings/${bookingId}/emails`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data?.emails || [];
}

export interface RescheduleResponse {
  success: boolean;
  message: string;
  data?: {
    bookingId: string;
    lastRescheduleEmailAt?: string;
    rescheduleCount?: number;
    nextAvailableAt?: string;
  };
}

export interface RescheduleRequestPayload {
  mongoId?: string;
  bookingCode?: string;
}

export async function triggerBookingReschedule(
  payload: RescheduleRequestPayload,
  token: string
): Promise<RescheduleResponse> {
  const { mongoId, bookingCode } = payload;
  const url = mongoId
    ? `${API_BASE_URL}/bookings/${mongoId}/reschedule-email`
    : `${API_BASE_URL}/bookings/reschedule-email`;

  const body: Record<string, string | undefined> = {
    bookingId: bookingCode,
    mongoId,
  };

  const response = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

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
      const response = await fetch(`${API_BASE_URL.replace('/api/v1','')}/health`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
};

