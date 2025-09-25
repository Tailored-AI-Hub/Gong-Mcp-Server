import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";
import { buildPaginationParams, computeAndFormatPagination } from "../utils/helpers.js";

export const LIST_CALLS: Tool = {
  name: "gong_list_calls",
  description: `List all calls. No input required.

Examples:
1) List all the calls from Gong
  
Returns: For each call, key metadata including ID, title, direction, scheduled/start time, duration (seconds), purpose, and language.
  `,

  inputSchema: {
    type: "object",
    properties: {}
  }
}

export const LIST_CALLS_BY_DATE_RANGE: Tool = {
  name: "gong_list_calls_by_date_range",
  description: `List calls within a date/time range.

Examples:
1) List calls from July 1–31, 2022
{
  "fromDateTime": "2022-07-01T00:00:00Z",
  "toDateTime": "2022-07-31T23:59:59Z"
}

Returns: For each call, key metadata including ID, title, direction, scheduled/start time, duration (seconds), purpose, and language.

Notes:
- fromDateTime and toDateTime are required (ISO 8601). Include timezone (e.g., Z or -05:00).
- Large date ranges may return many results; narrow the window for faster responses.
- The underlying API may support additional filters, but this tool currently requires only the date range.`,
  inputSchema: {
    type: "object",
    properties: {
      fromDateTime: {
        type: "string",
        description: "Start date and time in ISO format (e.g., 2022-07-01T02:00:00-05:00)"
      },
      toDateTime: {
        type: "string",
        description: "End date and time in ISO format (e.g., 2022-07-31T02:00:00-05:00)"
      },
    },
    required: ["fromDateTime", "toDateTime"]
  }
};

export const GET_CALL: Tool = {
  name: "gong_get_call",
  description: `Get detailed information about a specific call by ID.

Example:
{
  "callId": "2167868958109749118"
}

Returns: Call metadata such as title, direction, scheduled/start time, duration (seconds), purpose, and language.

Notes:
- Use with an ID from gong_list_calls or known call IDs.
- If the call does not exist or you lack permissions, the API will return an error.`,
  inputSchema: {
    type: "object",
    properties: {
      callId: {
        type: "string",
        description: "The unique identifier of the call"
      }
    },
    required: ["callId"]
  }
};

export interface ListCallsArgs {
  pageNumber?: number;
  pageSize?: number;
  cursor?: string;
}

export interface ListCallsArgsDateRange {
  fromDateTime: string;
  toDateTime: string;
  pageNumber?: number;
  pageSize?: number;
  cursor?: string;
}

export interface GetCallArgs {
  callId: string;
}

// Helper: normalize a raw Gong call object into a consistent shape
function normalizeCall(raw: any): {
  id: string;
  title: string;
  direction: string;
  scheduled: string;
  started: string;
  duration: number;
  purpose: string;
  language: string;
} {
  const id = raw?.id ?? 'N/A';
  const title = raw?.title ?? 'N/A';
  const direction = raw?.direction ?? 'N/A';
  const scheduled = raw?.scheduled ?? 'N/A';
  const started = raw?.started ?? 'N/A';
  const duration = raw?.duration ?? 'N/A';
  const purpose = raw?.purpose ?? 'N/A';
  const language = raw?.language ?? 'N/A';
  return { id, title, direction, scheduled, started, duration, purpose, language };
}

// Helper: format a normalized user into the multi-line list entry
function formatCallListEntry(call: ReturnType<typeof normalizeCall>): string {
  return `Call ID: ${call.id}\n` +
    `Title: ${call.title}\n` +
    `Direction: ${call.direction}\n` +
    `Scheduled Time: ${call.scheduled}\n` +
    `Started Time: ${call.started}\n` +
    `Duration: ${call.duration}\n` +
    `Call Purpose: ${call.purpose}\n` +
    `Language: ${call.language}\n` +
    `---`;
}

// Helper: extract calls and records safely
function extractCallsAndRecords(response: any): { calls: any[]; records: any } {
  if (!response?.calls) {
    throw new Error(`API returned calls in unexpected format: ${typeof response?.calls}`);
  }
  const calls = Array.isArray(response.calls) ? response.calls : [];
  const records = response.records || {};
  return { calls, records };
}


export async function handleListCalls(conn: GongConnection, args: ListCallsArgs): Promise<{ content: string[] }> {
  try {
    const params = buildPaginationParams(args);

    const response = await conn.get<any>('/calls', params);
    
    const { calls, records } = extractCallsAndRecords(response);
    
    const content = calls.map(call => formatCallListEntry(normalizeCall(call)));
    
    const { summary: paginationInfo } = computeAndFormatPagination(
      records,
      typeof args.pageNumber === 'number' ? args.pageNumber : 0,
      typeof args.pageSize === 'number' ? args.pageSize : calls.length,
      calls.length
    );

    return { content: [paginationInfo, ...content] };
  } catch (error) {
    throw new Error(`Failed to list calls: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
    
export async function handleListCallsByDateRange(conn: GongConnection, args: ListCallsArgsDateRange): Promise<{ content: string[] }> {
  try {
    const params = buildPaginationParams(args);
    params.fromDateTime = args.fromDateTime;
    params.toDateTime = args.toDateTime;

    const response = await conn.get<any>('/calls', params);
    
    const { calls, records } = extractCallsAndRecords(response);
    
    const content = calls.map(call => formatCallListEntry(normalizeCall(call)));
    
    const { summary: paginationInfo } = computeAndFormatPagination(
      records,
      typeof args.pageNumber === 'number' ? args.pageNumber : 0,
      typeof args.pageSize === 'number' ? args.pageSize : calls.length,
      calls.length
    );

    return { content: [paginationInfo, ...content] };
  } catch (error) {
    throw new Error(`Failed to list calls: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleGetCall(conn: GongConnection, args: GetCallArgs): Promise<{ content: string[] }> {
  try {
    const response = await conn.get<any>(`/calls/${args.callId}`);
    
    const call = normalizeCall(response);

    return { content: [formatCallListEntry(call)] };
  } catch (error) {
    throw new Error(`Failed to get call: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
