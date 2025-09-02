import axios from "axios";
import logger from "../config/logger.js";
import config from "../config/config.js";

/**
 * Base function to call OpenRouter API
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options for the API call
 * @returns {Promise<string>} AI response content
 */
const callOpenRouter = async (messages, options = {}) => {
  try {
    const {
      model = config.ai.openrouter.model,
      maxTokens = config.ai.openrouter.maxTokens,
      temperature = config.ai.openrouter.temperature,
      timeout = config.ai.openrouter.timeout,
    } = options;

    if (!config.ai.openrouter.apiKey) {
      throw new Error("OpenRouter API key is not configured");
    }

    logger.info("🤖 Calling OpenRouter API...", {
      model,
      messagesCount: messages.length,
      maxTokens,
      temperature,
    });

    const response = await axios.post(
      config.ai.openrouter.endpoint,
      {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${config.ai.openrouter.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://whatsapp-api.local",
          "X-Title": "WhatsApp API AI Assistant",
        },
        timeout,
      }
    );

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error("Invalid response from OpenRouter API");
    }

    const aiResponse = response.data.choices[0].message.content;

    logger.info("✅ OpenRouter API response received", {
      responseLength: aiResponse.length,
      tokensUsed: response.data.usage?.total_tokens || "unknown",
    });

    return aiResponse;
  } catch (error) {
    logger.error("❌ Error calling OpenRouter API:", {
      error: error.message,
      endpoint: config.ai.openrouter.endpoint,
      model: options.model || config.ai.openrouter.model,
    });
    throw new Error(`OpenRouter API failed: ${error.message}`);
  }
};

/**
 * Generate a response for status updates or general text generation
 * @param {string} prompt - The prompt for text generation
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Generated response
 */
const generateResponse = async (prompt, options = {}) => {
  const messages = [
    {
      role: "system",
      content:
        "Anda adalah asisten AI yang membantu menghasilkan respons yang sesuai dan profesional dalam bahasa Indonesia. Berikan respons yang jelas, informatif, dan sesuai konteks.",
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  return await callOpenRouter(messages, options);
};

/**
 * Generate JSON response based on prompt and schema
 * @param {string} prompt - The prompt for JSON generation
 * @param {Object} schema - Expected JSON schema (optional)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Generated JSON object
 */
const generateJSON = async (prompt, schema = null, options = {}) => {
  let systemPrompt =
    "Anda adalah asisten AI yang menghasilkan respons dalam format JSON yang valid. Pastikan output Anda selalu berupa JSON yang dapat di-parse.";

  if (schema) {
    systemPrompt += `\n\nSchema yang diharapkan:\n${JSON.stringify(
      schema,
      null,
      2
    )}`;
  }

  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  const response = await callOpenRouter(messages, options);

  try {
    // Try to parse the JSON response
    const jsonResponse = JSON.parse(response);
    return jsonResponse;
  } catch (parseError) {
    logger.warn(
      "⚠️ Failed to parse AI response as JSON, attempting to extract JSON..."
    );

    // Try to extract JSON from the response if it's wrapped in text
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (extractError) {
        throw new Error("AI response is not valid JSON");
      }
    }

    throw new Error("No valid JSON found in AI response");
  }
};

/**
 * Analyze and categorize text content
 * @param {string} text - Text to analyze
 * @param {Array} categories - List of possible categories
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Analysis result with category and confidence
 */
const analyzeText = async (text, categories = [], options = {}) => {
  const categoriesText =
    categories.length > 0
      ? `Pilih dari kategori berikut: ${categories.join(", ")}`
      : "Tentukan kategori yang paling sesuai";

  const prompt = `Analisis teks berikut dan berikan hasil dalam format JSON:

Teks: "${text}"

${categoriesText}

Format respons JSON:
{
  "category": "kategori_yang_dipilih",
  "confidence": 0.95,
  "summary": "ringkasan singkat teks",
  "keywords": ["kata", "kunci", "penting"],
  "sentiment": "positive/negative/neutral"
}`;

  return await generateJSON(prompt, null, options);
};

/**
 * Generate status update based on report content
 * @param {string} reportContent - The report content
 * @param {string} imageUrl - URL of associated image (optional)
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Generated status update
 */
const generateStatusUpdate = async (
  reportContent,
  imageUrl = null,
  options = {}
) => {
  let prompt = `Buatkan update status profesional berdasarkan laporan berikut:

Laporan: "${reportContent}"`;

  if (imageUrl) {
    prompt += `\nGambar terlampir: ${imageUrl}`;
  }

  prompt += `\n\nBuat status update yang:
1. Profesional dan informatif
2. Mencakup poin-poin penting dari laporan
3. Menggunakan bahasa Indonesia yang baik
4. Tidak lebih dari 200 kata
5. Menyertakan emoji yang sesuai`;

  return await generateResponse(prompt, options);
};

/**
 * Summarize long text content
 * @param {string} text - Text to summarize
 * @param {number} maxWords - Maximum words in summary
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Text summary
 */
const summarizeText = async (text, maxWords = 100, options = {}) => {
  const prompt = `Buatkan ringkasan dari teks berikut dalam maksimal ${maxWords} kata:

Teks: "${text}"

Ringkasan harus:
1. Mencakup poin-poin utama
2. Menggunakan bahasa Indonesia yang jelas
3. Tidak melebihi ${maxWords} kata
4. Tetap informatif dan akurat`;

  return await generateResponse(prompt, options);
};

/**
 * Generate structured report from unstructured text
 * @param {string} text - Unstructured text input
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Structured report object
 */
const generateStructuredReport = async (text, options = {}) => {
  const prompt = `Ubah teks laporan berikut menjadi format terstruktur dalam JSON:

Teks: "${text}"

Format JSON yang diharapkan:
{
  "title": "Judul laporan",
  "category": "Kategori masalah",
  "priority": "high/medium/low",
  "description": "Deskripsi detail",
  "location": "Lokasi kejadian (jika ada)",
  "timestamp": "Waktu kejadian (jika disebutkan)",
  "action_required": "Tindakan yang diperlukan",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  return await generateJSON(prompt, null, options);
};

/**
 * Check if OpenRouter API is configured and accessible
 * @returns {Promise<boolean>} True if API is accessible
 */
const checkAPIHealth = async () => {
  try {
    if (!config.ai.openrouter.apiKey) {
      logger.warn("⚠️ OpenRouter API key is not configured");
      return false;
    }

    // Simple test call
    const testResponse = await generateResponse("Test", { maxTokens: 10 });
    return testResponse && testResponse.length > 0;
  } catch (error) {
    logger.error("❌ OpenRouter API health check failed:", error.message);
    return false;
  }
};

export {
  callOpenRouter,
  generateResponse,
  generateJSON,
  analyzeText,
  generateStatusUpdate,
  summarizeText,
  generateStructuredReport,
  checkAPIHealth,
};
