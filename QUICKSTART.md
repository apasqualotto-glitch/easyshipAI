# Quick Start: Integrating AI Agent into Your App

This guide will help you get the Shipping Agent up and running in minutes.

## Step 1: Install Missing Dependencies (if needed)

```bash
npm install jwt-decode jsonwebtoken
```

## Step 2: Add AI Agent to Your Pages

### Option A: Add to Calculator Page (Recommended)

**File**: `client/src/pages/calculator.tsx`

```tsx
import { ShippingAgentInterface } from '@/components/shipping-agent-interface';
import { useState } from 'react';

export default function Calculator() {
  const [extractedData, setExtractedData] = useState(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left side: Calculator form (existing) */}
      <div className="lg:col-span-3">
        <CalculatorForm initialData={extractedData} />
      </div>

      {/* Right side: AI Agent (new) */}
      <div className="lg:col-span-1">
        <ShippingAgentInterface
          onExtractedData={(details) => {
            console.log('Extracted data:', details);
            setExtractedData(details);
            // Auto-fill calculator if enough data
            if (details.origin && details.destination) {
              // Trigger calculator update
            }
          }}
        />
      </div>
    </div>
  );
}
```

### Option B: Add to Sidebar/Widget

```tsx
// In your layout or main app component
import { ShippingAgentInterface } from '@/components/shipping-agent-interface';

<aside className="fixed right-0 top-20 w-80 h-screen">
  <ShippingAgentInterface />
</aside>
```

## Step 3: Set Up Authentication (Optional but Recommended)

**File**: `client/src/hooks/useAuth.ts`

```typescript
import { useEffect, useState } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Try to get stored token
    const storedToken = localStorage.getItem('accessToken');

    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      return;
    }

    // Create anonymous session if no token
    createSession();
  }, []);

  const createSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: localStorage.getItem('userEmail') || undefined
        })
      });

      if (response.ok) {
        const { tokens } = await response.json();
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        setToken(tokens.accessToken);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setIsAuthenticated(false);
    }
  };

  return { isAuthenticated, token, createSession, logout };
}
```

**Use in App**:
```tsx
import { useAuth } from '@/hooks/useAuth';

export function App() {
  const { token } = useAuth();

  return (
    // Your app with AI Agent
    <ShippingAgentInterface />
  );
}
```

## Step 4: Intercept API Calls with Auth Token

**File**: `client/src/lib/api.ts`

```typescript
// Create an API client that automatically includes auth token
export const apiClient = {
  async fetch(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('accessToken');

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401 - token expired
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/';
    }

    return response;
  },

  async get(url: string) {
    return this.fetch(url, { method: 'GET' });
  },

  async post(url: string, data: any) {
    return this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async put(url: string, data: any) {
    return this.fetch(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};
```

**Use instead of fetch**:
```typescript
// Instead of: fetch('/api/calculate-quote', ...)
// Use: apiClient.post('/api/calculate-quote', data)

const quote = await apiClient.post('/api/calculate-quote', {
  originPortId: '1',
  destinationId: '9',
  containerType: '20ft',
  weight: 1500,
  volume: 28
});
```

## Step 5: Test the AI Agent

### Test Guide Mode:
```
User: "I'm new to shipping, can you guide me through it?"
Agent: "Perfect! Let me walk you through step-by-step..."
   → Asks about origin country
   → Asks about destination in SA
   → Asks about container size
   → Etc.
```

### Test Analyzer Mode:
```
User: "I'm shipping laptops from China to Johannesburg, 20ft container"
Agent: "Let me analyze that for you..."
   → Shows Incoterm recommendations
   → Suggests optimal carrier
   → Calculates savings
```

### Test Documentor Mode:
```
User: "What documents do I need?"
Agent: "Here's exactly what you need..."
   → Lists required documents
   → Shows estimated costs
   → Tells you where to get each
```

## Step 6: Monitor API Performance

**Check Cache Statistics**:
```typescript
// In browser console
fetch('/api/exchange-rate/stats')
  .then(r => r.json())
  .then(data => console.log('Exchange rate cache:', data));
```

## Step 7: Deploy

### Environment Variables for Production:

```bash
# Authentication
JWT_SECRET=your-secret-key-change-this

# Logging
LOG_DIR=./logs
LOG_CONSOLE=false        # Disable noisy console in production
LOG_FILE=true
LOG_JSON=true            # Enable JSON for log aggregation

# Caching
DEBUG_CACHE=false

# API
NODE_ENV=production
API_BASE_URL=https://yourdomain.com
```

### Docker Setup:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
ENV JWT_SECRET=${JWT_SECRET}
ENV LOG_DIR=/app/logs

RUN mkdir -p /app/logs

EXPOSE 5000

CMD ["npm", "start"]
```

## Troubleshooting

### AI Agent Not Responding
```
✓ Check browser console for errors
✓ Verify /api/shipping-agent endpoint exists
✓ Check network tab for 401/403 responses
✓ Ensure auth token is valid
```

### Rate Limit Errors
```
✓ Wait 1 minute and retry
✓ Or refresh page to get new session
✓ Production: Use different endpoint for different user segments
```

### Exchange Rates Not Caching
```
✓ Check LOG_CACHE=true output
✓ Verify cache-service.ts is imported
✓ Should see "(cached)" in rate source after first call
```

### Logs Not Appearing
```
✓ Set LOG_CONSOLE=true for development
✓ Set LOG_FILE=true to write files
✓ Check LOG_DIR directory exists and is writable
✓ Review logs in ./logs directory
```

## Next Steps

1. ✅ Deploy to staging and test with real users
2. ✅ Monitor logs for errors in real scenarios
3. ✅ Gather user feedback on AI agent helpfulness
4. ✅ Fine-tune system prompts based on feedback
5. ✅ Consider moving tariff data to database
6. ✅ Split calculator component for better UX

## Support Resources

- **IMPROVEMENTS.md**: Comprehensive guide to all improvements
- **business-logic.test.ts**: 40+ test cases showing expected behavior
- **shipping-agent.ts**: Detailed comments on agent implementation
- **cache-service.ts**: Exchange rate caching documentation

---

**You're all set!** The AI Agent will help your first-time shippers understand container shipping, customs, and make better decisions.
