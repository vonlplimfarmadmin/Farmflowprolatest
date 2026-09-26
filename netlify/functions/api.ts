import serverless from "serverless-http";
import { app, connectDB } from "../../server-app";

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  // CRITICAL: Tells Lambda to return the HTTP response immediately
  // without waiting for MongoDB background pool sockets to close
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectDB();
  } catch (err: any) {
    console.error("[Netlify Function] Database connection error:", err.message);
  }

  return serverlessHandler(event, context);
};
