# Components

Global, reusable UI components shared across multiple features. A component belongs here only if it is used by **three or more** different features (Rule of Three). Feature-specific components stay inside their feature folder.

## Components

| Component | Purpose |
|-----------|---------|
| `AbstractionLadder.tsx` | Displays beliefs ordered from most general to most specific. |
| `ConfidenceScale.tsx` | Visualizes beliefs ordered by intensity (weak to strong). |
| `ValenceSpectrum.tsx` | Maps beliefs along a negative-to-positive sentiment axis. |
| `MasterView.tsx` | Combined multi-dimensional view of all belief properties. |
