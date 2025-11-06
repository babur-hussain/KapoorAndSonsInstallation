// API service for backend communication
// This will be used to connect to the backend server at http://localhost:4000

const API_BASE_URL = 'http://localhost:4000';

export interface BookingFormData {
  name: string;
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

    const response = await fetch(`${API_BASE_URL}/api/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to submit booking');
    }

    const result = await response.json();
    console.log('Booking submitted successfully:', result);
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
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

