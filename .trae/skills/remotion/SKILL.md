---
name: "remotion"
description: "Creates, manages, and renders Remotion videos. Invoke when user wants to create video content, edit Remotion projects, or render videos programmatically."
---

# Remotion Skill

This skill helps you work with Remotion, a React-based video creation library. It allows you to:

- Create new Remotion projects
- Edit existing Remotion compositions
- Manage Remotion assets
- Render videos programmatically
- Preview video projects

## Usage

### Creating a New Project

To create a new Remotion project, use the `npx create-video@latest` command and follow the prompts.

### Editing Compositions

Edit the React components in the `src/compositions` directory to create your video content.

### Rendering Videos

Use `npx remotion render` to render your videos to files.

### Previewing Projects

Run `npm run dev` to start the Remotion preview server and see your videos in real-time.

## Examples

#### Example 1: Creating a simple video

```bash
npx create-video@latest my-video
cd my-video
npm run dev
```

#### Example 2: Rendering a video

```bash
npx remotion render src/index.tsx MyComposition out.mp4
```

## Dependencies

- Node.js 16.0 or later
- npm or yarn
- Remotion CLI

## Troubleshooting

If you encounter issues, check the Remotion documentation at https://www.remotion.dev/docs or run `npx remotion --help` for CLI assistance.
