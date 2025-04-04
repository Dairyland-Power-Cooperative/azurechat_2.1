import { DefaultSession } from "next-auth";

// https://next-auth.js.org/getting-started/typescript#module-augmentation

declare module "next-auth" {
  interface Session {
    user: {
      isAdmin: boolean;
      accessGroups: string[];
    } & DefaultSession["user"];
  }

  interface Token {
    isAdmin: boolean;
    accessGroups: string[];
  }

  interface User {
    isAdmin: boolean;
    accessGroups: string[];
  }
}
