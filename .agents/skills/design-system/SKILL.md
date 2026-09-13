# Dating Journal App — Design System Skill

---
name: design-system
description: Reference for the Dating Journal App design system tokens, components, and theming guidelines.
---

## Token Reference

All components MUST use these CSS variables. Never hardcode colors or fonts.

### Colors
| Token | Purpose | Default (Light) | Default (Dark) |
|---|---|---|---|
| `--color-bg` | Page background | `#fdf6f0` | `#1a1118` |
| `--color-surface` | Card/surface background | `#ffffff` | `#2a1f28` |
| `--color-surface-hover` | Surface hover state | `#fff5f5` | `#352a33` |
| `--color-text` | Primary text | `#2d1b30` | `#f5e6f0` |
| `--color-text-muted` | Secondary text | `#8b7088` | `#a08a9d` |
| `--color-primary` | Primary accent (user-customizable) | `#ff6b81` | `#ff6b81` |
| `--color-primary-hover` | Primary hover | `#ff4f6a` | `#ff8599` |
| `--color-primary-fg` | Text on primary | `#ffffff` | `#ffffff` |
| `--color-accent` | Secondary accent | `#c084fc` | `#c084fc` |
| `--color-border` | Border color | `#f0dde8` | `#3d2e3a` |
| `--color-error` | Error state | `#ef4444` | `#f87171` |
| `--color-success` | Success state | `#10b981` | `#34d399` |

### Typography
| Token | Default |
|---|---|
| `--font-heading` | `'Playfair Display', serif` |
| `--font-body` | `'Inter', sans-serif` |

### Spacing & Shape
| Token | Value |
|---|---|
| `--radius-sm` | `8px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `16px` |
| `--radius-full` | `9999px` |
| `--shadow-card` | `0 2px 12px rgba(0,0,0,0.06)` |
| `--shadow-elevated` | `0 8px 32px rgba(0,0,0,0.12)` |

## Component Checklist

- [ ] Button (primary, secondary, ghost, danger variants; sm, md, lg sizes)
- [ ] Input (with label, error state, icon support)
- [ ] Textarea
- [ ] Card (with header, body, footer slots)
- [ ] Modal/Dialog
- [ ] Avatar (with fallback initials)
- [ ] Badge (status colors)
- [ ] Tabs
- [ ] DatePicker
- [ ] ImageUpload (with preview)
- [ ] Toast (success, error, info)
- [ ] EmptyState
- [ ] LoadingSkeleton

## Tailwind Integration

Extend `tailwind.config.ts` to map CSS variables:

```ts
colors: {
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  primary: 'var(--color-primary)',
  // ... etc
}
```

This allows using `bg-primary`, `text-surface`, etc. while still being runtime-customizable.
