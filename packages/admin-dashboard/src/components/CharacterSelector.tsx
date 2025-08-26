import React from 'react';
import type { CharacterProfile } from '@rpg/types';

interface CharacterSelectorProps {
  characters: Array<CharacterProfile>;
  selectedCharacter: CharacterProfile | null;
  onSelect: (character: CharacterProfile | null) => void;
  loading?: boolean;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  characters,
  selectedCharacter,
  onSelect,
  loading = false
}) => {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700">Character:</label>
      <select
        disabled={loading === true}
        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        value={selectedCharacter?.id ?? ''}
        onChange={(e) => {
          const id = e.target.value;
          if (id === '') { onSelect(null); return; }
          const char = characters.find(c => c.id === id) ?? null;
          onSelect(char);
        }}
      >
        <option value="">None</option>
        {characters.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {selectedCharacter?.description !== undefined && selectedCharacter.description !== '' && (
        <span className="text-xs text-gray-500 max-w-xs truncate" title={selectedCharacter.description}>
          {selectedCharacter.description}
        </span>
      )}
    </div>
  );
};
