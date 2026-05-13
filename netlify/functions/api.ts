import serverless from 'serverless-http';
import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { createApp } from '../../backend/src/app.js';

const app = createApp();
const wrapped = serverless(app);

const FUNCTION_PREFIX = '/.netlify/functions/api';

export const handler: Handler = async (event, context): Promise<HandlerResponse> => {
  // PrismaClient keeps its connection pool alive between warm invocations.
  context.callbackWaitsForEmptyEventLoop = false;

  // Netlify forwards /api/... to /.netlify/functions/api/api/... — strip the
  // function prefix so Express sees the original /api/... path it routes on.
  const patched: HandlerEvent = {
    ...event,
    path: event.path.startsWith(FUNCTION_PREFIX)
      ? event.path.slice(FUNCTION_PREFIX.length) || '/'
      : event.path,
  };

  return (await wrapped(patched, context)) as HandlerResponse;
};
