# Contributing to MyCSD Hunter

Thank you for contributing to MyCSD Hunter.

## Branch and pull request workflow

The `main` branch is protected. Do not commit or push directly to it. Every change must be made on a separate branch and merged through a pull request.

1. Update your local `main` branch:

   ```bash
   git switch main
   git pull origin main
   ```

2. Create a branch using the appropriate prefix:

   - `feature/<short-description>` for new functionality
   - `hotfix/<short-description>` for urgent production fixes
   - `patch/<short-description>` for non-urgent fixes and small updates

   For example:

   ```bash
   git switch -c feature/add-event-filter
   ```

3. Make focused changes and commit them with a clear message.

4. Verify the change locally:

   ```bash
   npm test
   npm run build
   ```

5. Push the branch and open a pull request targeting `main`:

   ```bash
   git push -u origin feature/add-event-filter
   ```

## Pull request requirements

- Explain what changed and why.
- Keep the pull request limited to one concern.
- Include or update tests when behavior changes.
- Confirm that `npm test` and `npm run build` pass.
- Do not merge your own pull request.

The repository owner, [@WanAdamm](https://github.com/WanAdamm), is automatically assigned as the reviewer. Address all review feedback and obtain approval before the pull request is merged into `main`.
