import type { ClubMembership, User } from "@prisma/client";

export type ClubMembershipWithUser = ClubMembership & {
  user: User;
};