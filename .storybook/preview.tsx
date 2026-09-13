import type { Preview } from '@storybook/nextjs-vite';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    backgrounds: {
      disable: true, // We use our own theme decorator instead
    },
  },

  globalTypes: {
    theme: {
      description: 'Global theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      return (
        <div
          data-theme={theme}
          style={{
            backgroundColor: theme === 'dark' ? '#1a1118' : '#fdf6f0',
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;