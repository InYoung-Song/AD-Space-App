/**
 * Native default: assume online. (Adding real connectivity detection here would
 * pull in @react-native-community/netinfo; the web build — where this matters
 * most — is handled by use-online.web.ts.)
 */
export function useOnline(): boolean {
  return true;
}
