import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";
import { GongDayByDayFilter, GongDayByDayResponse } from "../types/gong.js";

export const GET_ACTIVITY_DAY_BY_DAY: Tool = {
  name: "gong_get_activity_day_by_day",
  description: `Get daily activity statistics with detailed per-day breakdown.

Example:
{
  "aggregationPeriod": "DAY",
  "filter": {
    "fromDate": "2022-01-01",
    "toDate": "2022-01-31",
    "__userIds": ["1587172352477568464"]
  }
}

Returns: Daily rows with total calls, total duration, average call duration, and calls by type. In some orgs, returns per-user dailyStats.

Notes:
- Dates must be YYYY-MM-DD.
- aggregationPeriod should typically be DAY for this endpoint.
- For large ranges, results can be lengthy; narrow dates for concise output.`,
  inputSchema: {
    type: "object",
    properties: {
      aggregationPeriod: {
        type: "string",
        enum: ["DAY", "WEEK", "MONTH", "QUARTER", "YEAR"],
        description: "Time period for aggregation"
      },
      filter: {
        type: "object",
        properties: {
          fromDate: {
            type: "string",
            description: "Start date in YYYY-MM-DD format (e.g., 2022-01-01)"
          },
          toDate: {
            type: "string",
            description: "End date in YYYY-MM-DD format (e.g., 2022-09-13)"
          },
          __userIds: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Array of user IDs to filter by (optional)"
          }
        },
        required: ["fromDate", "toDate"]
      }
    },
    required: ["aggregationPeriod", "filter"]
  }
};

export interface GetActivityDayByDayArgs {
  aggregationPeriod: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  filter: {
    fromDate: string;
    toDate: string;
    __userIds?: string[];
  }
}

export async function handleGetActivityDayByDay(conn: GongConnection, args: GetActivityDayByDayArgs): Promise<{ content: string[] }> {
  try {
    // Validate required parameters
    if (!args.aggregationPeriod || !args.filter || !args.filter.fromDate || !args.filter.toDate) {
      throw new Error('aggregationPeriod, fromDate, and toDate are required');
    }

    const requestBody: GongDayByDayFilter = {
      aggregationPeriod: args.aggregationPeriod,
      filter: args.filter
    };

    if (args.filter.__userIds && args.filter.__userIds.length > 0) {
      requestBody.filter.__userIds = args.filter.__userIds;
    }

    const stats = await conn.post<any>('/stats/activity/day-by-day', requestBody);

    // Support alternative response: usersAggregateActivity → per-user dailyStats
    if (Array.isArray(stats?.usersAggregateActivity)) {
      const users = stats.usersAggregateActivity as any[];
      const header = `Daily Activity Statistics (${args.filter.fromDate} to ${args.filter.toDate}):\n` +
        `Aggregation Period: ${args.aggregationPeriod}\n` +
        `Users: ${users.length}`;

      const body = users.map((user: any) => {
        const userId = user.userId || user.id || 'Unknown User';
        const email = user.userEmailAddress || user.email || '';
        const daily = Array.isArray(user.dailyStats) ? user.dailyStats : [];
        const dailyStr = daily.length > 0 ? daily.map((day: any) => (
          `${day.date || 'Unknown Date'}:\n` +
          `  Total Calls: ${day.totalCalls || 0}\n` +
          `  Total Duration: ${formatDuration(day.totalDuration || 0)}\n` +
          `  Average Call Duration: ${formatDuration(day.averageCallDuration || 0)}\n` +
          `  Calls by Type:\n` +
          `    ${Object.entries(day.callsByType || {}).map(([type, count]) => `${type}: ${count}`).join(', ')}`
        )).join('\n\n') : '  No daily data available';
        return (
          `User ${userId}${email ? ` <${email}>` : ''}:\n` +
          `  Total Days: ${daily.length}\n` +
          `${dailyStr}`
        );
      }).join('\n\n');

      return { content: [ `${header}\n\n${body}` ] };
    }

    const content = [
      `Daily Activity Statistics (${args.filter.fromDate} to ${args.filter.toDate}):\n` +
      `Aggregation Period: ${args.aggregationPeriod}\n` +
      `Total Days: ${stats.dailyStats?.length || 0}\n` +
      `\nDaily Breakdown:\n` +
      `${stats.dailyStats?.map((day: any) => 
        `${day.date}:\n` +
        `  Total Calls: ${day.totalCalls || 0}\n` +
        `  Total Duration: ${formatDuration(day.totalDuration || 0)}\n` +
        `  Average Call Duration: ${formatDuration(day.averageCallDuration || 0)}\n` +
        `  Calls by Type:\n` +
        `    ${Object.entries(day.callsByType || {}).map(([type, count]) => `${type}: ${count}`).join(', ')}`
      ).join('\n\n') || 'No daily data available'}`
    ];

    return { content };
  } catch (error) {
    throw new Error(`Failed to get activity day by day: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
