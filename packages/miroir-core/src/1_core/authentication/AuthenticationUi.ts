export function nextPageWhenAuthGate(args: {
  enabled: boolean;
  hasToken: boolean;
  intended: string;
}): string {
  if (!args.enabled || args.hasToken) {
    return args.intended || "/?page=home";
  }
  const intended = args.intended || "/?page=home";
  return `/?page=login&return=${encodeURIComponent(intended)}`;
}

export function authorizationHeaders(token: string | undefined): Record<string, string> {
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}
