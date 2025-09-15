// Mock data for testing Gong MCP Server APIs

export const mockGongCalls = [
  {
    id: "2167868958109749118",
    title: "Discovery Call - Acme Corp",
    description: "Initial discovery call with Acme Corp to understand their needs",
    scheduled: "2022-07-15T14:30:00Z",
    started: "2022-07-15T15:30:00Z",
    duration: 3600,
    direction: "Outbound",
    purpose: "Discovery",
    language: "en-US"
  },
  {
    id: "379333695432645797",
    title: "Demo Call - TechStart Inc",
    description: "Product demonstration for TechStart Inc",
    scheduled: "2022-07-20T10:00:00Z",
    started: "2022-07-20T11:00:00Z",
    duration: 3600,
    direction: "Outbound",
    purpose: "Demo",
    language: "en-US"
  }
];

export const mockGongUsers = [
  {
    id: "1587172352477568464",
    name: "John Smith",
    email: "john.smith@company.com",
    title: "Senior Sales Representative",
    department: "Sales",
    managerId: "manager123",
    isActive: true
  },
  {
    id: "user789",
    name: "Mike Wilson",
    email: "mike.wilson@company.com",
    title: "Sales Engineer",
    department: "Sales Engineering",
    managerId: "manager456",
    isActive: true
  },
  {
    id: "inactive_user",
    name: "Jane Doe",
    email: "jane.doe@company.com",
    title: "Former Sales Rep",
    department: "Sales",
    managerId: "manager123",
    isActive: false
  }
];

export const mockTranscriptResponse = {
  callTranscripts: [
    {
      callId: "379333695432645797",
      transcript: [
        {
          speakerId: "user789",
          sentences: [
            {
              start: 1000,
              end: 5000,
              text: "Hello David, thank you for joining our demo today."
            },
            {
              start: 6000,
              end: 12000,
              text: "I'm excited to show you how our platform can help TechStart Inc streamline your operations."
            }
          ]
        },
        {
          speakerId: "prospect101",
          sentences: [
            {
              start: 13000,
              end: 18000,
              text: "Thanks Mike, I'm looking forward to seeing what you have to offer."
            },
            {
              start: 19000,
              end: 25000,
              text: "We're particularly interested in automation capabilities."
            }
          ]
        }
      ],
      metadata: {
        language: "en-US",
        wordCount: 45,
        duration: 3600
      }
    }
  ]
};

export const mockActivityAggregateResponse = {
  totalCalls: 25,
  totalDuration: 90000,
  averageCallDuration: 3600,
  callsByType: {
    "Discovery": 10,
    "Demo": 8,
    "Follow-up": 7
  },
  callsByDirection: {
    "Outbound": 20,
    "Inbound": 5
  },
  callsByUser: {
    "1587172352477568464": {
      totalCalls: 15,
      totalDuration: 54000,
      averageCallDuration: 3600,
      callsByType: {
        "Discovery": 8,
        "Demo": 4,
        "Follow-up": 3
      }
    },
    "user789": {
      totalCalls: 10,
      totalDuration: 36000,
      averageCallDuration: 3600,
      callsByType: {
        "Discovery": 2,
        "Demo": 4,
        "Follow-up": 4
      }
    }
  }
};

export const mockActivityPeriodResponse = {
  periods: [
    {
      period: "2022-01",
      totalCalls: 8,
      totalDuration: 28800,
      averageCallDuration: 3600
    },
    {
      period: "2022-02",
      totalCalls: 12,
      totalDuration: 43200,
      averageCallDuration: 3600
    },
    {
      period: "2022-03",
      totalCalls: 5,
      totalDuration: 18000,
      averageCallDuration: 3600
    }
  ]
};

export const mockDayByDayResponse = {
  dailyStats: [
    {
      date: "2022-01-01",
      totalCalls: 3,
      totalDuration: 10800,
      averageCallDuration: 3600,
      callsByType: {
        "Discovery": 2,
        "Demo": 1
      }
    },
    {
      date: "2022-01-02",
      totalCalls: 2,
      totalDuration: 7200,
      averageCallDuration: 3600,
      callsByType: {
        "Follow-up": 2
      }
    }
  ]
};

export const mockScorecardsResponse = {
  scorecards: [
    {
      period: "2022-Q1",
      score: 85,
      metrics: {
        "Call Volume": 95,
        "Call Quality": 78,
        "Conversion Rate": 82,
        "Talk Time Ratio": 88
      },
      insights: [
        "Call volume exceeded target by 15%",
        "Quality scores show room for improvement in discovery questions",
        "Conversion rate is on track with quarterly goals"
      ]
    },
    {
      period: "2022-Q2",
      score: 92,
      metrics: {
        "Call Volume": 88,
        "Call Quality": 95,
        "Conversion Rate": 90,
        "Talk Time Ratio": 85
      },
      insights: [
        "Significant improvement in call quality metrics",
        "Conversion rate exceeds targets",
        "Maintain current momentum"
      ]
    }
  ]
};

export const mockInteractionResponse = {
  interactions: [
    {
      callId: "2167868958109749118",
      interactionType: "Question",
      timestamp: "2022-07-15T14:35:00Z",
      duration: 120,
      participants: ["John Smith", "Sarah Johnson"],
      summary: "Discovery questions about current pain points"
    },
    {
      callId: "2167868958109749118",
      interactionType: "Objection Handling",
      timestamp: "2022-07-15T14:50:00Z",
      duration: 180,
      participants: ["John Smith", "Sarah Johnson"],
      summary: "Addressing concerns about implementation timeline"
    }
  ]
};

// Sample test inputs for different API calls
export const testInputs = {
  listCalls: {
    fromDateTime: "2022-07-01T02:00:00-05:00",
    toDateTime: "2022-07-31T02:00:00-05:00",
    limit: 10
  },
  getCall: {
    callId: "2167868958109749118"
  },
  getTranscript: {
    callIds: ["379333695432645797", "2167868958109749118"]
  },
  listUsers: {
    limit: 50,
    includeInactive: false
  },
  getUser: {
    userId: "1587172352477568464"
  },
  activityAggregate: {
    filter: {
      fromDate: "2022-01-01",
      toDate: "2025-07-13",
      __userIds: ["1587172352477568464", "user789"]
    }
  },
  activityPeriod: {
    aggregationPeriod: "MONTH",
    filter: {
      fromDate: "2022-01-01",
      toDate: "2022-09-13",
      __userIds: ["1587172352477568464"]
    }
  },
  dayByDay: {
    aggregationPeriod: "DAY",
    filter: {
      fromDate: "2022-01-01",
      toDate: "2022-01-31",
      __userIds: ["1587172352477568464"]
    }
  },
  scorecards: {
    aggregationPeriod: "QUARTER",
    filter: {
      fromDate: "2022-01-01",
      toDate: "2022-12-31",
      __userIds: ["1587172352477568464"]
    }
  },
  interactionStats: {
    filter: {
      fromDate: "2022-01-01",
      toDate: "2025-07-13",
      __userIds: ["1587172352477568464"]
    }
  }
};
