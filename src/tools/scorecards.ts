import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";
import { GongScorecardResponse, GongScorecard, GongScorecardAnswer } from "../types/gong.js";
import { buildPaginationParams, computeAndFormatPagination } from "../utils/helpers.js";

export const GET_ACTIVITY_SCORECARDS: Tool = {
  name: "gong_get_activity_scorecards",
  description: `Get activity scorecards with performance metrics and insights.

Example:
{
  "aggregationPeriod": "QUARTER",
  "filter": {
    "fromDate": "2025-01-01",
    "toDate": "2025-06-30",
    "__userIds": ["1234567890"]
  },
  "pageNumber": 1,
  "pageSize": 10,
  "cursor": "1234567890"
}

Returns: Scorecards for the given aggregation period.

Notes:
- aggregationPeriod controls scorecard grouping (e.g., QUARTER).
- Dates must be YYYY-MM-DD.
- Output shape can vary by tenant configuration (period-level vs per-call answers).
- Use pageNumber (zero-based) and pageSize to paginate.
- You can also pass a cursor returned from the previous response if available.`,
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
    required: ["aggregationPeriod", "filter"]
  }
};

export interface GetActivityScorecardsArgs {
  aggregationPeriod: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  filter: {
    fromDate: string;
    toDate: string;
    __userIds?: string[];
  },
  pageNumber?: number;
  pageSize?: number;
  cursor?: string;
}

export async function handleGetActivityScorecards(conn: GongConnection, args: GetActivityScorecardsArgs): Promise<{ content: string[] }> {
  try {
    // Validate required parameters
    if (!args.aggregationPeriod || !args.filter || !args.filter.fromDate || !args.filter.toDate) {
      throw new Error('aggregationPeriod, fromDate, and toDate are required');
    }

    const params = buildPaginationParams(args);
    params.aggregationPeriod = args.aggregationPeriod;
    params.filter = args.filter;

    const scorecards = await conn.post<GongScorecardResponse>('/stats/activity/scorecards', params);

    // Handle answeredScorecards shape (per-call reviews)
    const answeredScorecardsSection = scorecards?.answeredScorecards ? scorecards.answeredScorecards.map((item: GongScorecard) => {
      const header = `Scorecard: ${item.scorecardName || 'N/A'} (ID: ${item.scorecardId || 'N/A'})\n` +
        `  Answered ID: ${item.answeredScorecardId || 'N/A'}\n` +
        `  Call ID: ${item.callId || 'N/A'}\n` +
        `  Call Start Time: ${item.callStartTime || 'N/A'}\n` +
        `  Reviewed User ID: ${item.reviewedUserId || 'N/A'}\n` +
        `  Reviewer User ID: ${item.reviewerUserId || 'N/A'}\n` +
        `  Review Method: ${item.reviewMethod || 'N/A'}\n` +
        `  Review Time: ${item.reviewTime || 'N/A'}\n` +
        `  Visibility: ${item.visibilityType || 'N/A'}`;

        const answersArr: GongScorecardAnswer[] = Array.isArray(item.answers) ? item.answers : [];
          const answers = answersArr.map((a: GongScorecardAnswer, idx: number) => {
            const answer = a.answerText ?? 'N/A';
            const score = (a.score ?? 'N/A');
            const isOverall = a.isOverall ? 'Yes' : 'No';
            const text = (a.answerText ?? '').toString().trim();
            return (
              ` Answer=${answer}; Score=${score}; Overall=${isOverall};` +
              `${text ? `\n      Text: ${text}` : ''}`
            );
          }).join('\n');

          return `${header}\n  Answers:\n${answers || '    (no answers)'}`;
    }).join('\n\n') : '';

    const { summary: paginationInfo } = computeAndFormatPagination(
      scorecards.records,
      typeof args.pageNumber === 'number' ? args.pageNumber : 0,
      typeof args.pageSize === 'number' ? args.pageSize : scorecards.answeredScorecards?.length || 0,
      scorecards.answeredScorecards?.length || 0
    );

    return { content: [paginationInfo, answeredScorecardsSection] };
  } catch (error) {
    throw new Error(`Failed to get activity scorecards: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
