# GitHub Branch Protection Setup Guide

## Overview

This guide documents the required branch protection settings for the `main` branch in the hamicodeviet.com repository.

## Required Settings

### 1. Navigate to Branch Protection

1. Go to https://github.com/tranhatam-collab/hamicodeviet.com/settings/branches
2. Click "Add rule" for the `main` branch

### 2. Branch Name Settings

**Branch name pattern:** `main`

### 3. Rule Settings

Require status checks to pass before merging:
- ✅ Require branches to be up to date before merging
- ✅ Require status checks to pass before merging

**Required status checks:**
- ✅ Typecheck API
- ✅ API Smoke Tests
- ✅ Build Public Website
- ✅ Build App
- ✅ Secret Scan
- ✅ Token Logging Scan

### 4. Additional Protection Settings

Require pull request reviews before merging:
- ✅ Require pull request reviews before merging
- ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ Require review from CODEOWNERS (if applicable)
- ✅ Require approval from 1 reviewer

Require conversation resolution before merging:
- ✅ Require conversation resolution before merging

Restrict who can push to matching branches:
- ⚠️ Optional: Restrict to specific users/teams
- ⚠️ Optional: Restrict to apps

### 5. Branch Restrictions

**Who can push:**
- Administrators
- Specific users (if needed)

**Who can dismiss reviews:**
- Administrators
- Specific users (if needed)

## Verification

After setup, verify:

1. Try to push directly to `main` (should fail if not admin)
2. Create a PR from a feature branch
3. Verify all status checks are required
4. Verify approval is required before merge

## GitHub API Configuration

Alternatively, use GitHub API to configure:

```bash
# Using GitHub CLI
gh api repos/tranhatam-collab/hamicodeviet/branches/main/protection \
  -X PUT \
  -f required_status_checks='["Typecheck API","API Smoke Tests","Build Public Website","Build App","Secret Scan","Token Logging Scan"]' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":1}' \
  -f restrictions=null
```

## CI Status Checks

The following status checks are defined in `.github/workflows/ci.yml`:

| Check | Job Name | Purpose |
|-------|-----------|---------|
| Typecheck API | typecheck-api | TypeScript type checking |
| API Smoke Tests | test-api | API smoke tests (vitest) |
| Build Public Website | build-public-site | Astro build for public site |
| Build App | build-app | Astro build for app |
| Secret Scan | security-scan | Scan for secrets in source |
| Token Logging Scan | token-log-scan | Scan for token logging |

## Troubleshooting

### Status checks not appearing

1. Verify CI workflow is running on PRs
2. Check workflow status in Actions tab
3. Ensure workflow names match exactly

### Cannot bypass protection

1. Only administrators can bypass
2. Check admin permissions in repository settings
3. Verify you are listed as administrator

### PR cannot be merged

1. Check all status checks are passing
2. Verify required number of approvals
3. Check for conversation resolution requirements

## References

- [GitHub branch protection documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Actions status checks](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments-to-github-actions/using-status-checks)
