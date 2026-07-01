import { FocusArea, AgeBand } from "@/lib/games/types";

export type ActiveProfile = {
  id: string;
  displayName: string;
  ageBand: AgeBand;
  avatar: string | null;
  focusAreas: FocusArea[];
};

export type CreateProfileInput = {
  displayName: string;
  ageBand: AgeBand;
  focusAreas: FocusArea[];
  parentEmail?: string;
  /** Parent attests they consent to data collection + AI processing. */
  consent: boolean;
};
