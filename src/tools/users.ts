import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";
import { GongUser, GongUserResponse, GongRecords, GongUserHistoryResponse, GongUserHistory, GongUserSingleResponse } from "../types/gong.js";
import { buildPaginationParams, computeAndFormatPagination } from "../utils/helpers.js";

export const LIST_USERS: Tool = {
  name: "gong_list_users",
  description: `List users in the Gong organization with optional pagination.

Example:
{}

With pagination:
{
  "pageNumber": 0,
  "pageSize": 100
}

Returns: For each active user, key profile fields including ID, name, email, title, department, manager ID, and active status.

Notes:
- By default, only active users are returned.
- Use pageNumber (zero-based) and pageSize to paginate.
- You can also pass a cursor returned from the previous response if available.
- Set includeInactive to true to include inactive users.`,
  inputSchema: {
    type: "object",
    properties: {
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
      includeInactive: {
        type: "boolean",
        description: "Include inactive users when true"
      }
    }
  }
};

export const GET_USER: Tool = {
  name: "gong_get_user",
  description: `Get detailed information about a specific user by ID.

Example:
{
  "userId": "1587172352477568464"
}

Returns: User details including name, email, title, department, manager ID, and active status.

Notes:
- Use with an ID from gong_list_users or a known user ID.
- If the user is not found or access is restricted, an error is returned.`,
  inputSchema: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        description: "The unique identifier of the user"
      }
    },
    required: ["userId"]
  }
};

export const GET_USER_HISTORY: Tool = {
  name: "gong_get_user_history",
  description: `Get the settings history of a specific user by ID.
  
  Example:
  {
    "userId": "1587172352477568464"
  }

  Returns: The settings history of the user.

  Notes:
  - Use with an ID from gong_list_users or a known user ID.
  - If the user is not found or access is restricted, an error is returned.
  `,
  inputSchema: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        description: "The unique identifier of the user"
      }
    },
    required: ["userId"]
  }
};

export const LIST_USERS_BY_FILTERS: Tool = {
  name: "gong_list_users_by_filters",
  description: `List users in the Gong organization with optional pagination and filters.
  
Example:
{
  "filter": {
    "fromDateTime": "2022-01-01",
    "toDateTime": "2022-01-31",
    "includeAvatars": true,
    "__primaryUserIds": ["1587172352477568464"]
  },
  "pageNumber": 0,
  "pageSize": 100,
  "cursor": "123"
}

Returns: List of users matching the filters.

Notes:
- fromDateTime and toDateTime must be in YYYY-MM-DD format.
- includeAvatars is optional and defaults to true.
- __primaryUserIds is optional and defaults to an empty array.
- Use pageNumber (zero-based) and pageSize to paginate.
- You can also pass a cursor returned from the previous response if available.
  `,
  inputSchema: {
    type: "object",
    properties: {
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
      includeInactive: {
        type: "boolean",
        description: "Include inactive users when true"
      },
      filter: {
        type: "object",
        properties: {
          fromDateTime: {
            type: "string",
            description: "Start date in YYYY-MM-DD format (e.g., 2022-01-01)"
          },
          toDateTime: {
            type: "string",
            description: "End date in YYYY-MM-DD format (e.g., 2022-01-31)"
          },
          includeAvatars: {
            type: "boolean",
            description: "Include avatars when true"
          },
          __primaryUserIds: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Array of primary user IDs to filter by (optional)"
          }
        }
      }
    },
    required: ["filter"]
  }
}

export interface ListUsersArgs {
  includeInactive?: boolean;
  pageNumber?: number;
  pageSize?: number;
  cursor?: string;
}

export interface GetUserHistoryArgs {
  userId: string;
}

export interface GetUserArgs {
  userId: string;
}

export interface ListUsersByFiltersArgs {
  filter: {
    fromDateTime: string;
    toDateTime: string;
    includeAvatars: boolean;
    __primaryUserIds: string[];
  };
  pageNumber?: number;
  pageSize?: number;
  cursor?: string;
}

// Helper: normalize a raw Gong user object into a consistent shape
function normalizeUser(raw: GongUser): {
  id: string;
  name: string;
  email: string;
  title: string;
  managerId: string;
  isActive: boolean;
} {
  const id = raw?.id ?? 'N/A';
  const firstName = raw?.firstName ?? '';
  const lastName = raw?.lastName ?? '';
  const nameCandidate = `${firstName} ${lastName}`.trim();
  const name = nameCandidate.length > 0 ? nameCandidate : 'N/A';
  const email = raw?.emailAddress ?? 'N/A';
  const title = raw?.title ?? 'N/A';
  const managerId = raw?.managerId ?? 'N/A';
  const isActive = raw?.active !== false;
  return { id, name, email, title, managerId, isActive };
}

// Helper: format a normalized user into the multi-line list entry
function formatUserListEntry(user: ReturnType<typeof normalizeUser>): string {
  return `User ID: ${user.id}\n` +
    `Name: ${user.name}\n` +
    `Email: ${user.email}\n` +
    `Title: ${user.title}\n` +
    `Manager ID: ${user.managerId}\n` +
    `Active: ${user.isActive ? 'Yes' : 'No'}\n` +
    `---`;
}

// Helper: extract users and records safely
function extractUsersAndRecords(response: GongUserResponse): { users: GongUser[]; records: GongRecords } {
  if (!response?.users) {
    throw new Error(`API returned users in unexpected format: ${typeof response?.users}`);
  }
  const users = Array.isArray(response.users) ? response.users : [];
  const records = response.records || {
    totalRecords: 0,
    currentPageSize: 0,
    currentPageNumber: 0,
    cursor: '',
  };
  return { users, records };
}

export async function handleListUsers(conn: GongConnection, args: ListUsersArgs = {}): Promise<{ content: string[] }> {
  try {
    const params = buildPaginationParams(args);

    const response = await conn.get<GongUserResponse>('/users', params);
    
    const { users, records } = extractUsersAndRecords(response);
    
    // Filter inactive users only if includeInactive is false (default behavior)
    const filteredUsers = args.includeInactive === true ? users : users.filter(user => user.active !== false);
    
    const content = filteredUsers.map(u => formatUserListEntry(normalizeUser(u)));

    const { summary: paginationInfo } = computeAndFormatPagination(
      records,
      typeof args.pageNumber === 'number' ? args.pageNumber : 0,
      typeof args.pageSize === 'number' ? args.pageSize : filteredUsers.length,
      filteredUsers.length
    );

    return { content: [paginationInfo, ...content] };
  } catch (error) {
    throw new Error(`Failed to list users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleGetUser(conn: GongConnection, args: GetUserArgs): Promise<{ content: string[] }> {
  try {
    const response = await conn.get<GongUserSingleResponse>(`/users/${args.userId}`);
    
    // Handle different possible user object structures
    const userData = response.user;
    const normalized = normalizeUser(userData);
    
    const content = [
      `User Details:\n` +
      `ID: ${normalized.id}\n` +
      `Name: ${normalized.name}\n` +
      `Email: ${normalized.email}\n` +
      `Title: ${normalized.title}\n` +
      `Manager ID: ${normalized.managerId}\n` +
      `Active: ${normalized.isActive ? 'Yes' : 'No'}`
    ];

    return { content };
  } catch (error) {
    throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleGetUserHistory(conn: GongConnection, args: GetUserHistoryArgs): Promise<{ content: string[] }> {
  try {
    const response = await conn.get<GongUserHistoryResponse>(`/users/${args.userId}/settings/history`);

    const content = response.userSettingsHistory.map((history: GongUserHistory) => {
      return `Setting: ${history.setting}\n` +
        `Value: ${history.value}\n` +
        `Timestamp: ${history.time}\n` +
        `---`;
    });

    return { content };
  } catch (error) {
    throw new Error(`Failed to get user history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleListUsersByFilters(conn: GongConnection, args: ListUsersByFiltersArgs): Promise<{ content: string[] }> {
  try {
    const params = buildPaginationParams(args);

    const response = await conn.get<GongUserResponse>('/users/extensive', {
      ...params,
      ...args.filter
    });
    
    const { users, records } = extractUsersAndRecords(response);
    
    const content = users.map(u => formatUserListEntry(normalizeUser(u)));

    const { summary: paginationInfo } = computeAndFormatPagination(
      records,
      typeof args.pageNumber === 'number' ? args.pageNumber : 0,
      typeof args.pageSize === 'number' ? args.pageSize : users.length,
      users.length
    );

    return { content: [paginationInfo, ...content] };
  } catch (error) {
    throw new Error(`Failed to list users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}