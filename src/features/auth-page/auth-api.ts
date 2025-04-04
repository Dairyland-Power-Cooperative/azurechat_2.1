import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { Provider } from "next-auth/providers/index";
import { hashValue } from "./helpers";
import { image } from "@markdoc/markdoc/dist/src/schema";
import { access } from "fs";

const configureIdentityProvider = () => {
  const providers: Array<Provider> = [];

  const adminEmails = process.env.ADMIN_EMAIL_ADDRESS?.split(",").map((email) =>
    email.toLowerCase().trim()
  );

  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push(
      GitHubProvider({
        clientId: process.env.AUTH_GITHUB_ID!,
        clientSecret: process.env.AUTH_GITHUB_SECRET!,
        async profile(profile) {
          const image = await fetchProfilePicture(profile.avatar_url, null);
          const newProfile = {
            ...profile,
            isAdmin: adminEmails?.includes(profile.email.toLowerCase()),
            image: image,
            accessGroups: [],
          };
          console.log("GitHub profile:", newProfile);
          return newProfile;
        },
      })
    );
  }

  if (
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  ) {
    providers.push(
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID!,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
        tenantId: process.env.AZURE_AD_TENANT_ID!,
        authorization: {
          params: {
            scope: "openid profile User.Read GroupMember.Read.All", 
          },
        },
        async profile(profile, tokens) {
          const email = profile.email || profile.preferred_username || "";
          const image = await fetchProfilePicture(`https://graph.microsoft.com/v1.0/me/photos/48x48/$value`, tokens.access_token);
          const groups = await fetchUserGroups(tokens.access_token);
          console.log("groups:", groups);
          const accessGroups = groups.map((group) => group.toLowerCase().trim()) || [];
          console.log("Access groups:", accessGroups);
          const newProfile = {
            ...profile,
            email,
            id: profile.sub,
            isAdmin:
              adminEmails?.includes(profile.email?.toLowerCase()) ||
              adminEmails?.includes(profile.preferred_username?.toLowerCase()),
            image: image,
            accessGroups: accessGroups || [],
          };
          console.log("Azure AD profile:", newProfile);
          return newProfile;
        },
      })
    );
  }

  // If we're in local dev, add a basic credential provider option as well
  // (Useful when a dev doesn't have access to create app registration in their tenant)
  // This currently takes any username and makes a user with it, ignores password
  // Refer to: https://next-auth.js.org/configuration/providers/credentials
  if (process.env.NODE_ENV === "development") {
    providers.push(
      CredentialsProvider({
        name: "localdev",
        credentials: {
          username: { label: "Username", type: "text", placeholder: "dev" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials, req): Promise<any> {
          // You can put logic here to validate the credentials and return a user.
          // We're going to take any username and make a new user with it
          // Create the id as the hash of the email as per userHashedId (helpers.ts)
          const username = credentials?.username || "dev";
          const email = username + "@localhost";
          const user = {
            id: hashValue(email),
            name: username,
            email: email,
            isAdmin: adminEmails?.includes(email),
            image: "",
            accessGroups: [],
          };
          console.log(
            "=== DEV USER LOGGED IN:\n",
            JSON.stringify(user, null, 2,
            )
          );
          return user;
        },
      })
    );
  }

  return providers;
};

export const fetchProfilePicture = async (profilePictureUrl: string, accessToken: any): Promise<any> => {
  console.log("Fetching profile picture...");
  var image = null
  const profilePicture = await fetch(
    profilePictureUrl,
    accessToken && {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (profilePicture.ok) {
    console.log("Profile picture fetched successfully.");
    const pictureBuffer = await profilePicture.arrayBuffer();
    const pictureBase64 = Buffer.from(pictureBuffer).toString("base64");
    image = `data:image/jpeg;base64,${pictureBase64}`;
  }
  else {
    console.error("Failed to fetch profile picture:", profilePictureUrl, profilePicture.statusText);
  }
  return image;
};

export const fetchUserGroups = async (accessToken: any): Promise<string[]> => {
  console.log("Fetching user groups...");
  var url = 'https://graph.microsoft.com/v1.0/me/transitiveMemberOf?$select=id,displayName,mail,mailEnabled,securityEnabled'
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      //console.debug("User groups data:", data);
       // Filter for mail-enabled groups and extract email addresses
      const mailGroups = data.value
        //.filter((group: any) => group.mailEnabled && group.mail)
        .map((group: any) => group.id);

      console.log("User groups fetched successfully.");
      return mailGroups;
    } else {
      console.error('Failed to fetch user groups:', response.statusText);
      return [];
    }

  } catch (error) {
    console.error('Failed to fetch user groups:', error);
    return [];
  }
}

export const options: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [...configureIdentityProvider()],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.isAdmin) {
        token.isAdmin = user.isAdmin;
      }
      if(user?.accessGroups) {
        token.accessGroups = (user.accessGroups as string[]) || [];
      }
      return token;
    },
    async session({ session, token, user }) {
      session.user.isAdmin = token.isAdmin as boolean;
      session.user.accessGroups = (token.accessGroups as string[]) || [];
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};

export const handlers = NextAuth(options);
