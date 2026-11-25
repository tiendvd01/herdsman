# Feature Specification: Git Graph Lane Colors

**Feature Branch**: `master`

**Created**: 2026-11-25

**Status**: Ready for planning

**Input**: User description “Thêm đa sắc màu để phần biệt các luồng trong gitgraph”

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trace intersecting commit paths (Priority: P1)

As a developer reviewing workspace history, I want concurrent paths to have distinct colors so I can follow each path through a merge.

**Why this priority**: The lane layout alone can be difficult to follow when several commit paths meet.

**Independent Test**: Open the Git tab for a workspace with a merge and follow both parent paths across several commit rows.

**Acceptance Scenarios**:

1. **Given** a merge with two visible parents, **When** the Git Graph opens, **Then** each parent connection uses the color of its destination path, and each commit dot matches its incoming path when one exists.
2. **Given** two active paths, **When** one passes through a row for another commit, **Then** the passing path keeps its color.
3. **Given** identical history and theme, **When** the view redraws or is resized, **Then** the color assignment stays the same.
4. **Given** a history with a merge, **When** the user changes between built-in Light and Dark themes, **Then** both paths remain visible and distinguishable.

5. **Given** a checked-out branch with a configured upstream that is ahead, **When** Git Graph opens, **Then** the local and remote labels appear at the end of their respective tip rows.

### Edge Cases

- Linear history uses one continuous color. A parent outside loaded history has no visible connection.
- With more than five concurrent paths, colors may repeat. Paths keep their geometry and each active path keeps its assigned color.
- Empty or unavailable history continues to show the existing status.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** The Git Graph MUST assign colors automatically and prefer an unused color when starting a path within its five-color palette.
- **FR-002** An active path MUST keep its color across commit rows. A newly opened first-parent continuation MUST inherit the commit's color. Connections to other paths MUST use the destination path's color.
- **FR-003** Color assignment MUST be repeatable for identical displayed history. The palette MUST remain legible in built-in Light and Dark themes.
- **FR-004** Commit IDs, subjects, parent connections, status messages, and existing resize controls MUST remain available.

- **FR-005** Show local and remote branch names after the subject of the commit each branch points to. Include commits from the checked-out branch’s configured upstream so its tip is visible when it is ahead.

### Key Entities

- **Commit path** — A visible line through one or more rows that connects commits through parent relationships.
- **Palette** — Five theme-aware colors shared by commit dots and path segments.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** For a sample history with five concurrent paths, five distinct colors are visible on the overlapping rows.
- **SC-002** For a sample two-parent merge, both parent edges match the continuation color across all visible rows in both built-in Light and Dark themes.
- **SC-003** A reviewer can correctly trace both parents of the sample merge within 10 seconds per theme, using the rendered graph.

## Assumptions

- Colors belong to visible commit paths and are assigned automatically. Per-branch color preferences and persistence across different history snapshots are outside scope.
- The feature applies to the workspace Git tab. History is ordered topologically, includes the configured upstream, and retains the existing loading limit and resize behavior.
