/**
 * Shared API utility functions for the application
 * This centralizes common API functionality to avoid duplication
 */
import axios from "axios";

/**
 * Make a request with retry mechanism
 * @param {Object} options - Request options
 * @param {string} options.url - Request URL
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.headers={}] - Request headers
 * @param {any} [options.data=null] - Request body
 * @param {number} [options.maxRedirects=5] - Maximum number of redirects
 * @param {number} [options.timeout=15000] - Request timeout in ms
 * @param {number} [options.retryCount=3] - Maximum number of retry attempts
 * @returns {Promise<Object>} - Response data
 */
export async function makeRequestWithRetry({
  url,
  method = "GET",
  headers = {},
  data = null,
  maxRedirects = 5,
  timeout = 15000,
  retryCount = 3,
}) {
  let lastError = null;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const response = await axios({
        url,
        method: method.toUpperCase(),
        headers,
        data: method !== "GET" ? data : undefined,
        responseType: "arraybuffer",
        maxRedirects,
        timeout,
        validateStatus: null,
        withCredentials: false,
      });

      // Process response
      return processResponse(response);
    } catch (error) {
      lastError = error;
      console.warn(
        `Attempt ${attempt + 1}/${retryCount} failed:`,
        error.message
      );

      if (attempt < retryCount - 1) {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
        continue;
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

/**
 * Process axios response
 * @param {Object} response - Axios response
 * @returns {Object} - Processed response
 */
export function processResponse(response) {
  const contentType = response.headers["content-type"] || "";
  const isJson = contentType.includes("application/json");
  const isText = contentType.includes("text/");
  const isHtml = contentType.includes("text/html");
  const isXml =
    contentType.includes("application/xml") || contentType.includes("text/xml");

  let data;
  try {
    if (isJson) {
      data = JSON.parse(response.data.toString("utf-8"));
    } else if (isText || isHtml || isXml) {
      data = response.data.toString("utf-8");
    } else {
      // Return as base64 for binary data
      data = response.data.toString("base64");
    }
  } catch (error) {
    console.error("Error processing response:", error);
    data = response.data;
  }

  return {
    data,
    status: response.status,
    headers: response.headers,
    contentType,
  };
}

/**
 * Prepare safe headers for requests
 * @param {Object} headers - Original headers
 * @param {string} url - Target URL
 * @param {boolean} skipCache - Whether to skip cache
 * @returns {Object} - Safe headers
 */
export function prepareSafeHeaders(headers = {}, url, skipCache = false) {
  // Start with default headers
  const safeHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    ...headers,
  };

  // Add referer if it's a valid URL
  try {
    const urlObj = new URL(url);
    safeHeaders["Referer"] = `${urlObj.protocol}//${urlObj.host}/`;
  } catch (e) {
    // Invalid URL, skip referer
  }

  // Skip cache if requested
  if (skipCache) {
    safeHeaders["Cache-Control"] = "no-cache";
    safeHeaders["Pragma"] = "no-cache";
  }

  return safeHeaders;
}
