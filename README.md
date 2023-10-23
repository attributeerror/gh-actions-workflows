# gh-actions-workflows
Repository which holds all of my GitHub Actions workflows.

## Example Usage
You can re-use this workflow in each repository like so.

```yaml
name: Build & push Docker image

on:
  push:
    branches:
      - main
      - alpha
      - 'feature/**'
      - 'bugfix/**'

# Cancel jobs that are already running for the same branch/pull request
concurrency:
  group: ${{ github.workflow }}-${{ github.ref || github.run_id }}
  cancel-in-progress: true
  
jobs:
  build:
    uses: attributeerror/gh-actions-workflows/.github/workflows/build-docker-image.yaml@main
    permissions:
      packages: write # to be able to push Docker images
      contents: write # to be able to tag commits
    with:
      package-name: daisuke-bot
```