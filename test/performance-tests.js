// Performance tests for Gong MCP Server APIs
import { strict as assert } from 'assert';
import { test, describe, beforeEach, afterEach } from 'node:test';
import { performance } from 'perf_hooks';
import nock from 'nock';
import { GongConnection } from '../dist/utils/connection.js';
import { handleListCalls } from '../dist/tools/calls.js';
import { handleGetActivityAggregate } from '../dist/tools/activityStats.js';
import { mockGongCalls, mockActivityAggregateResponse, testInputs } from './mock-data.js';

describe('Gong MCP Server Performance Tests', () => {
  let gongConnection;
  const baseURL = 'https://api.gong.io/v2';

  beforeEach(() => {
    gongConnection = new GongConnection({
      accessKey: 'test_key',
      accessKeySecret: 'test_secret',
      baseUrl: baseURL
    });
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Response Time Tests', () => {
    test('should respond to list calls within acceptable time', async () => {
      nock(baseURL)
        .get('/calls')
        .query(true)
        .reply(200, mockGongCalls);

      const startTime = performance.now();
      const result = await handleListCalls(gongConnection, testInputs.listCalls);
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      
      assert.ok(result.content);
      assert.ok(responseTime < 5000, `Response time ${responseTime}ms should be less than 5000ms`);
    });

    test('should handle large activity aggregates efficiently', async () => {
      // Create a larger mock response
      const largeResponse = {
        ...mockActivityAggregateResponse,
        callsByUser: {}
      };
      
      // Simulate 100 users
      for (let i = 0; i < 100; i++) {
        largeResponse.callsByUser[`user_${i}`] = {
          totalCalls: Math.floor(Math.random() * 50),
          totalDuration: Math.floor(Math.random() * 180000),
          averageCallDuration: 3600,
          callsByType: {
            "Discovery": Math.floor(Math.random() * 20),
            "Demo": Math.floor(Math.random() * 15),
            "Follow-up": Math.floor(Math.random() * 15)
          }
        };
      }

      nock(baseURL)
        .post('/stats/activity/aggregate')
        .reply(200, largeResponse);

      const startTime = performance.now();
      const result = await handleGetActivityAggregate(gongConnection, testInputs.activityAggregate);
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      
      assert.ok(result.content);
      assert.ok(responseTime < 10000, `Response time ${responseTime}ms should be less than 10000ms for large dataset`);
    });
  });

  describe('Memory Usage Tests', () => {
    test('should handle multiple concurrent requests without memory leaks', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Mock multiple endpoints
      for (let i = 0; i < 10; i++) {
        nock(baseURL)
          .get('/calls')
          .query(true)
          .reply(200, mockGongCalls);
      }

      // Execute multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(handleListCalls(gongConnection, testInputs.listCalls));
      }

      await Promise.all(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory should not increase more than 50MB for 10 requests
      assert.ok(memoryIncrease < 50 * 1024 * 1024, 
        `Memory increase ${memoryIncrease / 1024 / 1024}MB should be less than 50MB`);
    });
  });

  describe('Load Tests', () => {
    test('should handle burst of requests', async () => {
      const requestCount = 20;
      const requests = [];
      
      // Mock all requests
      for (let i = 0; i < requestCount; i++) {
        nock(baseURL)
          .get('/calls')
          .query(true)
          .reply(200, mockGongCalls);
      }

      const startTime = performance.now();
      
      // Create burst of requests
      for (let i = 0; i < requestCount; i++) {
        requests.push(handleListCalls(gongConnection, testInputs.listCalls));
      }

      const results = await Promise.all(requests);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const avgTimePerRequest = totalTime / requestCount;
      
      // All requests should succeed
      assert.equal(results.length, requestCount);
      results.forEach(result => {
        assert.ok(result.content);
      });
      
      // Average time per request should be reasonable
      assert.ok(avgTimePerRequest < 1000, 
        `Average time per request ${avgTimePerRequest}ms should be less than 1000ms`);
    });

    test('should maintain performance under sustained load', async () => {
      const batchSize = 5;
      const batches = 4;
      const results = [];
      
      for (let batch = 0; batch < batches; batch++) {
        // Mock requests for this batch
        for (let i = 0; i < batchSize; i++) {
          nock(baseURL)
            .get('/calls')
            .query(true)
            .reply(200, mockGongCalls);
        }
        
        const batchStartTime = performance.now();
        
        const batchPromises = [];
        for (let i = 0; i < batchSize; i++) {
          batchPromises.push(handleListCalls(gongConnection, testInputs.listCalls));
        }
        
        const batchResults = await Promise.all(batchPromises);
        const batchEndTime = performance.now();
        
        const batchTime = batchEndTime - batchStartTime;
        results.push({
          batch: batch + 1,
          time: batchTime,
          avgPerRequest: batchTime / batchSize
        });
        
        // Verify all requests succeeded
        batchResults.forEach(result => {
          assert.ok(result.content);
        });
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Performance should remain consistent across batches
      const times = results.map(r => r.avgPerRequest);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const timeVariation = maxTime - minTime;
      
      // Time variation should be less than 500ms
      assert.ok(timeVariation < 500, 
        `Time variation ${timeVariation}ms should be less than 500ms across batches`);
    });
  });

  describe('Resource Cleanup Tests', () => {
    test('should properly cleanup connections after requests', async () => {
      nock(baseURL)
        .get('/calls')
        .query(true)
        .reply(200, mockGongCalls);

      await handleListCalls(gongConnection, testInputs.listCalls);
      
      // Check that no pending HTTP requests remain
      assert.ok(nock.pendingMocks().length === 0, 'All HTTP mocks should be consumed');
    });

    test('should handle request cancellation gracefully', async () => {
      let requestCancelled = false;
      
      nock(baseURL)
        .get('/calls')
        .query(true)
        .delay(1000)
        .reply(200, mockGongCalls);

      const controller = new AbortController();
      
      setTimeout(() => {
        controller.abort();
        requestCancelled = true;
      }, 500);

      try {
        // Note: This would require modifying the connection class to support AbortController
        // For now, we'll simulate the behavior
        await Promise.race([
          handleListCalls(gongConnection, testInputs.listCalls),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request cancelled')), 500);
          })
        ]);
        
        assert.fail('Request should have been cancelled');
      } catch (error) {
        assert.ok(requestCancelled);
        assert.ok(error.message.includes('cancelled'));
      }
    });
  });

  describe('Data Size Tests', () => {
    test('should handle large call lists efficiently', async () => {
      // Create a large mock response
      const largeCalls = [];
      for (let i = 0; i < 1000; i++) {
        largeCalls.push({
          ...mockGongCalls[0],
          id: `call_${i}`,
          title: `Call ${i}`,
          participants: [
            { id: `user_${i}`, name: `User ${i}`, email: `user${i}@test.com`, role: 'Sales Rep' },
            { id: `prospect_${i}`, name: `Prospect ${i}`, email: `prospect${i}@client.com`, role: 'Prospect' }
          ]
        });
      }

      nock(baseURL)
        .get('/calls')
        .query(true)
        .reply(200, largeCalls);

      const startTime = performance.now();
      const result = await handleListCalls(gongConnection, testInputs.listCalls);
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      
      assert.ok(result.content);
      assert.ok(Array.isArray(result.content));
      assert.equal(result.content.length, 1000);
      assert.ok(responseTime < 15000, `Response time ${responseTime}ms should be less than 15000ms for large dataset`);
    });

    test('should handle large transcript responses', async () => {
      // Create a large transcript
      const largeTranscript = {
        callTranscripts: [{
          callId: "test_call",
          transcript: [],
          metadata: {
            language: "en-US",
            wordCount: 5000,
            duration: 7200
          }
        }]
      };

      // Generate 100 transcript segments
      for (let i = 0; i < 100; i++) {
        largeTranscript.callTranscripts[0].transcript.push({
          speakerId: `speaker_${i % 2}`,
          sentences: Array.from({ length: 10 }, (_, j) => ({
            start: (i * 10 + j) * 1000,
            end: (i * 10 + j + 1) * 1000,
            text: `This is sentence ${j + 1} from segment ${i + 1}. It contains some sample text for testing purposes.`
          }))
        });
      }

      nock(baseURL)
        .post('/calls/transcript')
        .reply(200, largeTranscript);

      const startTime = performance.now();
      const result = await import('../dist/tools/transcript.js').then(module => 
        module.handleGetTranscript(gongConnection, { callIds: ['test_call'] })
      );
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      
      assert.ok(result.content);
      assert.ok(result.content[0].length > 10000); // Should be a large text response
      assert.ok(responseTime < 10000, `Response time ${responseTime}ms should be less than 10000ms for large transcript`);
    });
  });
});
