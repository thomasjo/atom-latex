# Contribution Guidelines
First and foremost, thanks for contributing! I'm only one person and for this
package to truly provide a first-class LaTeX experience from within Atom, your
contributions are crucial.

Before you set out on your adventure, please read this document carefully. It
will save everyone involved both time and energy.

## Styleguides
The short story is to use common sense and follow the existing styles and
conventions, whether it's Git commit messages, JavaScript code, documentation,
and so on.

### Git Commit Messages
- The first line should be a short summary limited to 50 characters.
- All other lines should be limited to 72 characters.
- The first line and the (optional) detailed summary **must** always be
  separated by a single blank line since many tools rely on this convention.
- Additional paragraphs should also be separated with blank lines,
- Use the **present tense**; “Add feature” and not “Added feature”.
- Use the **imperative mood**; “Fix bug …” and not “Fixes bug …”.
- Reference issues and pull requests. If a commit resolves an issue, mention
  that in the summary, and prefix the reference with either “close”, “fix”,
  or “resolve” to automatically close the referenced issues when your pull
  requests are merged.

  See https://help.github.com/articles/closing-issues-via-commit-messages/.

For additional details and inspiration, see [Tim Pope's excellent post][1] on
commit message best practises.

### JavaScript Styleguide
[![standard](https://cdn.rawgit.com/feross/standard/master/badge.svg)][2]

This project follows the [JavaScript Standard Style][2]. Compliance with the
rules is automatically checked during CI builds. If you want to check if your
changes are adhering to the rules, simply execute `script/lint`.


<!--- refs --->
[1]: http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html
[2]: http://standardjs.com/


## Financial contributions

We also welcome financial contributions in full transparency on our [open collective](https://opencollective.com/latex).
Anyone can file an expense. If the expense makes sense for the development of the community, it will be "merged" in the ledger of our open collective by the core contributors and the person who filed the expense will be reimbursed.

