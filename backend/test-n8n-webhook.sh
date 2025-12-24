#!/bin/bash

echo "🧪 Testing N8N Webhook..."
echo ""

curl -X POST http://localhost:5678/webhook/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test123",
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "customerPhone": "1234567890",
    "customerAddress": "Test Address",
    "brand": "Panasonic",
    "model": "Test Model",
    "invoiceNumber": "INV-001",
    "preferredDateTime": "2025-11-12 10:00 AM",
    "companyEmail": "baburhussain660@gmail.com",
    "companyName": "Panasonic",
    "whatsappNumber": "N/A",
    "status": "Pending",
    "createdAt": "2025-11-12T09:00:00.000Z"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "✅ Test complete!"
echo ""
echo "Expected results:"
echo "  - HTTP Status: 200"
echo "  - Email should be sent to baburhussain660@gmail.com"
echo "  - Check n8n executions list for the workflow run"

