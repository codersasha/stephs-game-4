# HTML5 Game Project Rules

## Project Setup
- **Technology**: Pure HTML5, CSS, and JavaScript - no frameworks, no build tools, no backend
- **Hosting**: This will run on static GitHub Pages
- **Responsive**: The game MUST work on phones, tablets, and desktops

## Workflow Rules
1. **Auto-commit and push**: After making changes, automatically commit with a descriptive message and push to GitHub. Don't ask for permission - just do it.
2. **Open in browser**: After changes, open the game locally so Steph can test it (use `python3 -m http.server 8080` and the Cursor browser)
3. **Run tests**: If there's a test suite, run it after changes to make sure nothing broke
4. **Fix bugs immediately**: If something breaks, fix it right away

## Game Development Rules
1. **Simple UI**: Make buttons big and easy to tap on phones
2. **Save progress**: Use localStorage to save game data (no accounts needed)
3. **Sound effects**: Add fun sounds using Web Audio API (no external files needed)
4. **Graphics**: Use SVG for graphics - they scale nicely and look good on all screens
5. **Keep it simple**: This is for kids (around 8 years old) - make it easy to understand

## File Structure
```
/
├── index.html          (main game page)
├── css/
│   └── style.css       (all styles)
├── js/
│   ├── game.js         (main game code)
│   └── game-logic.js   (testable game logic - pure functions)
├── tests/
│   └── test-runner.html (browser-based tests)
└── .github/
    └── workflows/
        └── deploy.yml  (GitHub Pages deployment)
```

## Target Audience
- Primary user: 8-year-old child
- Keep gameplay simple and fun for young children
- Be patient and encouraging

## Remember
- Keep it simple for kids
- Make it fun and engaging
- Big buttons, easy controls
- Works great on phones
