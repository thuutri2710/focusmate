/**
 * Extracts the domain from a URL
 * @param url The URL to extract the domain from
 * @returns The domain (e.g., "example.com")
 */
export function extractDomain(url: string): string {
  try {
    // Handle empty or invalid URLs
    if (!url || url.trim() === '') {
      return '';
    }

    // Handle URLs that don't start with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const urlObj = new URL(url);
    let domain = urlObj.hostname;

    // Remove 'www.' prefix if present
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }

    return domain;
  } catch (error) {
    console.error('Error extracting domain:', error);
    return '';
  }
}

/**
 * Formats a URL for display (truncates if too long)
 * @param url The URL to format
 * @param maxLength Maximum length before truncation
 * @returns Formatted URL string
 */
export function formatUrlForDisplay(url: string, maxLength: number = 40): string {
  if (!url) return '';
  
  // Extract domain
  const domain = extractDomain(url);
  
  if (domain.length > maxLength) {
    return domain.substring(0, maxLength - 3) + '...';
  }
  
  return domain;
}

/**
 * Checks if a URL is valid
 * @param url The URL to validate
 * @returns Boolean indicating if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    // Handle URLs that don't start with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a domain pattern is valid
 * @param pattern Domain pattern to validate
 * @returns Boolean indicating if pattern is valid
 */
export function isValidDomainPattern(pattern: string): boolean {
  // Check if it's a RegExp pattern
  if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
    try {
      const patternBody = pattern.slice(1, pattern.lastIndexOf('/'));
      const patternFlags = pattern.slice(pattern.lastIndexOf('/') + 1);
      new RegExp(patternBody, patternFlags);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Check if it's a wildcard pattern
  if (pattern.includes('*') || pattern.includes('?')) {
    // Basic validation for wildcard patterns
    return /^[a-zA-Z0-9.*?-]+(\.[a-zA-Z0-9.*?-]+)*$/.test(pattern);
  }
  
  // Check if it's a normal domain
  return /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(pattern) ||
         // Allow wildcard subdomains
         /^\*\.([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(pattern);
}
