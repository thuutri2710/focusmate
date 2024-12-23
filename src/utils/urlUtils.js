/**
 * Extracts the domain from a URL, removing 'www.' prefix if present
 * @param {string} url - The URL to extract domain from
 * @returns {string} The extracted domain
 */
export function extractDomain(url) {
  try {
    // Add protocol if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    console.log(url);
    const urlObj = new URL(url);
    // Remove www. and return domain
    return urlObj.host.replace(/^www\./, "");
  } catch (e) {
    // If URL is invalid, return as is
    return url;
  }
}
