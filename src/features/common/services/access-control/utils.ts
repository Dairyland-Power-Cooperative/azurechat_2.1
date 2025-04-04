import {
  UserModel,
} from "@/features/auth-page/helpers";

/**
 * Checks if a user has access based on a list of access control group IDs
 * @param userGroups Array of group IDs the user belongs to
 * @param accessGroups Array of group IDs the with appropriate permissions
 * @returns boolean indicating whether user has access
 */
export const userHasGroupAccess = (
  userGroups: string[] = [],
  accessGroups: string[] = [],
): boolean => {
  if (!accessGroups || accessGroups.length === 0) return false;
  
  // Check if any of the user's groups are in the allowed groups
  return accessGroups.some(groupId => userGroups.includes(groupId));
};

export const userHasEditAccess = (
  currentUser : UserModel, 
  editAccessGroups: string[] = [],
  //isResourcePrivate: boolean = false,
  resourceOwnerId: string = "",
): boolean => {
  if (!currentUser) return false;
  
  // Check if the user is an admin
  if (currentUser.isAdmin) return true;

  // Resource owner can always edit
  if (resourceOwnerId === currentUser.email) return true;
  
  // Check if the user has access to edit the resource via group
  const hasEditAccess = userHasGroupAccess(currentUser.accessGroups, editAccessGroups);

  return hasEditAccess;
}

export const userHasViewAccess = (
  currentUser : UserModel, 
  viewAccessGroups: string[] = [],
  isResourcePrivate: boolean = false,
  resourceOwnerId: string = "",
): boolean => {
  if (!currentUser) return false;
  
  // If the resource is not private, anyone can view it
  if(!isResourcePrivate) return true;

  // Check if the user is an admin
  if (currentUser.isAdmin) return true;

  // Resource owner can always view
  if (resourceOwnerId === currentUser.email) return true;
  
  // Check if the user has access to view the private resource by group
  const hasViewAccess = userHasGroupAccess(currentUser.accessGroups, viewAccessGroups);

  return hasViewAccess;
}
      