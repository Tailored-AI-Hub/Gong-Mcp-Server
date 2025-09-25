import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";
import { GongCall } from "../types/gong.js";


export const LIST_CALLS: Tool = {
  name: "gong_list_calls",
  description: `List all calls. No input required.
  
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

export interface ListCallsArgs {}

export interface ListCallsArgsDateRange {
  fromDateTime: string;
  toDateTime: string;
}

export interface GetCallArgs {
  callId: string;
}

export async function handleListCalls(conn: GongConnection, args: ListCallsArgs): Promise<{ content: string[] }> {
  try {
    const response = await conn.get<any>('/calls');
    
    // Handle different possible API response structures
    let calls: any[] = [];
    
    if (Array.isArray(response)) {
      // Direct array response
      calls = response;
    } else if (response && response.calls && Array.isArray(response.calls)) {
      // Nested calls property
      calls = response.calls;
    } else if (response && response.data && Array.isArray(response.data)) {
      // Nested data property
      calls = response.data;
    } else if (response && response.results && Array.isArray(response.results)) {
      // Nested results property
      calls = response.results;
    } else {
      // Log the actual response structure for debugging
      console.log('Unexpected API response structure:', typeof response, Object.keys(response || {}));
      throw new Error('Unexpected API response structure - calls not found in expected format');
    }
    
    if (!Array.isArray(calls)) {
      throw new Error(`API returned calls in unexpected format: ${typeof calls}`);
    }
    
    const content = calls.map(call => {
      // Handle different call object structures
      const callData = call.call || call;
      const callId = callData.id || callData.callId || 'Unknown';
      const title = callData.title || callData.name || 'N/A';
      const direction = callData.direction || 'N/A';
      const scheduled = callData.scheduled || callData.scheduledTime || 'N/A';
      const started = callData.started || callData.startTime || 'N/A';
      const duration = callData.duration || 'N/A';
      const purpose = callData.purpose || callData.callPurpose || 'N/A';
      const language = callData.language || 'N/A';
      
      return `Call Details:\n` +
        `ID: ${callId}\n` +
        `Title: ${title}\n` +
        `Direction: ${direction}\n` +
        `Scheduled Time: ${scheduled}\n` +
        `Start Time: ${started}\n` +
        `Duration: ${duration !== 'N/A' ? `${duration} seconds` : 'N/A'}\n` +
        `Call Purpose: ${purpose}\n` +
        `Language: ${language}\n` +
        `---`;
    });

    return { content };
  } catch (error) {
    throw new Error(`Failed to list calls: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleListCallsByDateRange(conn: GongConnection, args: ListCallsArgsDateRange): Promise<{ content: string[] }> {
  try {
    const params: Record<string, any> = {
      fromDateTime: args.fromDateTime,
      toDateTime: args.toDateTime
    };

    const response = await conn.get<any>('/calls', params);
    
    // Handle different possible API response structures
    let calls: any[] = [];
    
    if (Array.isArray(response)) {
      // Direct array response
      calls = response;
    } else if (response && response.calls && Array.isArray(response.calls)) {
      // Nested calls property
      calls = response.calls;
    } else if (response && response.data && Array.isArray(response.data)) {
      // Nested data property
      calls = response.data;
    } else if (response && response.results && Array.isArray(response.results)) {
      // Nested results property
      calls = response.results;
    } else {
      // Log the actual response structure for debugging
      console.log('Unexpected API response structure:', typeof response, Object.keys(response || {}));
      throw new Error('Unexpected API response structure - calls not found in expected format');
    }
    
    if (!Array.isArray(calls)) {
      throw new Error(`API returned calls in unexpected format: ${typeof calls}`);
    }
    
    const content = calls.map(call => {
      // Handle different call object structures
      const callData = call.call || call;
      const callId = callData.id || callData.callId || 'Unknown';
      const title = callData.title || callData.name || 'N/A';
      const direction = callData.direction || 'N/A';
      const scheduled = callData.scheduled || callData.scheduledTime || 'N/A';
      const started = callData.started || callData.startTime || 'N/A';
      const duration = callData.duration || 'N/A';
      const purpose = callData.purpose || callData.callPurpose || 'N/A';
      const language = callData.language || 'N/A';
      
      return `Call Details:\n` +
        `ID: ${callId}\n` +
        `Title: ${title}\n` +
        `Direction: ${direction}\n` +
        `Scheduled Time: ${scheduled}\n` +
        `Start Time: ${started}\n` +
        `Duration: ${duration !== 'N/A' ? `${duration} seconds` : 'N/A'}\n` +
        `Call Purpose: ${purpose}\n` +
        `Language: ${language}\n` +
        `---`;
    });

    return { content };
  } catch (error) {
    throw new Error(`Failed to list calls: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleGetCall(conn: GongConnection, args: GetCallArgs): Promise<{ content: string[] }> {
  try {
    const response = await conn.get<any>(`/calls/${args.callId}`);
    
    // Handle different possible call object structures
    const callData = response.call || response;
    const callId = callData.id || callData.callId || args.callId;
    const title = callData.title || callData.name || 'N/A';
    const direction = callData.direction || 'N/A';
    const scheduled = callData.scheduled || callData.scheduledTime || 'N/A';
    const started = callData.started || callData.startTime || 'N/A';
    const duration = callData.duration || 'N/A';
    const purpose = callData.purpose || callData.callPurpose || 'N/A';
    const language = callData.language || 'N/A';
    
    const content = [
      `Call Details:\n` +
      `ID: ${callId}\n` +
      `Title: ${title}\n` +
      `Direction: ${direction}\n` +
      `Scheduled Time: ${scheduled}\n` +
      `Start Time: ${started}\n` +
      `Duration: ${duration !== 'N/A' ? `${duration} seconds` : 'N/A'}\n` +
      `Call Purpose: ${purpose}\n` +
      `Language: ${language}`
    ];

    return { content };
  } catch (error) {
    throw new Error(`Failed to get call: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
