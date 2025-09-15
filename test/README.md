# Gong MCP Server Tests

This directory contains comprehensive tests for the Gong MCP Server, including unit tests, integration tests, and performance tests with realistic sample data.

## 🧪 Test Structure

```
test/
├── unit-tests.js         # Unit tests for individual API endpoints
├── integration-tests.js  # End-to-end MCP server tests
├── performance-tests.js  # Performance and load tests
├── mock-data.js         # Mock data and test inputs
└── README.md           # This file
```

## 🚀 Quick Start

```bash
# Install dependencies and build
npm install && npm run build

# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration  
npm run test:performance
```

## 📊 Test Coverage

### API Endpoints Tested
- ✅ `gong_list_calls` - List calls with date filtering
- ✅ `gong_get_call` - Get specific call details
- ✅ `gong_get_transcript` - Retrieve call transcripts
- ✅ `gong_list_users` - List organization users
- ✅ `gong_get_user` - Get user details
- ✅ `gong_get_activity_aggregate` - Activity statistics
- ✅ `gong_get_activity_aggregate_by_period` - Period-based stats
- ✅ `gong_get_activity_day_by_day` - Daily breakdowns
- ✅ `gong_get_activity_scorecards` - Performance scorecards
- ✅ `gong_get_interaction_stats` - Interaction analysis

### Sample Test Data
- **Realistic call data** with participants, timestamps, metadata
- **User profiles** with roles, departments, active/inactive status  
- **Transcript data** with speaker identification and timing
- **Activity metrics** with aggregations and breakdowns
- **Performance scorecards** with insights and recommendations

## 📋 Sample API Inputs

All tests use realistic sample data. Here are key examples:

### List Calls
```javascript
{
  fromDateTime: "2022-07-01T02:00:00-05:00",
  toDateTime: "2022-07-31T02:00:00-05:00", 
  limit: 10
}
```

### Get Transcript
```javascript
{
  callIds: ["379333695432645797", "2167868958109749118"]
}
```

### Activity Statistics
```javascript
{
  fromDate: "2022-01-01",
  toDate: "2025-07-13",
  userIds: ["1587172352477568464"],
  callTypes: ["Discovery", "Demo"],
  directions: ["Outbound"]
}
```

## 🔧 Custom Test Runner

Use the enhanced test runner for advanced scenarios:

```bash
# Run all tests with detailed output
node test/test-runner.js

# Test specific scenarios
node test/test-runner.js --scenario basic
node test/test-runner.js --scenario errors
node test/test-runner.js --scenario performance

# Show available options
node test/test-runner.js --help
```

## ⚡ Performance Testing

The performance tests verify:
- Response times under 5 seconds
- Memory usage stability under load
- Concurrent request handling (20+ requests)
- Large dataset processing (1000+ records)
- Resource cleanup and leak prevention

## 🛠️ Environment Setup

Tests use mocked HTTP responses, so no real Gong API credentials needed:

```bash
export GONG_ACCESS_KEY="test_key"
export GONG_ACCESS_SECRET="test_secret"
```

## 📈 Expected Results

- **Unit Tests**: All API handlers work with mock data
- **Integration Tests**: Full MCP protocol workflow
- **Performance Tests**: Response times and memory usage within limits
- **Error Handling**: Graceful handling of all error conditions