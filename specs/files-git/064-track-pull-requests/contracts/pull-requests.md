# Pull Requests interface

- `pull_requests_refresh` returns every registered project's list or status and all eligible notifications for the active GitHub account.
- `pull_requests_read` takes account, repository and event key and marks a single notification read.
- `pull_request_open` takes a validated GitHub repository and PR number and opens the browser.
- The left icon opens a dedicated PR screen in place of the project sidebar, workspace and right panel. The PR project and content filters are independent of the selected workspace. A positive badge is the account-wide unread count across accessible projects. Selecting an inbox row marks it read and opens its project and PR. Multiple matching projects offer a choice when the current project is ineligible.
