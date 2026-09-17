---
name: dependency-audit
description: Audits third-party dependencies for security and maintainability — lockfile discipline, upgrade cadence (automatic patch vs. manual minor/major), evaluating a new package before adding it, and automated vulnerability scanning in CI. Package-manager-agnostic. Use when user asks about lockfiles, dependency upgrades, adding a new dependency, npm audit, pip-audit, Dependabot, Snyk, or CVE scanning.
---

# Dependency Audit

Every third-party dependency is code that runs with exactly the trust your own
code has. A vulnerability, an abandoned package or an incompatible licence becomes
your problem, not the upstream maintainer's. The reasoning is the same in any
package manager — npm, pnpm, pip, Maven, Bundler, NuGet — only the command
changes.

## Lockfiles: why they are always committed

| Without a lockfile | With the lockfile committed |
|---|---|
| Each `install` can resolve transitive dependencies differently | Every install resolves the same tree |
| A new bug or CVE in a transitive dependency arrives silently on the next install | It only arrives when someone updates the lockfile deliberately |
| Today's build differs from tomorrow's, from the same manifest | Reproducible: same manifest plus same lockfile, same tree, always |
| "What is actually running in production" cannot be audited | The lockfile is the source of truth for what is installed, not the manifest |

- A lockfile is code, not a build artifact: it goes into git
  (`package-lock.json`, `pnpm-lock.yaml`, `poetry.lock`/`Pipfile.lock`,
  `Gemfile.lock`, `packages.lock.json`). Never in `.gitignore`.
- CI and production install with the command that **respects** the lockfile and
  fails when it has drifted from the manifest (`npm ci`, not `npm install`). Never
  let CI resolve new versions on its own.
- The manifest (`package.json`, `pyproject.toml`, `pom.xml`, `Gemfile`, `.csproj`)
  declares acceptable ranges; the lockfile pins the exact resolution. Both are
  committed, and they do different jobs.
- A lockfile merge conflict is not resolved by editing the file. Resolve the
  manifest and regenerate the lockfile.

## Upgrade policy

| Change | Automation | Cadence |
|---|---|---|
| Patch (`x.y.Z`) — bugfix, no new API | Automatic (bot or scheduled job), merged on green CI | Continuous |
| Minor (`x.Y.0`) — new feature, backwards compatible | Automatic PR, human review before merge | Weekly or fortnightly |
| Major (`X.0.0`) — breaking change | Manual and dedicated, changelog read, regression tests | Planned, with time set aside |

- Automatic patching is only safe with a real test suite covering the critical
  path. Without tests, every upgrade is a leap in the dark, patch or not.
- Never batch minors and majors silently: one PR per dependency, or per related
  group. A mass upgrade with no isolation makes it impossible to tell which
  package broke what.
- A dependency pinned to an old version out of fear accumulates security debt. An
  unpatched CVE in an old version does not go away; it stays invisible until it is
  an incident.
- Freezing an upgrade is an explicit, documented decision — a known incompatibility
  with another library, say — not a default by inertia.

## Evaluating a new package before adding it

Before running `install`, check:

| Criterion | What to look at | Warning sign |
|---|---|---|
| Active maintenance | Last release date, issues and PRs answered | No commits in years, maintainer gone |
| Transitive tree size | How many extra dependencies it drags in | A small utility pulling dozens of transitives |
| Licence | Compatible with the project's or client's commercial use | GPL/AGPL inside a closed product, or no declared licence |
| CVE history | Recurring vulnerabilities, response time to reports | Open CVEs unpatched for months |
| Adoption | Downloads, who else uses it, more established alternatives | An obscure new package doing what a mature library already does |
| Actual need | Could a few lines of your own do it? | Pulling a heavy dependency for a trivial function |

- Prefer a dependency already used in another of your projects over introducing a
  new one for the same job.
- Transitive dependencies matter as much as direct ones — they run in your process
  too. Audit the whole tree, not just the top level.
- A deprecated or explicitly unmaintained package is a signal to replace it, even
  while it still works.

## Automated vulnerability scanning in CI

- The scan runs on every PR that touches the manifest or lockfile, and on a
  schedule (daily or weekly): a new CVE can affect an already-installed dependency
  with no code change at all.
- Severity sets the gate. Critical and high block the merge; medium and low open a
  tracking issue without stopping the pipeline — otherwise the habit becomes
  ignoring the alert.
- A false positive (a CVE that does not affect the code path in use) is handled
  with a documented exception carrying a review date, never by disabling the scan.
- Dependency scanning complements SAST on your own code. They cover different
  surfaces: third-party code versus code you wrote.
- The scan result becomes a pipeline artifact or report rather than a lost log
  line, which is what makes a later audit possible.

## Checklist

- [ ] Lockfile committed and updated alongside the manifest in every PR
- [ ] CI installs with the command that pins to the lockfile (`ci`, not `install`/`update`)
- [ ] Automatic patching configured, with green CI as the merge criterion
- [ ] Minor and major upgrades reviewed in isolated PRs, per package or group
- [ ] Vulnerability scanning on PRs and on a schedule, gated by severity
- [ ] New packages evaluated (maintenance, tree, licence, CVEs) before being added
- [ ] Deprecated or unmaintained dependencies identified, with a replacement plan
- [ ] Accepted CVE exceptions documented with a reason and a review date

## Anti-patterns

- ❌ A lockfile in `.gitignore`, or out of sync with the manifest
- ❌ CI running `install`/`update` instead of the lockfile-respecting command
- ❌ Batching major upgrades without isolating them, "to save time"
- ❌ A dependency frozen on an old version out of fear, with no upgrade plan
- ❌ Adding a package without checking maintenance, licence or transitive tree
- ❌ Vulnerability scanning with no gate: an alert generated and never read
- ❌ Disabling the whole scan because of one false positive
- ❌ Ignoring transitive dependencies because they are not in the direct manifest

## By stack

**npm/pnpm** — `npm ci` or `pnpm install --frozen-lockfile` in CI;
`npm audit --audit-level=high` or `pnpm audit` for scanning; `npm outdated` to see
what is behind.

**pip** — `pip-compile` or `poetry.lock` as the lockfile;
`pip install -r requirements.txt --require-hashes` in CI; `pip-audit` or
`safety check` for CVEs.

**Maven** — versions pinned in `pom.xml` (or through `dependencyManagement`);
`mvn versions:display-dependency-updates` to see what is available;
`mvn org.owasp:dependency-check-maven:check` for scanning.

**Bundler** — `Gemfile.lock` always committed; `bundle install --deployment` in
CI; `bundle audit` for known CVEs in the installed gems.

**NuGet** — `packages.lock.json` (through `RestorePackagesWithLockFile`);
`dotnet list package --vulnerable` for CVEs; `dotnet list package --outdated` for
the upgrade policy.
