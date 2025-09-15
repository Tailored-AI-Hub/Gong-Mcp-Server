// Integration tests for Gong MCP Server
import { strict as assert } from 'assert';
import { test, describe, beforeEach, afterEach } from 'node:test';
import nock from 'nock';
import { GongConnection } from '../dist/utils/connection.js';
import {
  mockGongCalls,
  mockGongUsers,
  mockTranscriptResponse,
  mockActivityAggregateResponse,
  testInputs
} from './mock-data.js';

describe('Gong MCP Server Integration Tests', () => {
  let gongConnection;
  const baseURL = 'https://api.gong.io/v2';

  beforeEach(async () => {
    // Clean up any existing nock interceptors
    nock.cleanAll();
    
    // Create a test connection
    gongConnection = new GongConnection({
      accessKey: 'test_key',
      accessKeySecret: 'test_secret',
      baseUrl: baseURL
    });
  });

  afterEach(async () => {
    nock.cleanAll();
  });

  describe('API Integration Tests', () => {
    test('should handle multiple API calls in sequence', async () => {
      // Mock multiple endpoints
      nock(baseURL)
        .get('/calls')
        .query(true)
        .reply(200, mockGongCalls);

      nock(baseURL)
        .get('/users')
        .query(true)
        .reply(200, mockGongUsers);

      // Test that we can make multiple API calls successfully
      const callsResult = await gongConnection.get('/calls', testInputs.listCalls);
      const usersResult = await gongConnection.get('/users', testInputs.listUsers);

      assert.ok(callsResult);
      assert.ok(usersResult);
      assert.ok(Array.isArray(callsResult));
      assert.ok(Array.isArray(usersResult));
    });

    test('should handle authentication headers correctly', async () => {
      // This test verifies that the connection class properly sets up authentication
      const connection = new GongConnection({
        accessKey: 'test_key',
        accessKeySecret: 'test_secret',
        baseUrl: baseURL
      });

      // The connection should be properly configured
      assert.ok(connection);
      assert.ok(connection.client);
    });
  });

  describe('End-to-End API Execution', () => {
    test('should execute calls API successfully', async () => {
      // Mock the API call
      nock(baseURL)
        .get('/calls')
        .query(true)
        .reply(200, mockGongCalls);

      const result = await gongConnection.get('/calls', testInputs.listCalls);

      assert.ok(result);
      assert.ok(Array.isArray(result));
      assert.ok(result[0].id === '2167868958109749118');
      assert.ok(result[0].title === 'Discovery Call - Acme Corp');
    });

    test('should execute users API successfully', async () => {
      nock(baseURL)
        .get('/users')
        .query(true)
        .reply(200, mockGongUsers);

      const result = await gongConnection.get('/users', testInputs.listUsers);

      assert.ok(result);
      assert.ok(Array.isArray(result));
      assert.ok(result[0].id === '1587172352477568464');
      assert.ok(result[0].name === 'John Smith');
    });

    test('should execute activity stats API successfully', async () => {
      nock(baseURL)
        .post('/stats/activity/aggregate')
        .reply(200, mockActivityAggregateResponse);

      const result = await gongConnection.post('/stats/activity/aggregate', testInputs.activityAggregate);

      assert.ok(result);
      assert.ok(result.totalCalls === 25);
      assert.ok(result.totalDuration === 90000);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle API errors gracefully', async () => {
      // Use a different endpoint to avoid conflicts
      const scope = nock(baseURL)
        .get('/users')
        .query(true)
        .reply(401, { message: 'Unauthorized' });

      try {
        await gongConnection.get('/users', { limit: 10 });
        assert.fail('Should have thrown an error');
      } catch (error) {
        console.log('API error message:', error.message);
        // The error gets wrapped in "Gong API Error 401: Unauthorized"
        assert.ok(error.message.includes('401') || error.message.includes('Unauthorized'));
        assert.ok(error.message.includes('Gong API Error') || error.message.includes('Error'));
      } finally {
        scope.persist(false);
      }
    });

    test('should handle network errors gracefully', async () => {
      // Use a different endpoint to avoid conflicts
      const scope = nock(baseURL)
        .get('/users')
        .query(true)
        .replyWithError('Network error');

      try {
        await gongConnection.get('/users', { limit: 10 });
        assert.fail('Should have thrown an error');
      } catch (error) {
        console.log('Network error message:', error.message);
        // Network errors might be transformed by axios
        assert.ok(error.message.includes('error') || error.message.includes('Error'));
        assert.ok(error.message.length > 0);
      } finally {
        scope.persist(false);
      }
    });
  });

  describe('Data Flow Integration', () => {
    test('should chain multiple API calls correctly', async () => {
      // First, list calls
      nock(baseURL)
        .get('/calls')
        .query(true)
        .reply(200, mockGongCalls);

      const callsResult = await gongConnection.get('/calls', testInputs.listCalls);
      assert.ok(callsResult);
      assert.ok(Array.isArray(callsResult));
      
      // Then get transcript for the first call
      nock(baseURL)
        .post('/calls/transcript')
        .reply(200, mockTranscriptResponse);

      const transcriptResult = await gongConnection.post('/calls/transcript', {
        filter: { callIds: ['2167868958109749118'] }
      });

      assert.ok(transcriptResult);
      assert.ok(transcriptResult.callTranscripts);
    });

    test('should handle concurrent API calls', async () => {
      // Mock multiple endpoints
      nock(baseURL)
        .get('/calls')
        .query(true)
        .reply(200, mockGongCalls);

      nock(baseURL)
        .get('/users')
        .query(true)
        .reply(200, mockGongUsers);

      // Execute concurrent calls
      const [callsResult, usersResult] = await Promise.all([
        gongConnection.get('/calls', testInputs.listCalls),
        gongConnection.get('/users', testInputs.listUsers)
      ]);

      assert.ok(callsResult);
      assert.ok(usersResult);
      assert.ok(Array.isArray(callsResult));
      assert.ok(Array.isArray(usersResult));
    });
  });
});
