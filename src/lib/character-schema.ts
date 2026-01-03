import { z } from "zod";

// Stat schema
export const StatSchema = z.object({
  Type: z.string(),
  Value: z.string(),
  Tooltip: z.array(z.string()),
});

// Tendency schema
export const TendencySchema = z.object({
  Type: z.string(),
  Point: z.number(),
  MaxPoint: z.number(),
});

// Decorations schema
export const DecorationsSchema = z.object({
  Symbol: z.string().nullable(),
  Emblems: z.string().nullable(),
});

// Main Character Profile schema
export const CharacterProfileSchema = z.object({
  CharacterImage: z.string(),
  ExpeditionLevel: z.number(),
  TownLevel: z.number(),
  TownName: z.string(),
  Title: z.string().nullable(),
  GuildMemberGrade: z.string(),
  GuildName: z.string(),
  UsingSkillPoint: z.number(),
  TotalSkillPoint: z.number(),
  Stats: z.array(StatSchema),
  Tendencies: z.array(TendencySchema),
  CombatPower: z.string(),
  Decorations: DecorationsSchema,
  HonorPoint: z.number(),
  ServerName: z.string(),
  CharacterName: z.string(),
  CharacterLevel: z.number(),
  CharacterClassName: z.string(),
  ItemAvgLevel: z.string(),
});

// Inferred TypeScript types
export type Stat = z.infer<typeof StatSchema>;
export type Tendency = z.infer<typeof TendencySchema>;
export type Decorations = z.infer<typeof DecorationsSchema>;
export type CharacterProfile = z.infer<typeof CharacterProfileSchema>;

// Helper function to parse and validate character data
export function parseCharacterProfile(data: unknown): CharacterProfile {
  return CharacterProfileSchema.parse(data);
}

// Helper function for safe parsing (returns success/error)
export function safeParseCharacterProfile(data: unknown) {
  return CharacterProfileSchema.safeParse(data);
}
