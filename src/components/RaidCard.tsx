import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCharacterProfile, type CharacterProfile } from "@/lib/lostark";
import { Loader2, Search, Plus, Trash2, Users, X, Sword } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface RaidParticipant {
  id: string;
  character: CharacterProfile | null;
}

export interface Raid {
  id: string;
  name: string;
  size: 4 | 8 | 16;
  participants: RaidParticipant[];
}

interface SortableParticipantProps {
  id: string;
  participant: RaidParticipant;
  onRemove: () => void;
}

function SortableParticipant({
  id,
  participant,
  onRemove,
}: SortableParticipantProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex justify-between items-center border p-3 rounded bg-card hover:bg-accent/50 cursor-grab active:cursor-grabbing h-[60px]",
        !participant.character && "border-dashed opacity-50 justify-center"
      )}
    >
      {participant.character ? (
        <>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">
                {participant.character.CharacterName}
              </div>
              <div className="text-xs text-gray-500 truncate align-center">
                {participant.character.CharacterClassName} |{" "}
                {participant.character.ItemAvgLevel} |{" "}
                <Sword className="inline h-3 w-3 mr-[2px]" />
                {participant.character.CombatPower}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation(); // Prevent drag start
              onRemove();
            }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on touch/click
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">Empty Slot</div>
      )}
    </div>
  );
}

interface RaidCardProps {
  raid: Raid;
  onUpdate: (updatedRaid: Raid) => void;
  onDelete: () => void;
}

export function RaidCard({ raid, onUpdate, onDelete }: RaidCardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = raid.participants.findIndex((p) => p.id === active.id);
      const newIndex = raid.participants.findIndex((p) => p.id === over.id);

      const newParticipants = arrayMove(raid.participants, oldIndex, newIndex);
      onUpdate({
        ...raid,
        participants: newParticipants,
      });
    }
  };

  // Search State (Local to this card)
  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<CharacterProfile | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setLoading(true);
    setError(null);
    setSearchResult(null);
    try {
      const data = await getCharacterProfile(searchName);
      if (data) {
        setSearchResult(data);
      } else {
        setError("Character not found");
      }
    } catch (err) {
      setError("Failed to fetch character");
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = () => {
    if (!searchResult) return;

    const emptyIndex = raid.participants.findIndex((p) => p.character === null);
    if (emptyIndex === -1 && raid.participants.length >= raid.size) {
      setError(`Raid is full (Max ${raid.size})`);
      return;
    }

    if (
      raid.participants.find(
        (p) =>
          p.character &&
          p.character.CharacterName === searchResult.CharacterName
      )
    ) {
      setError("Character already in raid");
      return;
    }

    const newParticipants = [...raid.participants];
    if (emptyIndex !== -1) {
      // Fill the first empty slot
      newParticipants[emptyIndex] = {
        ...newParticipants[emptyIndex],
        character: searchResult,
      };
    } else {
      setError(`Raid is full (Max ${raid.size})`);
      return;
    }

    onUpdate({
      ...raid,
      participants: newParticipants,
    });
    setSearchResult(null);
    setSearchName("");
  };

  const removeParticipant = (id: string) => {
    onUpdate({
      ...raid,
      participants: raid.participants.map((p) =>
        p.id === id ? { ...p, character: null } : p
      ),
    });
  };

  const handleRaidSizeChange = (size: 4 | 8 | 16) => {
    // When resizing, we need to adjust the array size
    let newParticipants = [...raid.participants];
    if (size > raid.size) {
      // Expand: add empty slots with new IDs
      const newSlots = Array.from({ length: size - raid.size }).map(() => ({
        id: crypto.randomUUID(),
        character: null,
      }));
      newParticipants = [...newParticipants, ...newSlots];
    } else {
      // Shrink: slice
      newParticipants = newParticipants.slice(0, size);
    }
    onUpdate({ ...raid, size, participants: newParticipants });
  };

  const handleNameChange = (name: string) => {
    onUpdate({ ...raid, name });
  };

  return (
    <Card className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
        onClick={onDelete}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader>
        <CardTitle>Raid Group</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-[10px]">
          {/* Raid Name */}
          <div className="space-y-2">
            <Label>Raid Name</Label>
            <Input
              placeholder="Enter raid name..."
              value={raid.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          {/* Raid Size */}
          <div className="space-y-2">
            <Label>Raid Size</Label>
            <Select
              value={raid.size.toString()}
              onValueChange={(value) =>
                handleRaidSizeChange(Number(value) as 4 | 8 | 16)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select raid size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 Players</SelectItem>
                <SelectItem value="8">8 Players</SelectItem>
                <SelectItem value="16">16 Players</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Add Participant ({raid.participants.length}/{raid.size})
            </Label>
            <div className="flex gap-[10px]">
              <div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Character Name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={loading}>
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Search />
                    )}
                  </Button>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>

              {searchResult && (
                <div className="border rounded p-2 flex justify-between items-center bg-secondary/10">
                  <div className="flex gap-[10px] items-center mr-[14px]">
                    <div className="font-bold">
                      {searchResult.CharacterName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {searchResult.CharacterClassName} (
                      {searchResult.ItemAvgLevel})
                    </div>
                  </div>
                  <Button onClick={addParticipant} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Participants List */}
        <div className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={raid.participants.map((p) => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid gap-4 grid-cols-4">
                {Array.from({ length: Math.ceil(raid.size / 4) }).map(
                  (_, partyIndex) => (
                    <div
                      key={partyIndex}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="font-semibold text-sm text-gray-500 mb-2">
                        Party {partyIndex + 1}
                      </div>
                      <div className="space-y-2">
                        {raid.participants
                          .slice(partyIndex * 4, (partyIndex + 1) * 4)
                          .map((p, i) => {
                            // globalIndex logic if needed for something else, but here we just render
                            // We use p.id for key and sortable id
                            return (
                              <SortableParticipant
                                key={p.id}
                                id={p.id}
                                participant={p}
                                onRemove={() => removeParticipant(p.id)}
                              />
                            );
                          })}
                      </div>
                    </div>
                  )
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </CardContent>
    </Card>
  );
}
