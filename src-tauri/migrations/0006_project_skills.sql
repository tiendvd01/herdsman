CREATE TABLE project_skills (
    project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    config TEXT NOT NULL
);
