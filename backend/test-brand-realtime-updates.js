/**
 * Test Script: Real-Time Brand Updates
 * 
 * This script tests the real-time brand synchronization between
 * AdminJS and the mobile app via Socket.IO.
 * 
 * Usage: node test-brand-realtime-updates.js
 */

import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:4000';
const SOCKET_URL = 'http://localhost:4000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

// Test results
let testsPassed = 0;
let testsFailed = 0;

async function runTests() {
  logSection('🧪 REAL-TIME BRAND UPDATES TEST');
  
  // Setup Socket.IO client
  log('\n📡 Connecting to Socket.IO server...', 'blue');
  const socket = io(SOCKET_URL, {
    transports: ['polling', 'websocket'],
    reconnection: false,
  });

  // Wait for connection
  await new Promise((resolve) => {
    socket.on('connect', () => {
      log(`✅ Socket connected: ${socket.id}`, 'green');
      resolve();
    });
  });

  // Setup event listeners
  const events = {
    brandCreated: [],
    brandUpdated: [],
    brandDeleted: [],
  };

  socket.on('brandCreated', (data) => {
    log(`\n⚡ Socket Event Received: brandCreated`, 'magenta');
    log(`   Brand: ${data.name}`, 'magenta');
    log(`   ID: ${data.brandId}`, 'magenta');
    events.brandCreated.push(data);
  });

  socket.on('brandUpdated', (data) => {
    log(`\n⚡ Socket Event Received: brandUpdated`, 'magenta');
    log(`   Brand: ${data.name}`, 'magenta');
    log(`   ID: ${data.brandId}`, 'magenta');
    events.brandUpdated.push(data);
  });

  socket.on('brandDeleted', (data) => {
    log(`\n⚡ Socket Event Received: brandDeleted`, 'magenta');
    log(`   Brand: ${data.name}`, 'magenta');
    log(`   ID: ${data.brandId}`, 'magenta');
    events.brandDeleted.push(data);
  });

  // Test 1: Fetch current brands
  logSection('Test 1: Fetch Current Brands');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/brands`);
    
    if (response.data.success) {
      log(`✅ Brands fetched successfully`, 'green');
      log(`   Total brands: ${response.data.count}`, 'blue');
      
      response.data.data.forEach((brand, index) => {
        log(`   ${index + 1}. ${brand.name} (Active: ${brand.isActive})`, 'blue');
      });
      
      testsPassed++;
    } else {
      throw new Error('Failed to fetch brands');
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
    testsFailed++;
  }

  // Test 2: Instructions for manual testing
  logSection('Test 2: Manual Testing Instructions');
  log('\n📝 To test real-time updates:', 'yellow');
  log('   1. Open AdminJS: http://localhost:4000/admin', 'yellow');
  log('   2. Navigate to: Brands & Models → Brand', 'yellow');
  log('   3. Create a new brand (e.g., "Sony")', 'yellow');
  log('   4. Watch this terminal for Socket.IO events', 'yellow');
  log('   5. Check mobile app - new brand should appear instantly', 'yellow');
  log('\n⏳ Waiting 30 seconds for manual testing...', 'yellow');
  log('   (Press Ctrl+C to exit early)\n', 'yellow');

  // Wait for 30 seconds to allow manual testing
  await new Promise((resolve) => setTimeout(resolve, 30000));

  // Test 3: Check if events were received
  logSection('Test 3: Socket.IO Events Summary');
  
  log(`\n📊 Events Received:`, 'blue');
  log(`   brandCreated: ${events.brandCreated.length}`, 'blue');
  log(`   brandUpdated: ${events.brandUpdated.length}`, 'blue');
  log(`   brandDeleted: ${events.brandDeleted.length}`, 'blue');

  if (events.brandCreated.length > 0) {
    log(`\n✅ brandCreated events received:`, 'green');
    events.brandCreated.forEach((event, index) => {
      log(`   ${index + 1}. ${event.name} (ID: ${event.brandId})`, 'green');
    });
    testsPassed++;
  } else {
    log(`\n⚠️  No brandCreated events received`, 'yellow');
    log(`   This is expected if no brands were created during the test`, 'yellow');
  }

  if (events.brandUpdated.length > 0) {
    log(`\n✅ brandUpdated events received:`, 'green');
    events.brandUpdated.forEach((event, index) => {
      log(`   ${index + 1}. ${event.name} (ID: ${event.brandId})`, 'green');
    });
    testsPassed++;
  }

  if (events.brandDeleted.length > 0) {
    log(`\n✅ brandDeleted events received:`, 'green');
    events.brandDeleted.forEach((event, index) => {
      log(`   ${index + 1}. ${event.name} (ID: ${event.brandId})`, 'green');
    });
    testsPassed++;
  }

  // Cleanup
  socket.disconnect();
  log(`\n🔌 Socket disconnected`, 'blue');

  // Final summary
  logSection('📊 TEST SUMMARY');
  log(`\n✅ Tests Passed: ${testsPassed}`, 'green');
  log(`❌ Tests Failed: ${testsFailed}`, 'red');
  
  const totalEvents = events.brandCreated.length + events.brandUpdated.length + events.brandDeleted.length;
  log(`⚡ Total Socket Events: ${totalEvents}`, 'cyan');
  
  if (totalEvents > 0) {
    log(`\n🎉 Real-time brand updates are working!`, 'green');
  } else {
    log(`\n⚠️  No events received during test period`, 'yellow');
    log(`   Try creating/updating/deleting a brand in AdminJS`, 'yellow');
  }
  
  console.log('='.repeat(60) + '\n');
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test script error: ${error.message}`, 'red');
  process.exit(1);
});

