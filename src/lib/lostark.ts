import {
  CharacterProfileSchema,
  type CharacterProfile,
} from "./character-schema";

const BASE_URL = "https://developer-lostark.game.onstove.com";

export type { CharacterProfile };

export async function getCharacterProfile(
  characterName: string
): Promise<CharacterProfile | null> {
  const token = import.meta.env.PUBLIC_LOA_API_KEY;

  if (!token) {
    throw new Error("Lost Ark API Key is missing");
  }

  try {
    const response = await fetch(
      `${BASE_URL}/armories/characters/${encodeURIComponent(
        characterName
      )}/profiles`,
      {
        method: "GET",
        headers: {
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate the response with Zod schema
    const validatedData = CharacterProfileSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error("Failed to fetch character profile:", error);
    throw error;
  }
}
