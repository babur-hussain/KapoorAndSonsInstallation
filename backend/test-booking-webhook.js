/**
 * Test script to verify n8n webhook integration for booking emails
 * 
 * This script simulates a booking creation and tests the webhook trigger
 * 
 * Usage:
 *   node test-booking-webhook.js
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/send-booking-email';

console.log('\n' + '='.repeat(70));
console.log('🧪 TESTING N8N BOOKING WEBHOOK');
console.log('='.repeat(70));
console.log('Webhook URL:', N8N_WEBHOOK_URL);
console.log('='.repeat(70) + '\n');

// Sample booking data
const testBooking = {
  bookingId: '507f1f77bcf86cd799439011',
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  customerPhone: '+919876543210',
  customerAddress: '123 Test Street, Test City, 12345',
  brand: 'Samsung',
  model: 'Galaxy S24 Ultra',
  invoiceNumber: 'INV-TEST-001',
  preferredDateTime: new Date().toISOString(),
  companyEmail: 'company@example.com',
  companyName: 'Samsung India',
  whatsappNumber: '+919876543210',
  status: 'Pending',
  createdAt: new Date().toISOString()
};

async function testWebhook() {
  try {
    console.log('📤 Sending test booking data to webhook...\n');
    console.log('Payload:');
    console.log(JSON.stringify(testBooking, null, 2));
    console.log('\n' + '-'.repeat(70) + '\n');

    const response = await axios.post(N8N_WEBHOOK_URL, testBooking, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    console.log('✅ SUCCESS! Webhook triggered successfully\n');
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST PASSED - Webhook is working correctly!');
    console.log('='.repeat(70) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ TEST FAILED - Webhook error');
    console.error('='.repeat(70));
    console.error('Error Message:', error.message);

    if (error.response) {
      console.error('\nResponse Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      console.error('\n⚠️  No response received from webhook');
      console.error('Is n8n running on', N8N_WEBHOOK_URL, '?');
      console.error('\nTroubleshooting:');
      console.error('1. Make sure n8n is running (usually on http://localhost:5678)');
      console.error('2. Verify the webhook URL is correct in .env file');
      console.error('3. Check that the n8n workflow is active');
      console.error('4. Ensure the webhook endpoint matches: /webhook/send-booking-email');
    }

    console.error('\n' + '='.repeat(70) + '\n');
    process.exit(1);
  }
}

// Run the test
console.log('🚀 Starting webhook test...\n');
testWebhook();

