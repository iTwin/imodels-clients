# Contributing to imodels-clients

## Reporting Issues

If you have any feature requests or noticed potential issues please use the [Issues](https://github.com/iTwin/imodels-clients/issues) page for reporting new issues or adding to existing ones.

## Contributions

### Contributor License Agreement (CLA)

A [Contribution License Agreement with Bentley](https://gist.github.com/imodeljs-admin/9a071844d3a8d420092b5cf360e978ca) must be signed before your contributions will be accepted. Upon opening a pull request, you will be prompted to use [cla-assistant](https://cla-assistant.io/) for a one-time acceptance applicable for all Bentley projects.
You can read more about [Contributor License Agreements](https://en.wikipedia.org/wiki/Contributor_License_Agreement) on Wikipedia.

### Source Code Edit Workflow

1. Make source code changes on a new Git branch
2. Ensure tests pass: `npm run test:unit` and `npm run test:integration`
3. Ensure linting passes: `rush lint`
4. Ensure spell-checking passes: `rush spell-check`
5. Locally commit changes: `git commit`
6. Repeat steps 2-5 until ready to push the changes.
7. Add change log entry (which could potentially cover several commits): `rush change`
8. Follow prompts to enter a change description or press ENTER if the change does not warrant a change log entry. 
    - If multiple packages have changed, multiple sets of prompts will be presented.
    - If the changes are only to non-published packages, such as tests, then `rush change` will indicate that a change log entry is not needed.
9. Completing the `rush change` prompts will cause new change log JSON files to be created.
    - By default, all changes will be of type `none`. However, according to the scope of the change, you might want to change the type to `major`, `minor` or `patch` in the change log JSON files.
10. Add and commit the change log JSON files.
11. Publish changes on the branch and open a pull request.

👉 See [Authoring change logs](https://rushjs.io/pages/best_practices/change_logs/) for tips about writing change logs.

> Note: The CI build will break if changes are pushed without running `rush change`. The fix is to complete steps 7 through 10.

### Pull Requests

All submissions go through a review process.
We use GitHub pull requests for this purpose.
All pull requests must be approved by at least one person and must pass build checks before they can be merged to the `main` branch.
Consult [GitHub Help](https://help.github.com/articles/about-pull-requests/) for more information on using pull requests.

### Releases

Releases are allowed only from the following branches ([pipeline](common/config/azure-pipelines/templates/publish.yml)):

- `main`
- `backport/*`

Increasing the package version number is currently done manually, meaning we make the change in `package.json` files and merge it to `main` branch using a pull request.

Backporting is also done manually. If you need to backport a change:

1. Checkout a branch from the desired commit. Branch name should match the `backport/*` pattern. Push it to the remote.
2. Create a pull request to `backport/*` branch with needed changes/fixes, merge it.
3. Create a pull request to `backport/*` branch with increased version number (we follow [semver](https://semver.org/) rules), merge it.
4. Kick of the release pipeline from `backport/*` branch.
