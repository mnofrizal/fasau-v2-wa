import logger from "../config/logger.js";

// Standard HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Success response handler
const sendSuccess = (
  res,
  data = null,
  message = "Success",
  statusCode = HTTP_STATUS.OK
) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null) {
    response.data = data;
  }

  logger.info(`✅ Success response: ${message}`, {
    statusCode,
    hasData: data !== null,
  });
  return res.status(statusCode).json(response);
};

// Error response handler
const sendError = (
  res,
  error,
  message = "An error occurred",
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  context = ""
) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  // Add error details in development mode
  if (process.env.NODE_ENV === "development" && error) {
    response.error = {
      message: error.message,
      stack: error.stack,
    };
  }

  // Log the error with context
  const logContext = context ? `[${context}]` : "";
  logger.error(`❌ Error response ${logContext}: ${message}`, {
    statusCode,
    error: error?.message,
    stack: error?.stack,
  });

  return res.status(statusCode).json(response);
};

// WhatsApp connection error handler
const sendConnectionError = (res, hasQR = false) => {
  const response = {
    success: false,
    message: "WhatsApp is not connected",
    hasQR,
    timestamp: new Date().toISOString(),
  };

  logger.warn("⚠️ WhatsApp connection error", { hasQR });
  return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json(response);
};

// Validation error handler
const sendValidationError = (
  res,
  message = "Validation failed",
  details = null
) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    response.details = details;
  }

  logger.warn(`⚠️ Validation error: ${message}`, { details });
  return res.status(HTTP_STATUS.BAD_REQUEST).json(response);
};

// Not found error handler
const sendNotFound = (res, resource = "Resource") => {
  const message = `${resource} not found`;
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  logger.warn(`⚠️ Not found: ${message}`);
  return res.status(HTTP_STATUS.NOT_FOUND).json(response);
};

// Async handler wrapper to catch errors automatically
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Response handler class for more complex scenarios
class ResponseHandler {
  constructor(res, context = "") {
    this.res = res;
    this.context = context;
  }

  success(data = null, message = "Success", statusCode = HTTP_STATUS.OK) {
    return sendSuccess(this.res, data, message, statusCode);
  }

  error(
    error,
    message = "An error occurred",
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR
  ) {
    return sendError(this.res, error, message, statusCode, this.context);
  }

  connectionError(hasQR = false) {
    return sendConnectionError(this.res, hasQR);
  }

  validationError(message = "Validation failed", details = null) {
    return sendValidationError(this.res, message, details);
  }

  notFound(resource = "Resource") {
    return sendNotFound(this.res, resource);
  }
}

export {
  HTTP_STATUS,
  sendSuccess,
  sendError,
  sendConnectionError,
  sendValidationError,
  sendNotFound,
  asyncHandler,
  ResponseHandler,
};
