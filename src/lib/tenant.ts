export function getTenantSlugFromHostname(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname.toLowerCase();
  
  // Get domain from environment
  const appDomain = import.meta.env.VITE_APP_DOMAIN || "univ.live";

  // LOCAL DEV SUPPORT
  if (hostname === "localhost") {
    const params = new URLSearchParams(window.location.search);
    return params.get("tenant");
  }

  const parts = hostname.split(".");
  const domainParts = appDomain.split(".");

  /**
   * For univ.live:
   *   Valid: abc-coaching.univ.live
   *   parts = ["abc-coaching", "univ", "live"]
   *   domainParts = ["univ", "live"]
   *
   * For example.com:
   *   Valid: abc-coaching.example.com
   *   parts = ["abc-coaching", "example", "com"]
   *   domainParts = ["example", "com"]
   */

  // Check if hostname ends with our domain
  const hostSuffix = parts.slice(-domainParts.length).join(".");
  
  if (hostSuffix !== appDomain) {
    return null; // Not our domain
  }

  // If same length, it's the main domain (www or apex)
  if (parts.length === domainParts.length) {
    return null;
  }

  const subdomain = parts[0];

  // Block www explicitly
  if (subdomain === "www") return null;

  return subdomain;
}