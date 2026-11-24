# Research

- Reuse the searchable Appearance picker. Its code-font choices prioritize installed monospace faces and expose Nerd Fonts by their installed family names.
- Use the existing Code font stack in the terminal. Browser font fallback handles a removed font.
- Pad the outer viewport wrapper. FitAddon measures the inner host, so the calculated terminal grid excludes padding.
- Update the font and refit the existing terminal instance to preserve its attach stream and buffer.
