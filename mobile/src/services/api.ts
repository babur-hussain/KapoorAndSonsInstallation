// API service for backend communication
// This will be used to connect to the backend server at http://localhost:4000

const API_BASE_URL = 'http://localhost:4000';

export interface BookingData {
  name: string;
  phone: string;
  brand?: string;
  model?: string;
  invoiceNo?: string;
  preferredAt?: Date;
}

export const api = {
  // Future: Submit booking to backend
  async submitBooking(data: BookingData): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit booking');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Future: Get bookings count
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

  // Future: Health check
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

