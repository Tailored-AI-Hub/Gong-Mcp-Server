// Unit tests for Gong MCP Server APIs
import { strict as assert } from 'assert';
import { test, describe, beforeEach, afterEach } from 'node:test';
import nock from 'nock';
import { GongConnection } from '../dist/utils/connection.js';
import { 
  handleListCalls, 
  handleGetCall 
} from '../dist/tools/calls.js';
import { 
  handleGetTranscript 
} from '../dist/tools/transcript.js';
import { 
  handleListUsers, 
  handleGetUser 
} from '../dist/tools/users.js';
import { 
  handleGetActivityAggregate 
} from '../dist/tools/activityStats.js';
import { 
  handleGetActivityAggregateByPeriod 
} from '../dist/tools/activityPeriod.js';
import { 
  handleGetActivityDayByDay 
} from '../dist/tools/dayByDay.js';
import { 
  handleGetActivityScorecards 
} from '../dist/tools/scorecards.js';
import { 
  handleGetInteractionStats 
} from '../dist/tools/interaction.js';
import {
  mockGongCalls,
  mockGongUsers,
  mockTranscriptResponse,
  mockActivityAggregateResponse,
  mockActivityPeriodResponse,
  mockDayByDayResponse,
  mockScorecardsResponse,
  mockInteractionResponse,
  testInputs
} from './mock-data.js';

describe('Gong MCP Server Unit Tests', () => {
  let gongConnection;
  const baseURL = 'https://api.gong.io/v2';

  beforeEach(() => {
    // Create a test connection
    gongConnection = new GongConnection({
      accessKey: 'test_key',
      accessKeySecret: 'test_secret',
      baseUrl: baseURL
    });

    // Clean up any existing nock interceptors
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Calls API', () => {
    test('should list calls successfully', async () => {
      // Mock the Gong API response in new shape
      nock(baseURL)
        .get('/calls')
        .query(true)
        .reply(200, {
          calls: mockGongCalls,
          records: { totalRecords: mockGongCalls.length, currentPageSize: mockGongCalls.length, currentPageNumber: 0 }
        });

      const result = await handleListCalls(gongConnection, testInputs.listCalls);

      assert.ok(Array.isArray(result.content));
      assert.ok(result.content.length > 0);
      const details = result.content.find((c) => c.includes('Call ID:')) || '';
      assert.ok(details.includes('Call ID: 2167868958109749118'));
      assert.ok(details.includes('Discovery Call - Acme Corp'));
    });

    test('should get specific call successfully', async () => {
      nock(baseURL)
        .get(`/calls/${testInputs.getCall.callId}`)
        .reply(200, { call: mockGongCalls[0] });

      const result = await handleGetCall(gongConnection, testInputs.getCall);

      assert.ok(Array.isArray(result.content));
      assert.ok(result.content[0].includes('Call ID: 2167868958109749118'));
      assert.ok(result.content[0].includes('Discovery Call - Acme Corp'));
    });

    test('should handle call not found error', async () => {
      nock(baseURL)
        .get('/calls/nonexistent')
        .reply(404, { message: 'Call not found' });

      try {
        await handleGetCall(gongConnection, { callId: 'nonexistent' });
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message.includes('404'));
      }
    });
  });

  describe('Transcript API', () => {
    test('should get transcript successfully', async () => {
      nock(baseURL)
        .post('/calls/transcript', {
          filter: {
            callIds: testInputs.getTranscript.callIds
          }
        })
        .reply(200, { ...mockTranscriptResponse, records: { totalRecords: 1, currentPageSize: 1, currentPageNumber: 0 } });

      const result = await handleGetTranscript(gongConnection, testInputs.getTranscript);

      assert.ok(Array.isArray(result.content));
      const body = result.content.find((c) => c.includes('Transcript for Call ID:')) || '';
      assert.ok(body.includes('Transcript for Call ID: 379333695432645797'));
      assert.ok(body.includes('Hello David, thank you for joining our demo today'));
      assert.ok(body.includes('Speaker ID:'));
    });

    test('should handle empty transcript response', async () => {
      nock(baseURL)
        .post('/calls/transcript')
        .reply(200, { callTranscripts: [] });

      try {
        await handleGetTranscript(gongConnection, { callIds: ['invalid'] });
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message.includes('No transcripts found'));
      }
    });
  });

  describe('Users API', () => {
    test('should list users successfully', async () => {
      nock(baseURL)
        .get('/users')
        .query(true)
        .reply(200, { users: mockGongUsers, records: { totalRecords: mockGongUsers.length, currentPageSize: mockGongUsers.length, currentPageNumber: 0 } });

      const result = await handleListUsers(gongConnection, testInputs.listUsers);

      assert.ok(Array.isArray(result.content));
      assert.ok(result.content.length > 0);
      const item = result.content.find((c) => c.includes('User ID:')) || '';
      assert.ok(item.includes('User ID: 1587172352477568464'));
    });

    test('should include inactive users when requested', async () => {
      nock(baseURL)
        .get('/users')
        .query(true)
        .reply(200, { users: mockGongUsers, records: { totalRecords: mockGongUsers.length, currentPageSize: mockGongUsers.length, currentPageNumber: 0 } });

      const result = await handleListUsers(gongConnection, { includeInactive: true });

      assert.ok(Array.isArray(result.content));
      assert.ok(result.content.some(content => content.includes('User ID:')));
    });

    test('should get specific user successfully', async () => {
      nock(baseURL)
        .get(`/users/${testInputs.getUser.userId}`)
        .reply(200, { user: { id: mockGongUsers[0].id, firstName: 'John', lastName: 'Smith', emailAddress: 'john.smith@company.com', title: 'Senior Sales Representative' } });

      const result = await handleGetUser(gongConnection, testInputs.getUser);

      assert.ok(Array.isArray(result.content));
      assert.ok(result.content[0].includes('User Details:'));
      assert.ok(result.content[0].includes('ID: 1587172352477568464'));
      assert.ok(result.content[0].includes('Senior Sales Representative'));
    });
  });

  describe('Activity Stats API', () => {
    test('should get activity aggregate successfully', async () => {
      nock(baseURL)
        .post('/stats/activity/aggregate')
        .reply(200, { requestId: 'req1', usersAggregateActivityStats: [ { userId: 'u1', userEmailAddress: 'u1@example.com', userAggregateActivityStats: { callsAsHost: 5, callsGaveFeedback: 1, callsRequestedFeedback: 0, callsReceivedFeedback: 2, ownCallsListenedTo: 3, othersCallsListenedTo: 1, callsSharedInternally: 0, callsSharedExternally: 0, callsScorecardsFilled: 0, callsScorecardsReceived: 0, callsAttended: 4, callsCommentsGiven: 0, callsCommentsReceived: 0, callsMarkedAsFeedbackGiven: 0, callsMarkedAsFeedbackReceived: 0 } } ], records: { totalRecords: 1, currentPageSize: 1, currentPageNumber: 0 } });

      const result = await handleGetActivityAggregate(gongConnection, testInputs.activityAggregate);

      assert.ok(Array.isArray(result.content));
      assert.ok(result.content.some(c => c.includes('Activity Statistics')));
    });

    test('should get activity by period successfully', async () => {
      nock(baseURL)
        .post('/stats/activity/aggregate-by-period')
        .reply(200, mockActivityPeriodResponse);

      const result = await handleGetActivityAggregateByPeriod(gongConnection, testInputs.activityPeriod);

      assert.ok(Array.isArray(result.content));
      assert.ok(result.content[0].includes('Activity Statistics by MONTH'));
      assert.ok(result.content[0].includes('2022-01'));
      assert.ok(result.content[0].includes('Total Periods: 3'));
    });

    test('should get day by day activity successfully', async () => {
      nock(baseURL)
        .post('/stats/activity/day-by-day')
        .reply(200, mockDayByDayResponse);

      const result = await handleGetActivityDayByDay(gongConnection, testInputs.dayByDay);

      assert.ok(Array.isArray(result.content));
      assert.ok(result.content[0].includes('Daily Activity Statistics'));
      assert.ok(result.content[0].includes('2022-01-01'));
      assert.ok(result.content[0].includes('Total Days: 2'));
    });

    test('should get scorecards successfully', async () => {
      nock(baseURL)
        .post('/stats/activity/scorecards')
        .reply(200, { records: { totalRecords: 1, currentPageSize: 1, currentPageNumber: 0 }, answeredScorecards: [ { answeredScorecardId: 'a1', scorecardId: 's1', scorecardName: 'Q1 Review', callId: 'c1', callStartTime: '2022-01-01', reviewedUserId: 'u1', reviewerUserId: 'u2', reviewMethod: 'MANUAL', reviewTime: '2022-01-02', visibilityType: 'PRIVATE', answers: [ { questionId: 'q1', questionRevisionId: 'qr1', answerText: 'Great', score: 85, isOverall: true } ] } ] });

      const result = await handleGetActivityScorecards(gongConnection, testInputs.scorecards);

      assert.ok(Array.isArray(result.content));
      assert.ok(result.content.join('\n').includes('Scorecard:'));
    });

    test('should get interaction stats successfully', async () => {
      nock(baseURL)
        .post('/stats/interaction')
        .reply(200, { records: { totalRecords: 1, currentPageSize: 1, currentPageNumber: 0 }, peopleInteractionStats: [ { userId: 'u1', userEmailAddress: 'u1@example.com', personInteractionStats: [ { name: 'Question', value: 10 } ] } ] });

      const result = await handleGetInteractionStats(gongConnection, testInputs.interactionStats);

      assert.ok(Array.isArray(result.content));
      assert.ok(result.content.join('\n').includes('Question'));
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      nock(baseURL)
        .get('/calls')
        .replyWithError('Network error');

      try {
        await handleListCalls(gongConnection, testInputs.listCalls);
        assert.fail('Should have thrown an error');
      } catch (error) {
        console.log('Network error message:', error.message);
        // The error gets wrapped in "Failed to list calls: [original error]"
        assert.ok(error.message.includes('Failed to list calls'));
        // Just check that we got some kind of error
        assert.ok(error.message.length > 0);
      }
    });

    test('should handle API rate limiting', async () => {
      nock(baseURL)
        .get('/users')
        .reply(429, { message: 'Rate limit exceeded' });

      try {
        await handleListUsers(gongConnection, testInputs.listUsers);
        assert.fail('Should have thrown an error');
      } catch (error) {
        console.log('Rate limit error message:', error.message);
        // The error gets wrapped in "Failed to list users: [original error]"
        assert.ok(error.message.includes('Failed to list users'));
        // Just check that we got some kind of error
        assert.ok(error.message.length > 0);
      }
    });

    test('should handle authentication errors', async () => {
      nock(baseURL)
        .get('/calls')
        .reply(401, { message: 'Unauthorized' });

      try {
        await handleListCalls(gongConnection, testInputs.listCalls);
        assert.fail('Should have thrown an error');
      } catch (error) {
        console.log('Auth error message:', error.message);
        // The error gets wrapped in "Failed to list calls: [original error]"
        assert.ok(error.message.includes('Failed to list calls'));
        // Just check that we got some kind of error
        assert.ok(error.message.length > 0);
      }
    });
  });

  describe('Input Validation', () => {
    test('should handle null parameters gracefully', async () => {
      // The current implementation doesn't validate at handler level
      // It will pass null values to the API call, which will likely fail
      try {
        await handleListCalls(gongConnection, { fromDateTime: null, toDateTime: null });
        // This should fail at the API level, not at validation level
        assert.fail('Should have failed at API level');
      } catch (error) {
        // Should fail with an API error, not a validation error
        assert.ok(error.message.includes('Failed to list calls'));
      }
    });

    test('should handle missing callIds in transcript request', async () => {
      try {
        await handleGetTranscript(gongConnection, { callIds: null });
        // This should fail at the API level, not at validation level
        assert.fail('Should have failed at API level');
      } catch (error) {
        // Should fail with an API error, not a validation error
        assert.ok(error.message.includes('Failed to get transcript'));
      }
    });
  });
});
