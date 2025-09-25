import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";
import { GongScorecardFilter, GongScorecardResponse } from "../types/gong.js";

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
  }
}

Returns: Period scorecards with overall score, metrics, and insights. In some tenants, returns answeredScorecards (per-call reviews with answers).

Notes:
- aggregationPeriod controls scorecard grouping (e.g., QUARTER).
- Dates must be YYYY-MM-DD.
- Output shape can vary by tenant configuration (period-level vs per-call answers).`,
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

export interface GetActivityScorecardsArgs {
  aggregationPeriod: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  filter: {
    fromDate: string;
    toDate: string;
    __userIds?: string[];
  }
}

export async function handleGetActivityScorecards(conn: GongConnection, args: GetActivityScorecardsArgs): Promise<{ content: string[] }> {
  try {
    // Validate required parameters
    if (!args.aggregationPeriod || !args.filter || !args.filter.fromDate || !args.filter.toDate) {
      throw new Error('aggregationPeriod, fromDate, and toDate are required');
    }

    const requestBody: GongScorecardFilter = {
      aggregationPeriod: args.aggregationPeriod,
      filter: args.filter
    };

    if (args.filter.__userIds && args.filter.__userIds.length > 0) {
      requestBody.filter.__userIds = args.filter.__userIds;
    }

    const scorecards = await conn.post<any>('/stats/activity/scorecards', requestBody);
    
    // Handle answeredScorecards shape (per-call reviews)
    if (Array.isArray(scorecards?.answeredScorecards)) {
      const answered = scorecards.answeredScorecards as any[];
      const content = [
        `Activity Scorecards (${args.filter.fromDate} to ${args.filter.toDate}):\n` +
        `Aggregation Period: ${args.aggregationPeriod}\n` +
        `Total Answered Scorecards: ${answered.length}\n` +
        `\nAnswered Scorecards:\n` +
        answered.map((item: any) => {
          const header =
            `Scorecard: ${item.scorecardName || 'N/A'} (ID: ${item.scorecardId || 'N/A'})\n` +
            `  Answered ID: ${item.answeredScorecardId || 'N/A'}\n` +
            `  Call ID: ${item.callId || 'N/A'}\n` +
            `  Call Start: ${item.callStartTime || 'N/A'}\n` +
            `  Reviewed User ID: ${item.reviewedUserId || 'N/A'}\n` +
            `  Reviewer User ID: ${item.reviewerUserId || 'N/A'}\n` +
            `  Review Method: ${item.reviewMethod || 'N/A'}\n` +
            `  Review Time: ${item.reviewTime || 'N/A'}\n` +
            `  Visibility: ${item.visibilityType || 'N/A'}`;

          const answersArr: any[] = Array.isArray(item.answers) ? item.answers : [];
          const answers = answersArr.map((a: any, idx: number) => {
            const score = (a.score ?? 'N/A');
            const isOverall = a.isOverall ? 'Yes' : 'No';
            const na = a.notApplicable ? 'Yes' : 'No';
            const text = (a.answerText ?? '').toString().trim();
            return (
              `    Q${idx + 1}:` +
              ` Score=${score}; Overall=${isOverall}; N/A=${na}` +
              `${text ? `\n      Text: ${text}` : ''}`
            );
          }).join('\n');

          return `${header}\n  Answers:\n${answers || '    (no answers)'}`;
        }).join('\n\n')
      ];
      return { content };
    }
    
    const content = [
      `Activity Scorecards (${args.filter.fromDate} to ${args.filter.toDate}):\n` +
      `Aggregation Period: ${args.aggregationPeriod}\n` +
      `Total Scorecards: ${scorecards.scorecards?.length || 0}\n` +
      `\nScorecard Details:\n` +
      `${scorecards.scorecards?.map((scorecard: any) => 
        `${scorecard.period}:\n` +
        `  Overall Score: ${scorecard.score || 0}/100\n` +
        `  Metrics:\n` +
        `    ${Object.entries(scorecard.metrics || {}).map(([metric, value]) => `${metric}: ${value}`).join('\n    ')}\n` +
        `  Insights:\n` +
        `    ${(scorecard.insights || []).map((insight: any) => `- ${insight}`).join('\n    ')}`
      ).join('\n\n') || 'No scorecard data available'}`
    ];

    return { content };
  } catch (error) {
    throw new Error(`Failed to get activity scorecards: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
