# Data Model — Git Graph Lane Colors

An active lane contains the ID of the next visible commit and one of five palette colors. When that ID is reached, its first parent can inherit the color if a new lane is needed. An already active parent keeps its own color. Once a path ends, its color can be reused. Colors are derived when displaying history.
