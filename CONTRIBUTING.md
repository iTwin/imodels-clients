# Contributing to imodels-clients

## Reporting Issues

If you have any feature requests or noticed potential issues please use the [Issues](https://github.com/iTwin/imodels-clients/issues) page for reporting new issues or adding to existing ones.

## Contributions

### Contributor License Agreement (CLA)

A [Contribution License Agreement with Bentley](https://gist.github.com/imodeljs-admin/9a071844d3a8d420092b5cf360e978ca) must be signed before your contributions will be accepted. Upon opening a pull request, you will be prompted to use [cla-assistant](https://cla-assistant.io/) for a one-time acceptance applicable for all Bentley projects.
You can read more about [Contributor License Agreements](https://en.wikipedia.org/wiki/Contributor_License_Agreement) on Wikipedia.

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
