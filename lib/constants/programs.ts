import type { ProgramType, ProgramItemType } from "@/lib/db/schema";

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  sacrament_meeting: "Sacrament Meeting",
  baptism: "Baptism",
  stake_conference: "Stake Conference",
  ward_conference: "Ward Conference",
  seminary_graduation: "Seminary Graduation",
  funeral: "Funeral Service",
  other: "Meeting",
};

export const PROGRAM_ITEM_TYPE_LABELS: Record<ProgramItemType, string> = {
  hymn: "Hymn",
  prayer: "Prayer",
  speaker: "Speaker",
  musical_number: "Musical Number",
  sacrament: "Sacrament",
  text: "Text",
  divider: "Divider",
  scripture: "Scripture",
};

export const PROGRAM_ICONS = {
  angel_moroni: "Angel Moroni",
  temple: "Temple",
  ctr: "CTR Shield",
} as const;

export type ProgramIconKey = keyof typeof PROGRAM_ICONS;

export type ItemTemplate = {
  type: ProgramItemType;
  label: string;
  detail?: string;
  secondaryDetail?: string;
  isCongregalional?: boolean;
};

export const PROGRAM_TEMPLATES: Record<ProgramType, ItemTemplate[]> = {
  sacrament_meeting: [
    { type: "text", label: "Presiding", detail: "" },
    { type: "text", label: "Conducting", detail: "" },
    { type: "text", label: "Organist", detail: "" },
    { type: "text", label: "Chorister", detail: "" },
    { type: "divider", label: "" },
    { type: "text", label: "Prelude Music", detail: "" },
    { type: "hymn", label: "Opening Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Invocation", detail: "" },
    { type: "text", label: "Ward Business", detail: "" },
    { type: "hymn", label: "Sacrament Hymn", detail: "", isCongregalional: true },
    { type: "sacrament", label: "Administration of the Sacrament" },
    { type: "speaker", label: "Speaker", detail: "", secondaryDetail: "" },
    { type: "musical_number", label: "Musical Number", detail: "", secondaryDetail: "" },
    { type: "speaker", label: "Speaker", detail: "", secondaryDetail: "" },
    { type: "hymn", label: "Closing Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Benediction", detail: "" },
    { type: "text", label: "Postlude Music", detail: "" },
  ],
  baptism: [
    { type: "text", label: "Presiding", detail: "" },
    { type: "text", label: "Conducting", detail: "" },
    { type: "text", label: "Organist", detail: "" },
    { type: "divider", label: "" },
    { type: "text", label: "Prelude Music", detail: "" },
    { type: "hymn", label: "Opening Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Invocation", detail: "" },
    { type: "speaker", label: "Talk on Baptism", detail: "" },
    { type: "musical_number", label: "Musical Number", detail: "", secondaryDetail: "" },
    { type: "text", label: "Baptism of", detail: "" },
    { type: "speaker", label: "Talk on the Holy Ghost", detail: "" },
    { type: "text", label: "Confirmation of", detail: "" },
    { type: "hymn", label: "Closing Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Benediction", detail: "" },
  ],
  stake_conference: [
    { type: "text", label: "Presiding", detail: "" },
    { type: "text", label: "Conducting", detail: "" },
    { type: "text", label: "Organist", detail: "" },
    { type: "text", label: "Chorister", detail: "" },
    { type: "divider", label: "" },
    { type: "hymn", label: "Opening Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Invocation", detail: "" },
    { type: "musical_number", label: "Choir Number", detail: "", secondaryDetail: "" },
    { type: "speaker", label: "Speaker", detail: "", secondaryDetail: "" },
    { type: "speaker", label: "Speaker", detail: "", secondaryDetail: "" },
    { type: "musical_number", label: "Musical Number", detail: "", secondaryDetail: "" },
    { type: "speaker", label: "Speaker", detail: "", secondaryDetail: "" },
    { type: "hymn", label: "Closing Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Benediction", detail: "" },
  ],
  ward_conference: [
    { type: "text", label: "Presiding", detail: "" },
    { type: "text", label: "Conducting", detail: "" },
    { type: "text", label: "Organist", detail: "" },
    { type: "text", label: "Chorister", detail: "" },
    { type: "divider", label: "" },
    { type: "hymn", label: "Opening Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Invocation", detail: "" },
    { type: "text", label: "Ward Business", detail: "" },
    { type: "hymn", label: "Sacrament Hymn", detail: "", isCongregalional: true },
    { type: "sacrament", label: "Administration of the Sacrament" },
    { type: "speaker", label: "Speaker", detail: "", secondaryDetail: "" },
    { type: "speaker", label: "Speaker", detail: "", secondaryDetail: "" },
    { type: "hymn", label: "Closing Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Benediction", detail: "" },
  ],
  seminary_graduation: [
    { type: "text", label: "Presiding", detail: "" },
    { type: "text", label: "Conducting", detail: "" },
    { type: "text", label: "Organist", detail: "" },
    { type: "divider", label: "" },
    { type: "text", label: "Prelude Music", detail: "" },
    { type: "hymn", label: "Opening Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Invocation", detail: "" },
    { type: "musical_number", label: "Musical Number", detail: "", secondaryDetail: "" },
    { type: "speaker", label: "Welcome Remarks", detail: "" },
    { type: "speaker", label: "Speaker", detail: "", secondaryDetail: "" },
    { type: "text", label: "Presentation of Diplomas", detail: "" },
    { type: "speaker", label: "Graduating Student Remarks", detail: "" },
    { type: "hymn", label: "Closing Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Benediction", detail: "" },
    { type: "text", label: "Postlude Music", detail: "" },
  ],
  funeral: [
    { type: "text", label: "Presiding", detail: "" },
    { type: "text", label: "Conducting", detail: "" },
    { type: "text", label: "Organist", detail: "" },
    { type: "divider", label: "" },
    { type: "text", label: "Prelude Music", detail: "" },
    { type: "hymn", label: "Opening Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Invocation", detail: "" },
    { type: "musical_number", label: "Musical Number", detail: "", secondaryDetail: "" },
    { type: "speaker", label: "Remarks", detail: "" },
    { type: "speaker", label: "Speaker", detail: "", secondaryDetail: "" },
    { type: "musical_number", label: "Musical Number", detail: "", secondaryDetail: "" },
    { type: "speaker", label: "Speaker", detail: "", secondaryDetail: "" },
    { type: "hymn", label: "Closing Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Benediction", detail: "" },
    { type: "divider", label: "" },
    { type: "prayer", label: "Dedicatory Prayer", detail: "" },
  ],
  other: [
    { type: "text", label: "Presiding", detail: "" },
    { type: "text", label: "Conducting", detail: "" },
    { type: "divider", label: "" },
    { type: "hymn", label: "Opening Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Invocation", detail: "" },
    { type: "speaker", label: "Speaker", detail: "", secondaryDetail: "" },
    { type: "hymn", label: "Closing Hymn", detail: "", isCongregalional: true },
    { type: "prayer", label: "Benediction", detail: "" },
  ],
};
