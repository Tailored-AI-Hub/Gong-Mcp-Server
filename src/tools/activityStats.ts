import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";
import { GongActivityResponse, GongActivityStats } from "../types/gong.js";
import { buildPaginationParams, computeAndFormatPagination } from "../utils/helpers.js";

export const GET_ACTIVITY_AGGREGATE: Tool = {
  name: "gong_get_activity_aggregate",
  description: `Get aggregate activity statistics for users within a date range.

Example:
{
  "filter": {
    "fromDate": "2025-01-01",
    "toDate": "2025-07-13",
    "__userIds": ["1234567890"]
  },
  "pageNumber": 1,
  "pageSize": 10,
  "cursor": "1234567890"
}

Returns: User level totals for the given aggregation period.

Notes:
- Dates must be YYYY-MM-DD.
- Provide __userIds to scope stats; omit to aggregate across all accessible users.
- For large orgs and ranges, consider narrowing the date window for speed.
- Use pageNumber (zero-based) and pageSize to paginate.
- You can also pass a cursor returned from the previous response if available.`,
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
      },
      pageNumber: {
        type: "number",
        description: "Zero-based page number to fetch"
      },
      pageSize: {
        type: "number",
        description: "Number of users per page (e.g., 100)"
      },
      cursor: {
        type: "string",
        description: "Cursor token for fetching the next page, if provided by API"
      },
    },
    required: ["filter"]
  }
};

export interface GetActivityAggregateArgs {
  filter: {
    fromDate: string;
    toDate: string;
    __userIds?: string[];
  },
  pageNumber?: number;
  pageSize?: number;
  cursor?: string;
}

export async function handleGetActivityAggregate(conn: GongConnection, args: GetActivityAggregateArgs): Promise<{ content: string[] }> {
  try {
    // Validate required parameters
    if (!args.filter || !args.filter.fromDate || !args.filter.toDate) {
      throw new Error('fromDate and toDate are required');
    }

    const params = buildPaginationParams(args);
    params.filter = args.filter;
    const stats = await conn.post<GongActivityResponse>('/stats/activity/aggregate', params);

    const usersAgg = Array.isArray(stats.usersAggregateActivityStats) ? stats.usersAggregateActivityStats : [];

    const userSections = usersAgg.map((user: GongActivityStats) => {
      const activities = Array.isArray(user.userAggregateActivityStats) ? user.userAggregateActivityStats : [];
      const totals = activities.map((activity: GongActivityStats) => {
        return `User ID: ${user.userId}\n` +
          `User Email: ${user.userEmailAddress}\n` +
          `Calls as host: ${activity.userAggregateActivityStats.callsAsHost}\n` +
          `Calls gave feedback: ${activity.userAggregateActivityStats.callsGaveFeedback}\n` +
          `Calls requested feedback: ${activity.userAggregateActivityStats.callsRequestedFeedback}\n` +
          `Calls received feedback: ${activity.userAggregateActivityStats.callsReceivedFeedback}\n` +
          `Own calls listened to: ${activity.userAggregateActivityStats.ownCallsListenedTo}\n` +
          `Others calls listened to: ${activity.userAggregateActivityStats.othersCallsListenedTo}\n` +
          `Calls shared internally: ${activity.userAggregateActivityStats.callsSharedInternally}\n` +
          `Calls shared externally: ${activity.userAggregateActivityStats.callsSharedExternally}\n` +
          `Calls scorecards filled: ${activity.userAggregateActivityStats.callsScorecardsFilled}\n` +
          `Calls scorecards received: ${activity.userAggregateActivityStats.callsScorecardsReceived}\n` +
          `Calls attended: ${activity.userAggregateActivityStats.callsAttended}\n` +
          `Calls comments given: ${activity.userAggregateActivityStats.callsCommentsGiven}\n` +
          `Calls comments received: ${activity.userAggregateActivityStats.callsCommentsReceived}\n` +
          `Calls marked as feedback given: ${activity.userAggregateActivityStats.callsMarkedAsFeedbackGiven}\n` +
          `Calls marked as feedback received: ${activity.userAggregateActivityStats.callsMarkedAsFeedbackReceived}`;
      });

      return totals.join('\n\n');
    }).join('\n\n') || 'No period data available';

    const header = `Activity Statistics (${args.filter.fromDate} to ${args.filter.toDate}):`;

    const content = [
      header,
      `\nUser Totals:\n${userSections}`,
    ];

    const { summary: paginationInfo } = computeAndFormatPagination(
      stats.records,
      typeof args.pageNumber === 'number' ? args.pageNumber : 0,
      typeof args.pageSize === 'number' ? args.pageSize : usersAgg.length,
      usersAgg.length
    );

    return { content: [paginationInfo, ...content] };
  } catch (error) {
    throw new Error(`Failed to get activity aggregate by period: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}