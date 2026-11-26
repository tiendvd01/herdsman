# Data model

- Project links to the GitHub repository identified by its origin. Normalize repository names for comparison and accept only github.com owner/repository combinations.
- A PR belongs to a repository and has a positive number. Its role is authored or requested. Current membership requires an open PR.
- A repository snapshot belongs to one GitHub account and holds current PRs, a refresh cursor, and activity state for reconciliation. Initial sync establishes the baseline.
- A notification belongs to one repository and PR. A stable event key deduplicates source activity. Read starts false and transitions to true when opened. Project IDs and names are attached when returning the notification to the UI.
