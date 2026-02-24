interface AvatarSelectorProps {
  selected: string;
  onSelect: (avatarUrl: string) => void;
}

// Avatares prediseñados usando emojis como base visual
const PRESET_AVATARS = [
  { id: 'avatar-1', emoji: '🦊', bg: 'bg-orange-500' },
  { id: 'avatar-2', emoji: '🐱', bg: 'bg-amber-500' },
  { id: 'avatar-3', emoji: '🐶', bg: 'bg-yellow-600' },
  { id: 'avatar-4', emoji: '🦁', bg: 'bg-yellow-500' },
  { id: 'avatar-5', emoji: '🐸', bg: 'bg-green-500' },
  { id: 'avatar-6', emoji: '🐙', bg: 'bg-purple-500' },
  { id: 'avatar-7', emoji: '🦄', bg: 'bg-pink-500' },
  { id: 'avatar-8', emoji: '🐧', bg: 'bg-sky-500' },
  { id: 'avatar-9', emoji: '🦉', bg: 'bg-emerald-500' },
  { id: 'avatar-10', emoji: '🐝', bg: 'bg-yellow-400' },
  { id: 'avatar-11', emoji: '🦋', bg: 'bg-blue-500' },
  { id: 'avatar-12', emoji: '🐺', bg: 'bg-indigo-500' },
];

export function AvatarSelector({ selected, onSelect }: AvatarSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Elige tu avatar
      </label>
      <div className="grid grid-cols-4 gap-3">
        {PRESET_AVATARS.map((avatar) => {
          const isSelected = selected === avatar.id;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelect(avatar.id)}
              className={`
                w-full aspect-square rounded-2xl flex items-center justify-center
                text-3xl transition-all duration-200
                ${avatar.bg}
                ${isSelected
                  ? 'ring-4 ring-primary ring-offset-2 ring-offset-dark-900 scale-105'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
                }
              `}
            >
              {avatar.emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
