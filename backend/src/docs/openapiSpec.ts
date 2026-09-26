export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: '🌾 KisanSetu API — Smart Agricultural Procurement & Queue Orchestration',
    version: '1.0.0',
    description: `
**KisanSetu (*Bridge for Farmers*)** is a full-stack, enterprise-grade GovTech platform engineered for **Smart India Hackathon (SIH) 2026**.

Digitizes the entire agricultural MSP procurement lifecycle:
1. **Dynamic Slot Scheduling:** Capacity-constrained booking preventing mandi gate congestion.
2. **Digital FIFO Queue Management:** Real-time countdowns, queue positions, and QR gate passes.
3. **Electronic Weighbridge & Quality Inspection:** Fair gross/tare calculations and Agmarknet Grade A testing.
4. **Direct Benefit Transfer (DBT):** Transparent multi-stage payment tracking with instant A4 PDF receipts.

### Authentication
Most operational endpoints require a JSON Web Token (JWT).
Use the **/api/auth/login** endpoint to obtain a token, then click **Authorize** at the top right and enter:
\`Bearer <your_token>\`

**Demo Personas:**
- **Farmer:** \`phone: farmer1\`, \`password: password123\`
- **Officer:** \`phone: officer1\`, \`password: password123\`
- **Admin:** \`phone: admin1\`, \`password: password123\`
    `,
    contact: {
      name: 'KisanSetu Core Engineering Team',
      url: 'https://github.com/VishalKumar4510/KisanSetu',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Local Direct Backend API',
    },
    {
      url: 'http://localhost:80',
      description: 'Docker Compose Nginx Ingress',
    },
  ],
  tags: [
    { name: 'Health & Observability', description: 'Container liveness and PostgreSQL readiness probes' },
    { name: 'Authentication', description: 'Bcrypt-verified credentials and JWT session issuance' },
    { name: 'Farmer Operations', description: 'Farmer profiles, registered landholdings, and produce catalog' },
    { name: 'Procurement Centres', description: 'Mandi infrastructure, active bays, capacity, and live congestion' },
    { name: 'Slots & Appointments', description: 'Capacity-balanced slot reservations and AI recommendations' },
    { name: 'Live Queue & Gate Tokens', description: 'FIFO mandi queue tracking, wait estimation, and QR gate passes' },
    { name: 'Procurement State Machine', description: '9-stage physical workflow from gate arrival to completion' },
    { name: 'Officer Operations Console', description: 'Weighbridge intake, moisture/foreign matter grading, and MSP calculation' },
    { name: 'Payments & DBT Tracking', description: 'Direct Benefit Transfer disbursement, bank masking, and settlement audit' },
    { name: 'Executive Analytics', description: 'District heatmaps, centre utilization, and state-wide procurement KPIs' },
    { name: 'AI Vernacular Assistant', description: 'Bilingual agricultural chatbot and voice query engine' },
  ],
  paths: {
    '/health/live': {
      get: {
        tags: ['Health & Observability'],
        summary: 'Liveness Probe',
        description: 'Returns HTTP 200 if the Node.js API process is responsive and receiving requests.',
        responses: {
          '200': {
            description: 'Process is alive',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    uptime: { type: 'number', example: 120.45 },
                    timestamp: { type: 'string', example: '2026-09-26T22:00:00.000Z' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health & Observability'],
        summary: 'Readiness Probe',
        description: 'Validates active PostgreSQL database connectivity and query execution before accepting ingress traffic.',
        responses: {
          '200': {
            description: 'Backend and Database ready',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ready' },
                    database: { type: 'string', example: 'connected' },
                    timestamp: { type: 'string', example: '2026-09-26T22:00:00.000Z' },
                  },
                },
              },
            },
          },
          '503': {
            description: 'PostgreSQL connection failed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'unhealthy' },
                    error: { type: 'string', example: 'Database connection unavailable' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User Login & JWT Issuance',
        description: 'Authenticates a user via phone number and password with bcrypt validation. Protected by strict rate-limiting.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'password'],
                properties: {
                  phone: { type: 'string', example: 'farmer1' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error (missing phone or password)' },
          '401': { description: 'Invalid phone or password' },
          '429': { description: 'Too many login attempts; rate limited' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register New User',
        description: 'Creates a new user profile with salt-hashed bcrypt password.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'name', 'password', 'role'],
                properties: {
                  phone: { type: 'string', example: '9876543210' },
                  name: { type: 'string', example: 'Harish Chandra' },
                  password: { type: 'string', example: 'SecureP@ss123' },
                  role: { type: 'string', enum: ['FARMER', 'OFFICER', 'ADMIN'], example: 'FARMER' },
                  aadhaar: { type: 'string', example: 'XXXX-XXXX-9901' },
                  language: { type: 'string', enum: ['en', 'hi'], example: 'hi' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User successfully created' },
          '400': { description: 'Validation failure or user already exists' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Current User Identity',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Authenticated user profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': { description: 'Missing or expired Bearer token' },
        },
      },
    },
    '/api/farmers/me': {
      get: {
        tags: ['Farmer Operations'],
        summary: 'Get Farmer Dossier & Land Details',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Farmer agricultural and banking profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Farmer' },
              },
            },
          },
          '403': { description: 'Forbidden (User is not a FARMER)' },
        },
      },
    },
    '/api/centres': {
      get: {
        tags: ['Procurement Centres'],
        summary: 'List Mandi Centres',
        description: 'Returns all APMC procurement centres with active bay count and live congestion levels (GREEN/YELLOW/RED).',
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Centre' },
                },
              },
            },
          },
        },
      },
    },
    '/api/slots': {
      get: {
        tags: ['Slots & Appointments'],
        summary: 'Query Available Mandi Slots',
        parameters: [
          { name: 'centreId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'date', in: 'query', required: false, schema: { type: 'string', example: '2026-09-27' } },
        ],
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Slot' },
                },
              },
            },
          },
        },
      },
    },
    '/api/slots/book': {
      post: {
        tags: ['Slots & Appointments'],
        summary: 'Atomic Slot Reservation & Token Creation',
        security: [{ BearerAuth: [] }],
        description: 'Atomically reserves a slot, increments booking count, and issues an active digital gate pass token in PostgreSQL.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['slotId', 'crop', 'estimatedQuantity'],
                properties: {
                  slotId: { type: 'string', example: 'slot-001' },
                  crop: { type: 'string', enum: ['WHEAT', 'PADDY', 'ONION', 'MAIZE', 'PULSES'], example: 'WHEAT' },
                  estimatedQuantity: { type: 'number', example: 50 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Slot successfully booked and token issued',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    token: { $ref: '#/components/schemas/Token' },
                    procurementId: { type: 'string', example: 'proc-101' },
                  },
                },
              },
            },
          },
          '409': { description: 'Farmer already has an active token or slot capacity exhausted' },
        },
      },
    },
    '/api/queue/position': {
      get: {
        tags: ['Live Queue & Gate Tokens'],
        summary: 'Live Mandi Queue Tracker',
        security: [{ BearerAuth: [] }],
        description: 'Returns real-time queue position, estimated wait time in minutes, and current serving token.',
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    queuePosition: { type: 'number', example: 3 },
                    totalAhead: { type: 'number', example: 2 },
                    estimatedWaitMinutes: { type: 'number', example: 24 },
                    currentlyServing: { type: 'string', example: 'TKN-0004' },
                    centreName: { type: 'string', example: 'Lucknow Central Mandi' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/officer/stats': {
      get: {
        tags: ['Officer Operations Console'],
        summary: 'Daily Mandi Desk Statistics',
        security: [{ BearerAuth: [] }],
        description: 'Returns procurement throughput metrics, waiting farmers count, and calibrated scale status.',
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    todayProcurements: { type: 'number', example: 18 },
                    pendingQueue: { type: 'number', example: 7 },
                    avgWaitMinutes: { type: 'number', example: 14.2 },
                    totalVolumeQuintals: { type: 'number', example: 450.5 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/officer/call': {
      post: {
        tags: ['Officer Operations Console'],
        summary: 'Call Next Farmer in Queue',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tokenId'],
                properties: {
                  tokenId: { type: 'string', example: 'token-0001' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Farmer called to weighbridge inspection desk' },
        },
      },
    },
    '/api/officer/weighment': {
      post: {
        tags: ['Officer Operations Console'],
        summary: 'Submit Electronic Weighbridge Record',
        security: [{ BearerAuth: [] }],
        description: 'Records gross weight, tare weight, calculates net quantity, and attaches calibrated scale hardware ID.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['procurementId', 'grossWeight', 'tareWeight', 'scaleId'],
                properties: {
                  procurementId: { type: 'string', example: 'proc-0001' },
                  grossWeight: { type: 'number', example: 6200 },
                  tareWeight: { type: 'number', example: 1200 },
                  scaleId: { type: 'string', example: 'WB-01' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Weighing' },
              },
            },
          },
        },
      },
    },
    '/api/officer/quality': {
      post: {
        tags: ['Officer Operations Console'],
        summary: 'Submit Agmarknet Quality Assessment',
        security: [{ BearerAuth: [] }],
        description: 'Records moisture percentage, foreign matter, damaged grains, and assigns FAQ grade (Grade A / FAQ / Needs Review / Rejected).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['procurementId', 'crop', 'moistureContent', 'foreignMatter', 'damagedGrains', 'grade', 'qualityResult'],
                properties: {
                  procurementId: { type: 'string', example: 'proc-0001' },
                  crop: { type: 'string', example: 'WHEAT' },
                  moistureContent: { type: 'number', example: 11.8 },
                  foreignMatter: { type: 'number', example: 0.5 },
                  damagedGrains: { type: 'number', example: 1.2 },
                  grade: { type: 'string', example: 'A' },
                  qualityResult: { type: 'string', enum: ['ACCEPTED', 'NEEDS_REVIEW', 'REJECTED'], example: 'ACCEPTED' },
                  remarks: { type: 'string', example: 'FAQ Standard certified by Mandi Officer' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/QualityCheck' },
              },
            },
          },
        },
      },
    },
    '/api/officer/calculate': {
      post: {
        tags: ['Officer Operations Console'],
        summary: 'Calculate Guaranteed MSP & Final Settlement',
        security: [{ BearerAuth: [] }],
        description: 'Computes MSP rate multiplied by net weight, applies quality deductions/bonuses, and stores tamper-proof calculation.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['procurementId'],
                properties: {
                  procurementId: { type: 'string', example: 'proc-0001' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    baseRate: { type: 'number', example: 2275 },
                    netWeight: { type: 'number', example: 50 },
                    grossAmount: { type: 'number', example: 113750 },
                    deductions: { type: 'number', example: 0 },
                    netPayableAmount: { type: 'number', example: 113750 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/payments': {
      get: {
        tags: ['Payments & DBT Tracking'],
        summary: 'Query DBT Payments',
        security: [{ BearerAuth: [] }],
        description: 'Returns payments scoped by role (Farmers only see their own; Officers and Admins can audit centre settlements).',
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Payment' },
                },
              },
            },
          },
        },
      },
    },
    '/api/payments/{id}/process': {
      post: {
        tags: ['Payments & DBT Tracking'],
        summary: 'Settle DBT Payment via NPCI Gateway',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Payment settled with UTR reference and audit trail',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Payment' },
              },
            },
          },
        },
      },
    },
    '/api/analytics/kpis': {
      get: {
        tags: ['Executive Analytics'],
        summary: 'State-wide Mandi KPIs',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalFarmersRegistered: { type: 'number', example: 1250 },
                    totalProcurementVolumeTons: { type: 'number', example: 8450.2 },
                    totalDbtDisbursedCrores: { type: 'number', example: 19.22 },
                    averageMandiWaitReductionPercent: { type: 'number', example: 42.5 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/ai/query': {
      post: {
        tags: ['AI Vernacular Assistant'],
        summary: 'Bilingual AgriBot Consultation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: {
                  query: { type: 'string', example: 'मेरी गेहूं की एमएसपी दर और कतार की स्थिति क्या है?' },
                  language: { type: 'string', enum: ['en', 'hi'], example: 'hi' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    response: { type: 'string', example: '2026 सत्र के लिए गेहूं का न्यूनतम समर्थन मूल्य (MSP) ₹2,275 प्रति क्विंटल है।' },
                    confidence: { type: 'number', example: 0.96 },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /api/auth/login. Example: Bearer eyJhbGciOi...',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'usr-001' },
          name: { type: 'string', example: 'Rajesh Kumar' },
          phone: { type: 'string', example: 'farmer1' },
          role: { type: 'string', enum: ['FARMER', 'OFFICER', 'ADMIN'], example: 'FARMER' },
          language: { type: 'string', example: 'hi' },
        },
      },
      Farmer: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'farm-001' },
          farmerId: { type: 'string', example: 'KS-FARM-0001' },
          village: { type: 'string', example: 'Rampur' },
          district: { type: 'string', example: 'Lucknow' },
          state: { type: 'string', example: 'Uttar Pradesh' },
          landArea: { type: 'number', example: 8.5 },
          crops: { type: 'array', items: { type: 'string' }, example: ['WHEAT', 'PADDY'] },
          bankAccountMasked: { type: 'string', example: '••••••••4829' },
          bankName: { type: 'string', example: 'State Bank of India' },
        },
      },
      Centre: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'centre-001' },
          name: { type: 'string', example: 'Lucknow Central Mandi' },
          location: { type: 'string', example: 'Sector 4, Mandi Samiti' },
          district: { type: 'string', example: 'Lucknow' },
          state: { type: 'string', example: 'Uttar Pradesh' },
          capacity: { type: 'number', example: 120 },
          activeBays: { type: 'number', example: 4 },
          congestionLevel: { type: 'string', enum: ['GREEN', 'YELLOW', 'RED'], example: 'GREEN' },
        },
      },
      Slot: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'slot-001' },
          centreId: { type: 'string', example: 'centre-001' },
          date: { type: 'string', example: '2026-09-27' },
          timeStart: { type: 'string', example: '09:00' },
          timeEnd: { type: 'string', example: '11:00' },
          maxCapacity: { type: 'number', example: 20 },
          currentBookings: { type: 'number', example: 12 },
          status: { type: 'string', example: 'AVAILABLE' },
        },
      },
      Token: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'token-0001' },
          tokenNumber: { type: 'string', example: 'TKN-0001' },
          farmerId: { type: 'string', example: 'farm-001' },
          centreId: { type: 'string', example: 'centre-001' },
          status: { type: 'string', enum: ['ACTIVE', 'CALLED', 'SERVING', 'COMPLETED', 'CANCELLED'], example: 'ACTIVE' },
          queuePosition: { type: 'number', example: 3 },
          estimatedTime: { type: 'string', example: '09:45 AM' },
        },
      },
      Weighing: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'wgh-001' },
          procurementId: { type: 'string', example: 'proc-0001' },
          grossWeight: { type: 'number', example: 6200 },
          tareWeight: { type: 'number', example: 1200 },
          netWeight: { type: 'number', example: 5000 },
          scaleId: { type: 'string', example: 'WB-01' },
        },
      },
      QualityCheck: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'qc-001' },
          procurementId: { type: 'string', example: 'proc-0001' },
          crop: { type: 'string', example: 'WHEAT' },
          moistureContent: { type: 'number', example: 11.8 },
          foreignMatter: { type: 'number', example: 0.5 },
          damagedGrains: { type: 'number', example: 1.2 },
          grade: { type: 'string', example: 'A' },
          qualityResult: { type: 'string', example: 'ACCEPTED' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'pay-001' },
          procurementId: { type: 'string', example: 'proc-0001' },
          farmerId: { type: 'string', example: 'farm-001' },
          grossAmount: { type: 'number', example: 113750 },
          deductions: { type: 'number', example: 0 },
          netAmount: { type: 'number', example: 113750 },
          status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], example: 'COMPLETED' },
          utr: { type: 'string', example: '982499887766' },
          dbtReferenceId: { type: 'string', example: 'DBT-20260926-0001' },
        },
      },
    },
  },
};
