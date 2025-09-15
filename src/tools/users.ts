import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";
import { GongUser } from "../types/gong.js";

export const LIST_USERS: Tool = {
  name: "gong_list_users",
  description: `List all users in the Gong organization. No input required.

Example:
{}

Returns: For each active user, key profile fields including ID, name, email, title, department, manager ID, and active status.

Notes:
- By default, only active users are returned.
- If you need inactive users, ask to extend this tool to include an includeInactive option.`,
  inputSchema: {
    type: "object",
    properties: {}
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

export interface GetUserArgs {
  userId: string;
}

export async function handleListUsers(conn: GongConnection, args: { includeInactive?: boolean } = {}): Promise<{ content: string[] }> {
  try {
    const params: Record<string, any> = {};

    const response = await conn.get<any>('/users', params);
    
    // Handle different possible API response structures
    let users: any[] = [];
    
    if (Array.isArray(response)) {
      // Direct array response
      users = response;
    } else if (response && response.users && Array.isArray(response.users)) {
      // Nested users property
      users = response.users;
    } else if (response && response.data && Array.isArray(response.data)) {
      // Nested data property
      users = response.data;
    } else if (response && response.results && Array.isArray(response.results)) {
      // Nested results property
      users = response.results;
    } else {
      // Log the actual response structure for debugging
      console.log('Unexpected API response structure:', typeof response, Object.keys(response || {}));
      throw new Error('Unexpected API response structure - users not found in expected format');
    }
    
    if (!Array.isArray(users)) {
      throw new Error(`API returned users in unexpected format: ${typeof users}`);
    }
    
    // Filter inactive users only if includeInactive is false (default behavior)
    const filteredUsers = args.includeInactive === true ? users : users.filter(user => user.isActive !== false);
    
    const content = filteredUsers.map(user => {
      // Handle different user object structures
      const userId = user.id || user.userId || 'Unknown';
      const name = user.name || user.displayName || 'N/A';
      const email = user.email || user.emailAddress || 'N/A';
      const title = user.title || user.jobTitle || 'N/A';
      const department = user.department || user.team || 'N/A';
      const managerId = user.managerId || user.manager || 'N/A';
      const isActive = user.isActive !== false;
      
      return `User ID: ${userId}\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Title: ${title}\n` +
        `Department: ${department}\n` +
        `Manager ID: ${managerId}\n` +
        `Active: ${isActive ? 'Yes' : 'No'}\n` +
        `---`;
    });

    return { content };
  } catch (error) {
    throw new Error(`Failed to list users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleGetUser(conn: GongConnection, args: GetUserArgs): Promise<{ content: string[] }> {
  try {
    const response = await conn.get<any>(`/users/${args.userId}`);
    
    // Handle different possible user object structures
    const userData = response.user || response;
    const userId = userData.id || userData.userId || args.userId;
    const name = userData.name || userData.displayName || 'N/A';
    const email = userData.email || userData.emailAddress || 'N/A';
    const title = userData.title || userData.jobTitle || 'N/A';
    const department = userData.department || userData.team || 'N/A';
    const managerId = userData.managerId || userData.manager || 'N/A';
    const isActive = userData.isActive !== false;
    
    const content = [
      `User Details:\n` +
      `ID: ${userId}\n` +
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Title: ${title}\n` +
      `Department: ${department}\n` +
      `Manager ID: ${managerId}\n` +
      `Active: ${isActive ? 'Yes' : 'No'}`
    ];

    return { content };
  } catch (error) {
    throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
