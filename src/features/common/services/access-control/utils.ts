import { AccessControlEntry } from "./models";

/**
 * Checks if a user has access based on a list of access control entries
 * @param entries Access control entries to check against
 * @param userEmail User's email address
 * @param userGroups Array of group emails the user belongs to
 * @returns boolean indicating whether user has access
 */
export const hasAccess = (
  entries: AccessControlEntry[],
  userEmail: string,
  userGroups: string[] = []
): boolean => {
  if (!entries || entries.length === 0) return false;
  
  return entries.some(entry => 
    (entry.type === "INDIVIDUAL" && entry.value === userEmail) || 
    (entry.type === "GROUP" && userGroups.includes(entry.value))
  );
};

/**
 * Migrates older string-based access control data to the structured format
 * @param accessString Original string data (comma-separated or JSON string)
 * @returns Array of AccessControlEntry objects
 */
export const migrateAccessControlData = (accessString: string | AccessControlEntry[]): AccessControlEntry[] => {
  if (!accessString) return [];
  
  // If it's already an array of AccessControlEntry objects
  if (Array.isArray(accessString)) {
    return accessString;
  }
  
  // If it's a string, try to parse as JSON first
  if (typeof accessString === "string") {
    try {
      const parsed = JSON.parse(accessString);
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (typeof parsed === "string") {
        return convertCommaSeparatedToEntries(parsed);
      }
    } catch {
      // If JSON parsing fails, treat as comma-separated
      return convertCommaSeparatedToEntries(accessString);
    }
  }
  
  return [];
};

/**
 * Converts a comma-separated string of emails to AccessControlEntry objects
 */
const convertCommaSeparatedToEntries = (commaSeparated: string): AccessControlEntry[] => {
  if (!commaSeparated.trim()) return [];
  
  return commaSeparated
    .split(",")
    .map(email => email.trim())
    .filter(email => email)
    .map(email => ({
      id: crypto.randomUUID(),
      value: email,
      type: "INDIVIDUAL" as const
    }));
};