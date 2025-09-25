import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";
import { GongActivityAggregateFilter, GongActivityAggregateResponse } from "../types/gong.js";

export const GET_ACTIVITY_AGGREGATE: Tool = {
  name: "gong_get_activity_aggregate",
  description: `Get aggregate activity statistics for users within a date range.

Example:
{
  "filter": {
    "fromDate": "2025-01-01",
    "toDate": "2025-07-13",
    "__userIds": ["1234567890"]
  }
}

Returns: Totals and breakdowns (by type, direction, and per-user) including total calls, total duration, and average call duration.

Notes:
- Dates must be YYYY-MM-DD.
- Provide __userIds to scope stats; omit to aggregate across all accessible users.
- For large orgs and ranges, consider narrowing the date window for speed.`,
  inputSchema: {
    type: "object",
    properties: {
      filter: {
        type: "object",
        properties: {
          fromDate: {
            type: "string",
            description: "Start date in YYYY-MM-DD format (e.g., 2022-01-01)"
          },
          toDate: {
            type: "string",
            description: "End date in YYYY-MM-DD format (e.g., 2025-07-13)"
          },
          __userIds: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Array of user IDs to filter by (optional)"
          },
        },
        required: ["fromDate", "toDate"]
      }
    },
    required: ["filter"]
  }
};

export interface GetActivityAggregateArgs {
  filter: {
    fromDate: string;
    toDate: string;
    __userIds?: string[];
  }
}

export async function handleGetActivityAggregate(conn: GongConnection, args: GetActivityAggregateArgs): Promise<{ content: string[] }> {
  try {
    // Validate required parameters
    if (!args.filter || !args.filter.fromDate || !args.filter.toDate) {
      throw new Error('fromDate and toDate are required');
    }

    const requestBody: GongActivityAggregateFilter = {
      filter: args.filter
    };

    if (args.filter.__userIds && args.filter.__userIds.length > 0) {
      requestBody.filter.__userIds = args.filter.__userIds;
    }

    const stats = await conn.post<any>('/stats/activity/aggregate', requestBody);
    
    // Build the content string step by step to avoid template literal issues
    let contentStr = `Activity Statistics (${args.filter.fromDate} to ${args.filter.toDate}):\n`;
    contentStr += `Total Calls: ${stats.totalCalls || 0}\n`;
    contentStr += `Total Duration: ${formatDuration(stats.totalDuration || 0)}\n`;
    contentStr += `Average Call Duration: ${formatDuration(stats.averageCallDuration || 0)}\n`;
    
    contentStr += `\nCalls by Type:\n`;
    const callsByTypeStr = Object.entries(stats.callsByType || {})
      .map(([type, count]: [string, any]) => `- ${type}: ${count}`)
      .join('\n');
    contentStr += callsByTypeStr;
    
    contentStr += `\nCalls by Direction:\n`;
    const callsByDirectionStr = Object.entries(stats.callsByDirection || {})
      .map(([direction, count]: [string, any]) => `- ${direction}: ${count}`)
      .join('\n');
    contentStr += callsByDirectionStr;
    
    contentStr += `\nCalls by User:\n`;
    const callsByUserStr = Object.entries(stats.callsByUser || {})
      .map(([userId, userStats]: [string, any]) => 
        `- User ${userId}:\n` +
        `  Total Calls: ${userStats.totalCalls || 0}\n` +
        `  Total Duration: ${formatDuration(userStats.totalDuration || 0)}\n` +
        `  Average Duration: ${formatDuration(userStats.averageCallDuration || 0)}`
      )
      .join('\n');
    contentStr += callsByUserStr;

    return { content: [contentStr] };
  } catch (error) {
    throw new Error(`Failed to get activity aggregate: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}
