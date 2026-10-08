import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { SegmentedTabs } from './segmented-tabs';
import { useState } from 'react';
import { Heart, Calendar, MapPin } from 'lucide-react';

const meta = {
  title: 'UI/SegmentedTabs',
  component: SegmentedTabs,
  parameters: {
    layout: 'centered',
  },
  args: {
    tabs: [
      { id: 'dates', label: 'Buổi hẹn' },
      { id: 'memories', label: 'Kỷ niệm' },
    ],
    value: 'dates',
    onChange: fn(),
  },
} satisfies Meta<typeof SegmentedTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tabs: [
      { id: 'dates', label: 'Buổi hẹn' },
      { id: 'memories', label: 'Kỷ niệm' },
      { id: 'wishlist', label: 'Muốn thử' },
    ],
    value: 'dates',
    onChange: fn(),
  },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selected, setSelected] = useState('dates');
    return (
      <SegmentedTabs
        tabs={[
          { id: 'dates', label: 'Buổi hẹn' },
          { id: 'memories', label: 'Kỷ niệm' },
          { id: 'wishlist', label: 'Muốn thử' },
        ]}
        value={selected}
        onChange={setSelected}
      />
    );
  },
};

export const WithIcons: Story = {
  args: {
    tabs: [
      { id: 'heart', label: 'Cảm xúc', icon: <Heart className="w-4 h-4" /> },
      { id: 'calendar', label: 'Thời gian', icon: <Calendar className="w-4 h-4" /> },
    ],
    value: 'heart',
    onChange: fn(),
  },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selected, setSelected] = useState('heart');
    return (
      <SegmentedTabs
        tabs={[
          { id: 'heart', label: 'Cảm xúc', icon: <Heart className="w-4 h-4" /> },
          { id: 'calendar', label: 'Thời gian', icon: <Calendar className="w-4 h-4" /> },
          { id: 'place', label: 'Địa điểm', icon: <MapPin className="w-4 h-4" /> },
        ]}
        value={selected}
        onChange={setSelected}
      />
    );
  },
};
