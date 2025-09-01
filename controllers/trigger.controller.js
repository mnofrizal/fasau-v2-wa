import {
  isTriggersEnabled,
  setTriggersEnabled,
  getTriggers,
} from "../services/whatsapp-trigger.service.js";
import logger from "../config/logger.js";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  asyncHandler,
} from "../utils/responseHandler.js";

// Get trigger configuration and status (read-only)
const getTriggerConfig = asyncHandler(async (req, res) => {
  try {
    const config = getTriggers();
    return sendSuccess(
      res,
      config,
      "Trigger configuration retrieved successfully"
    );
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to get trigger configuration",
      500,
      "getTriggerConfig"
    );
  }
});

// Enable or disable triggers globally
const setTriggerStatus = asyncHandler(async (req, res) => {
  const { enabled } = req.body;

  // Validate required fields
  if (typeof enabled !== "boolean") {
    return sendValidationError(res, "Field 'enabled' must be a boolean value");
  }

  try {
    const result = setTriggersEnabled(enabled);
    return sendSuccess(
      res,
      result,
      `Triggers ${enabled ? "enabled" : "disabled"} successfully`
    );
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to update trigger status",
      500,
      "setTriggerStatus"
    );
  }
});

export { getTriggerConfig, setTriggerStatus };
