import logger from "../config/logger.js";

// Generate random delay between min and max milliseconds
const randomDelay = (min = 1000, max = 3000) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Sleep function for delays
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Human-like typing speed calculation based on message length
const calculateTypingTime = (message) => {
  const baseTime = 1000; // Base typing time
  const wordsPerMinute = 40; // Average typing speed
  const words = message.split(" ").length;
  const typingTime = (words / wordsPerMinute) * 60 * 1000; // Convert to milliseconds

  // Add some randomness and ensure minimum/maximum bounds
  const randomFactor = 0.3; // 30% randomness
  const variation = typingTime * randomFactor * (Math.random() - 0.5);
  const finalTime = Math.max(
    1000,
    Math.min(8000, baseTime + typingTime + variation)
  );

  return Math.floor(finalTime);
};

// Generate random delays for human-like behavior
const getHumanTimings = (message) => {
  return {
    seenDelay: randomDelay(500, 1500), // Time to "see" the message
    typingDelay: calculateTypingTime(message), // Time to "type" response
    sendDelay: randomDelay(200, 800), // Small delay before sending
  };
};

export { randomDelay, sleep, calculateTypingTime, getHumanTimings };
