# Research — Git Graph Lane Colors

The existing renderer already follows visible parent IDs and reuses empty lane positions. Keep the color on the active path so a reused position can receive a new color and a path retains its color through a merge.

Use five dedicated roles in the theme registry. That registry resolves colors for existing themes and lets custom themes override them. Reusing status colors would couple Git history readability to agent status styling.
