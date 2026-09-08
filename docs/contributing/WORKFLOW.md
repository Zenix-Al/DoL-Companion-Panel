# Contribution workflow

1. Confirm ownership in [Runtime architecture](../architecture/OVERVIEW.md).
2. Make one reviewable behavior or structural change.
3. Add or update focused tests.
4. Regenerate the manifest only when descriptors changed.
5. Run [required checks](TESTING_DEBUGGING.md).
6. Update active docs and `CHANGELOG.md` when behavior or artifacts change.
7. Review the diff and preserve unrelated worktree changes.

A change is done when behavior and failure paths are covered, lifecycle cleanup is verified, imports and docs pass their guards, generated outputs come from builders, and no obsolete compatibility path remains.
