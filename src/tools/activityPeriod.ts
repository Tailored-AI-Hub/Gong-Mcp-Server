import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";
import { GongActivityPeriodFilter, GongActivityPeriodResponse } from "../types/gong.js";

export const GET_ACTIVITY_AGGREGATE_BY_PERIOD: Tool = {
  name: "gong_get_activity_aggregate_by_period",
  description: `Get activity statistics aggregated by period (DAY, WEEK, MONTH, QUARTER, YEAR).

Example:
{
  "aggregationPeriod": "MONTH",
  "filter": {
    "fromDate": "2022-01-01",
    "toDate": "2022-09-13",
    "__userIds": ["1587172352477568464"]
  }
}

Returns: Per-period totals including total calls, total duration, and average call duration for each period.

Notes:
- aggregationPeriod controls the grouping granularity.
- Dates must be YYYY-MM-DD.
- Provide __userIds to filter by specific users.`,
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
        },
        },
        required: ["fromDate", "toDate"]
      }
    },
    required: ["aggregationPeriod", "filter"]
  }
};

export interface GetActivityAggregateByPeriodArgs {
  aggregationPeriod: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  filter: {
    fromDate: string;
    toDate: string;
    __userIds?: string[];
  }
}

export async function handleGetActivityAggregateByPeriod(conn: GongConnection, args: GetActivityAggregateByPeriodArgs): Promise<{ content: string[] }> {
  try {
    // Validate required parameters
    if (!args.aggregationPeriod || !args.filter || !args.filter.fromDate || !args.filter.toDate) {
      throw new Error('aggregationPeriod, fromDate, and toDate are required');
    }

    const requestBody: GongActivityPeriodFilter = {
      aggregationPeriod: args.aggregationPeriod,
      filter: args.filter
    };

    if (args.filter.__userIds && args.filter.__userIds.length > 0) {
      requestBody.filter.__userIds = args.filter.__userIds;
    }
    const stats = await conn.post<any>('/stats/activity/aggregate-by-period', requestBody);
    
    const content = [
      `Activity Statistics by ${args.aggregationPeriod} (${args.filter.fromDate} to ${args.filter.toDate}):\n` +
      `Total Periods: ${stats.periods.length}\n` +
      `\nPeriod Breakdown:\n` +
      `${stats.periods?.map((period: any) => 
        `${period.period}:\n` +
        `  Total Calls: ${period.totalCalls || 0}\n` +
        `  Total Duration: ${formatDuration(period.totalDuration || 0)}\n` +
        `  Average Call Duration: ${formatDuration(period.averageCallDuration || 0)}`
      ).join('\n\n') || 'No period data available'}`
    ];

    return { content };
  } catch (error) {
    throw new Error(`Failed to get activity aggregate by period: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
