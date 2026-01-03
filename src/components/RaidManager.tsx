import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RaidCard, type Raid } from "./RaidCard";

export function RaidManager() {
  const [raids, setRaids] = useState<Raid[]>([]);

  useEffect(() => {
    const savedRaids = localStorage.getItem("loa-mint-raids");
    if (savedRaids) {
      try {
        const parsed = JSON.parse(savedRaids);
        // Simple migration check: if participants are just profiles (old structure) or have id/character
        // This is a rough heuristic. A better way is to check the first participant structure if exists.
        // Or simply force migrate.

        const migratedRaids = parsed.map((raid: any) => {
          // Ensure raid size is valid
          const size = raid.size || 4;

          // Check if participants is the old array of profiles/nulls
          // Old: [ {CharacterName...} | null, ... ]
          // New: [ { id: string, character: {CharacterName...} | null }, ... ]

          let participants = raid.participants || [];

          // If array is empty, fill it
          if (participants.length === 0) {
            participants = Array.from({ length: size }).map(() => ({
              id: crypto.randomUUID(),
              character: null,
            }));
          }
          // If first item is not having 'id' and 'character' property, it might be old structure
          else if (
            !participants[0].hasOwnProperty("id") ||
            !participants[0].hasOwnProperty("character")
          ) {
            // Migrate
            participants = participants.map((p: any) => ({
              id: crypto.randomUUID(),
              character: p,
            }));
            // Fill remaining slots if any
            if (participants.length < size) {
              const extra = Array.from({
                length: size - participants.length,
              }).map(() => ({
                id: crypto.randomUUID(),
                character: null,
              }));
              participants = [...participants, ...extra];
            }
          }

          return {
            ...raid,
            participants,
          };
        });

        setRaids(migratedRaids);
      } catch (e) {
        console.error("Failed to parse raids", e);
      }
    } else {
      // Try to migrate old single raid state
      const oldState = localStorage.getItem("loa-mint-raid-state");
      if (oldState) {
        try {
          const parsed = JSON.parse(oldState);
          const size = parsed.raidSize || 4;
          const oldParticipants = parsed.participants || [];

          const newParticipants = oldParticipants.map((p: any) => ({
            id: crypto.randomUUID(),
            character: p,
          }));

          // Fill rest
          if (newParticipants.length < size) {
            const extra = Array.from({
              length: size - newParticipants.length,
            }).map(() => ({
              id: crypto.randomUUID(),
              character: null,
            }));
            newParticipants.push(...extra);
          }

          const initialRaid: Raid = {
            id: crypto.randomUUID(),
            name: parsed.raidName || "My Raid",
            size: size,
            participants: newParticipants,
          };
          setRaids([initialRaid]);
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("loa-mint-raids", JSON.stringify(raids));
  }, [raids]);

  const addRaid = () => {
    const newRaid: Raid = {
      id: crypto.randomUUID(),
      name: "",
      size: 4,
      participants: Array.from({ length: 4 }).map(() => ({
        id: crypto.randomUUID(),
        character: null,
      })),
    };
    setRaids([...raids, newRaid]);
  };

  const updateRaid = (updatedRaid: Raid) => {
    setRaids(raids.map((r) => (r.id === updatedRaid.id ? updatedRaid : r)));
  };

  const deleteRaid = (id: string) => {
    setRaids(raids.filter((r) => r.id !== id));
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6">
      <div className="flex justify-end items-center">
        <Button onClick={addRaid}>
          <Plus className="mr-2 h-4 w-4" /> New Raid
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {raids.map((raid) => (
          <RaidCard
            key={raid.id}
            raid={raid}
            onUpdate={updateRaid}
            onDelete={() => deleteRaid(raid.id)}
          />
        ))}
      </div>

      {raids.length === 0 && (
        <div className="text-center p-12 border border-dashed rounded-lg text-gray-500">
          <p>No active raids. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
