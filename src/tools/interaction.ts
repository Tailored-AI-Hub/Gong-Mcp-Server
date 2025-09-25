import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";
import { GongInteractionResponse, GongInteraction, GongInteractionStats } from "../types/gong.js";
import { buildPaginationParams, computeAndFormatPagination } from "../utils/helpers.js";

export const GET_INTERACTION_STATS: Tool = {
  name: "gong_get_interaction_stats",
  description: `Get interaction statistics and patterns from call data.

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

Returns: Interaction events or per-person metrics depending on org settings. Metrics include Talk Ratio, Longest Monologue, Longest Customer Story, Interactivity, Patience and Question Rate.

Notes:
- Dates must be YYYY-MM-DD.
- Output can be a flat interactions list or peopleInteractionStats with per-person aggregates.
- Narrow the date range for faster results.
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
    required: ["filter"]
  }
};

export interface GetInteractionStatsArgs {
  filter: {
    fromDate: string;
    toDate: string;
    __userIds?: string[];
  },
  pageNumber?: number;
  pageSize?: number;
  cursor?: string;
}

export async function handleGetInteractionStats(conn: GongConnection, args: GetInteractionStatsArgs): Promise<{ content: string[] }> {
  try {
    // Validate required parameters
    if (!args.filter || !args.filter.fromDate || !args.filter.toDate) {
      throw new Error('fromDate and toDate are required');
    }

    const params = buildPaginationParams(args);
    params.filter = args.filter;

    const interactionsResponse = await conn.post<GongInteractionResponse>('/stats/interaction', params);
    
    const interactionsSection = interactionsResponse?.peopleInteractionStats ? interactionsResponse.peopleInteractionStats.map((interaction: GongInteraction) => {
      const header = `User ID: ${interaction.userId || 'N/A'}\n` +
        `  User Email: ${interaction.userEmailAddress || 'N/A'}\n`
      
      const personMetrics = interaction.personInteractionStats.map((metric: GongInteractionStats) => {
        return `  - ${metric.name || 'Metric'}: ${typeof metric.value === 'number' ? metric.value : (metric.value ?? 'N/A')}`;
      }).join('\n');

      return `${header}\n  Person Metrics:\n${personMetrics}`;
    }).join('\n\n') : '';

    const { summary: paginationInfo } = computeAndFormatPagination(
      interactionsResponse.records,
      typeof args.pageNumber === 'number' ? args.pageNumber : 0,
      typeof args.pageSize === 'number' ? args.pageSize : interactionsResponse.peopleInteractionStats?.length || 0,
      interactionsResponse.peopleInteractionStats?.length || 0
    );

    return { content: [paginationInfo, interactionsSection] };
  } catch (error) {
    throw new Error(`Failed to get interaction stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}