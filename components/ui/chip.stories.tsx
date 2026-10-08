import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Chip } from './chip';
import { useState } from 'react';

const meta = {
  title: 'UI/Chip',
  component: Chip,
  parameters: {
    layout: 'centered',
  },
  args: {
    label: 'Cà phê',
    selected: false,
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Cà phê',
    selected: false,
  },
};

export const MoodSelector: Story = {
  args: {
    label: 'Tâm trạng',
  },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selectedMood, setSelectedMood] = useState('love');
    const moods = [
      { id: 'love', label: 'Yêu thương', icon: '💖' },
      { id: 'happy', label: 'Vui vẻ', icon: '🥰' },
      { id: 'calm', label: 'Bình yên', icon: '🌿' },
      { id: 'excited', label: 'Hào hứng', icon: '✨' },
    ];

    return (
      <div className="flex flex-wrap gap-2">
        {moods.map((m) => (
          <Chip
            key={m.id}
            variant="mood"
            label={m.label}
            icon={m.icon}
            selected={selectedMood === m.id}
            onClick={() => setSelectedMood(m.id)}
          />
        ))}
      </div>
    );
  },
};

export const TagWithDelete: Story = {
  args: {
    label: 'Thẻ tag',
  },
  render: () => (
    <div className="flex gap-2">
      <Chip variant="tag" label="Ăn tối" onDelete={() => {}} />
      <Chip variant="tag" label="Phim chiếu rạp" onDelete={() => {}} />
    </div>
  ),
};
