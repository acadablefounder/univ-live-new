export function getTenantSlugFromHostname(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname.toLowerCase();

  // ------------------------
  // LOCAL DEV SUPPORT
  // ------------------------
  if (hostname === "localhost") {
    const params = new URLSearchParams(window.location.search);
    return params.get("tenant");
  }

  const parts = hostname.split(".");

  /**
   * Valid tenant domain:
   *   acadable-shivpuri.univ.live
   *
   * parts = ["acadable-shivpuri", "univ", "live"]
   */
  if (
    parts.length === 3 &&
    parts[1] === "univ" &&
    parts[2] === "live"
  ) {
    const subdomain = parts[0];

    // explicitly block www
    if (subdomain === "www") return null;

    return subdomain;
  }

  // Everything else is NOT a tenant domain
  return null;
}
