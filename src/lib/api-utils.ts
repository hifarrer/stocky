import { NextResponse } from 'next/server';
import { APIError } from './errors';

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

export function handleAPIError(error: unknown): NextResponse<ErrorResponse> {
  const timestamp = new Date().toISOString();
  const requestId = generateRequestId();

  // Log error for monitoring
  console.error('[API Error]', {
    error,
    timestamp,
    requestId,
    stack: error instanceof Error ? error.stack : undefined,
  });

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp,
        requestId,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    // Handle known Error types
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          timestamp,
          requestId,
        },
        { status: 429 }
      );
    }

    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Please check your API key.',
          code: 'UNAUTHORIZED',
          timestamp,
          requestId,
        },
        { status: 401 }
      );
    }

    if (error.message.includes('not found') || error.message.includes('404')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resource not found.',
          code: 'NOT_FOUND',
          timestamp,
          requestId,
        },
        { status: 404 }
      );
    }

    if (error.message.includes('timeout')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request timeout. Please try again.',
          code: 'TIMEOUT',
          timestamp,
          requestId,
        },
        { status: 408 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'An unexpected error occurred.',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? { originalError: error.message } : undefined,
        timestamp,
        requestId,
      },
      { status: 500 }
    );
  }

  // Unknown error type
  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
      timestamp,
      requestId,
    },
    { status: 500 }
  );
}

export function validateRequiredParams(
  params: Record<string, unknown>,
  required: string[]
): void {
  for (const param of required) {
    if (!params[param]) {
      throw new APIError(
        `Missing required parameter: ${param}`,
        400,
        'MISSING_PARAMETER',
        { parameter: param }
      );
    }
  }
}

export function validateNumericParam(
  value: string | null,
  paramName: string,
  min?: number,
  max?: number
): number {
  if (!value) {
    throw new APIError(
      `Missing required numeric parameter: ${paramName}`,
      400,
      'MISSING_PARAMETER',
      { parameter: paramName }
    );
  }

  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    throw new APIError(
      `Invalid numeric value for parameter: ${paramName}`,
      400,
      'INVALID_PARAMETER',
      { parameter: paramName, value }
    );
  }

  if (min !== undefined && numValue < min) {
    throw new APIError(
      `Parameter ${paramName} must be at least ${min}`,
      400,
      'PARAMETER_OUT_OF_RANGE',
      { parameter: paramName, value: numValue, min }
    );
  }

  if (max !== undefined && numValue > max) {
    throw new APIError(
      `Parameter ${paramName} must be at most ${max}`,
      400,
      'PARAMETER_OUT_OF_RANGE',
      { parameter: paramName, value: numValue, max }
    );
  }

  return numValue;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Rate limiting utilities
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    const resetTime = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime };
  }
  
  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  current.count++;
  rateLimitMap.set(key, current);
  
  return { 
    allowed: true, 
    remaining: limit - current.count, 
    resetTime: current.resetTime 
  };
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Cleanup every minute