#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as dotenv from "dotenv";

import { createGongConnection } from "./utils/connection.js";
import { 
  LIST_CALLS, GET_CALL, LIST_CALLS_BY_DATE_RANGE,
  handleListCalls, handleGetCall, handleListCallsByDateRange,
  ListCallsArgs, GetCallArgs, ListCallsArgsDateRange 
} from "./tools/calls.js";
import { GET_TRANSCRIPT, handleGetTranscript, GetTranscriptArgs } from "./tools/transcript.js";
import { LIST_USERS, GET_USER, handleListUsers, handleGetUser, GetUserArgs } from "./tools/users.js";
import { GET_ACTIVITY_AGGREGATE, handleGetActivityAggregate, GetActivityAggregateArgs } from "./tools/activityStats.js";
import { GET_ACTIVITY_AGGREGATE_BY_PERIOD, handleGetActivityAggregateByPeriod, GetActivityAggregateByPeriodArgs } from "./tools/activityPeriod.js";
import { GET_ACTIVITY_DAY_BY_DAY, handleGetActivityDayByDay, GetActivityDayByDayArgs } from "./tools/dayByDay.js";
import { GET_ACTIVITY_SCORECARDS, handleGetActivityScorecards, GetActivityScorecardsArgs } from "./tools/scorecards.js";
import { GET_INTERACTION_STATS, handleGetInteractionStats, GetInteractionStatsArgs } from "./tools/interaction.js";

dotenv.config();

// IMPORTANT: MCP requires stdout to carry ONLY JSON-RPC.
// Any console.log will corrupt the protocol stream. Route logs to stderr.
// eslint-disable-next-line no-console
console.log = (...args: unknown[]) => {
  // eslint-disable-next-line no-console
  console.error(...args);
};

// Ensure tool responses always use MCP content objects
function normalizeToolResult(result: any): { content: Array<{ type: "text"; text: string }> } {
  const raw = result?.content ?? [];
  const content = Array.isArray(raw)
    ? raw.map((item: any) => (typeof item === 'string' ? { type: 'text', text: item } : item))
    : [];
  return { content };
}

const server = new Server(
  {
    name: "gong-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  },
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
      LIST_CALLS,
      LIST_CALLS_BY_DATE_RANGE,
      GET_CALL,
      GET_TRANSCRIPT,
      LIST_USERS,
      GET_USER,
      GET_ACTIVITY_AGGREGATE,
      GET_ACTIVITY_AGGREGATE_BY_PERIOD,
      GET_ACTIVITY_DAY_BY_DAY,
      GET_ACTIVITY_SCORECARDS,
      GET_INTERACTION_STATS,
    ],
}));

// Prompts capability: expose a single system prompt
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "system",
      description: "Gong API system prompt for call analytics and insights",
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  try {
    const { name, arguments: args } = request.params;
    const argsOrEmpty = (args as Record<string, any>) || {};
    const requiresGongConn = String(name).startsWith("gong_");
    const conn = requiresGongConn ? await createGongConnection() : undefined;

    switch (name) {
      case "gong_list_calls": {
        const validated: ListCallsArgs = {};
        return normalizeToolResult(await handleListCalls(conn!, validated));
      }

      case "gong_list_call_date_range": {
        const validated: ListCallsArgsDateRange = {
          fromDateTime: argsOrEmpty.fromDateTime as string,
          toDateTime: argsOrEmpty.toDateTime as string,
        };
        if (!validated.fromDateTime || !validated.toDateTime) {
          throw new Error('fromDateTime and toDateTime are required');
        }
        return normalizeToolResult(await handleListCallsByDateRange(conn!, validated));
      }

      case "gong_get_call": {
        const validated: GetCallArgs = {
          callId: argsOrEmpty.callId as string,
        };
        if (!validated.callId) {
          throw new Error('callId is required');
        }
        return normalizeToolResult(await handleGetCall(conn!, validated));
      }

      case "gong_get_transcript": {
        // Extract callIds from the nested filter structure
        const callIds = argsOrEmpty.filter?.callIds || argsOrEmpty.callIds;
        const validated: GetTranscriptArgs = {
          callIds: callIds as string[],
        };
        if (!validated.callIds || !Array.isArray(validated.callIds)) {
          throw new Error('callIds array is required');
        }
        return normalizeToolResult(await handleGetTranscript(conn!, validated));
      }

      case "gong_list_users": {
        return normalizeToolResult(await handleListUsers(conn!));
      }

      case "gong_get_user": {
        const validated: GetUserArgs = {
          userId: argsOrEmpty.userId as string,
        };
        if (!validated.userId) {
          throw new Error('userId is required');
        }
        return normalizeToolResult(await handleGetUser(conn!, validated));
      }

      case "gong_get_activity_aggregate": {
        const validated: GetActivityAggregateArgs = {
          filter: {
            fromDate: argsOrEmpty.filter?.fromDate as string,
            toDate: argsOrEmpty.filter?.toDate as string,
            __userIds: argsOrEmpty.filter?.userIds as string[] | undefined,
          }
        };
        if (!validated.filter.fromDate || !validated.filter.toDate) {
          throw new Error('fromDate and toDate are required');
        }
        return normalizeToolResult(await handleGetActivityAggregate(conn!, validated));
      }

      case "gong_get_activity_aggregate_by_period": {
        const validated: GetActivityAggregateByPeriodArgs = {
          aggregationPeriod: argsOrEmpty.aggregationPeriod as 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR',
          filter: {
            fromDate: argsOrEmpty.filter?.fromDate as string,
            toDate: argsOrEmpty.filter?.toDate as string,
            __userIds: argsOrEmpty.filter?.userIds as string[] | undefined,
          }
        };
        if (!validated.aggregationPeriod || !validated.filter.fromDate || !validated.filter.toDate) {
          throw new Error('aggregationPeriod, fromDate, and toDate are required');
        }
        return normalizeToolResult(await handleGetActivityAggregateByPeriod(conn!, validated));
      }

      case "gong_get_activity_day_by_day": {
        const validated: GetActivityDayByDayArgs = {
          aggregationPeriod: argsOrEmpty.aggregationPeriod as 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR',
          filter: {
            fromDate: argsOrEmpty.filter?.fromDate as string,
            toDate: argsOrEmpty.filter?.toDate as string,
            __userIds: argsOrEmpty.filter?.userIds as string[] | undefined,
          }
        };
        if (!validated.aggregationPeriod || !validated.filter.fromDate || !validated.filter.toDate) {
          throw new Error('aggregationPeriod, fromDate, and toDate are required');
        }
        return normalizeToolResult(await handleGetActivityDayByDay(conn!, validated));
      }

      case "gong_get_activity_scorecards": {
        const validated: GetActivityScorecardsArgs = {
          aggregationPeriod: argsOrEmpty.aggregationPeriod as 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR',
          filter: {
            fromDate: argsOrEmpty.filter?.fromDate as string,
            toDate: argsOrEmpty.filter?.toDate as string,
            __userIds: argsOrEmpty.filter?.userIds as string[] | undefined,
          }
        };
        if (!validated.aggregationPeriod || !validated.filter.fromDate || !validated.filter.toDate) {
          throw new Error('aggregationPeriod, fromDate, and toDate are required');
        }
        return normalizeToolResult(await handleGetActivityScorecards(conn!, validated));
      }

      case "gong_get_interaction_stats": {
        const validated: GetInteractionStatsArgs = {
          filter: {
            fromDate: argsOrEmpty.filter?.fromDate as string,
            toDate: argsOrEmpty.filter?.toDate as string,
            __userIds: argsOrEmpty.filter?.userIds as string[] | undefined,
          }
        };
        if (!validated.filter.fromDate || !validated.filter.toDate) {
          throw new Error('fromDate and toDate are required');
        }
        return normalizeToolResult(await handleGetInteractionStats(conn!, validated));
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
    };
  }
});

server.setRequestHandler(GetPromptRequestSchema, async (request: any) => {
  const { name } = request.params;
  if (name === "system") {
    return {
      content: [
        {
          type: "text",
          text: `You are a Gong API assistant that helps users analyze call data, user activity, and generate insights from sales conversations. You can:

            1. List and retrieve call information
            2. Get call transcripts for analysis
            3. List and retrieve user information
            4. Generate activity statistics and analytics
            5. Create scorecards and performance metrics
            6. Analyze interaction patterns

            Use the available tools to help users understand their performance, call quality, and team productivity.`,
        },
      ],
    };
  }
  throw new Error(`Unknown prompt: ${name}`);
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gong MCP Server started");
}

runServer().catch(console.error);
