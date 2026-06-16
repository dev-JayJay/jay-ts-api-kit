import { DomainError } from '../../domain/errors/DomainError';

interface ErrorContract {
  statusCode: number;
  code: string;
  message: string;
  details: Record<string, unknown>;
}

export const normalizeErrorContract = (error: unknown): ErrorContract => {
  if (error instanceof DomainError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details ?? {},
    };
  }

  if (error instanceof SyntaxError) {
    return {
      statusCode: 400,
      code: 'INVALID_JSON',
      message: 'Invalid request body',
      details: {},
    };
  }

  return {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    details: {},
  };
};
