import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getCharacterProfile, type CharacterProfile } from "@/lib/lostark";
import { Loader2, Search, Plus, Trash2 } from "lucide-react";

export function CharacterSearch() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CharacterProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedCharacters, setSavedCharacters] = useState<CharacterProfile[]>(
    []
  );

  useEffect(() => {
    const saved = localStorage.getItem("loa-mint-characters");
    if (saved) {
      try {
        setSavedCharacters(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved characters", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "loa-mint-characters",
      JSON.stringify(savedCharacters)
    );
  }, [savedCharacters]);

  const handleSearch = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getCharacterProfile(name);
      if (data) {
        setResult(data);
      } else {
        setError("Character not found");
      }
    } catch (err) {
      setError("Failed to fetch character");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (
      result &&
      !savedCharacters.find((c) => c.CharacterName === result.CharacterName)
    ) {
      setSavedCharacters([...savedCharacters, result]);
      setResult(null);
      setName("");
    }
  };

  const handleRemove = (charName: string) => {
    setSavedCharacters(
      savedCharacters.filter((c) => c.CharacterName !== charName)
    );
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Character</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Character Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
            </Button>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {result && (
            <div className="border rounded p-4 space-y-2">
              <div className="font-bold text-lg">{result.CharacterName}</div>
              <div className="text-sm text-gray-500">
                {result.ServerName} | {result.CharacterClassName}
              </div>
              <div className="text-sm">Item Level: {result.ItemMaxLevel}</div>
              <Button className="w-full mt-2" onClick={handleSave}>
                <Plus className="mr-2 h-4 w-4" /> Add Character
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {savedCharacters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Characters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {savedCharacters.map((char) => (
              <div
                key={char.CharacterName}
                className="flex justify-between items-center border p-2 rounded"
              >
                <div>
                  <div className="font-medium">{char.CharacterName}</div>
                  <div className="text-xs text-gray-500">
                    {char.CharacterClassName} ({char.ItemMaxLevel})
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(char.CharacterName)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
