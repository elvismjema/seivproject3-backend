# GitHub Branch Workflow

## Start from dev (sync up)

```bash
git switch dev
git pull origin dev
```

## Create or switch to your branch

```bash
git switch -c branch-name
```

(If it already exists: `git switch branch-name`)

## Do your coding work

- Add or edit your files (HTML, CSS, JS).
- Save your changes in VS Code.

## Stage changes

```bash
git add .
```

## Commit changes

```bash
git commit -m "Short description of what you changed"
```

## Push to GitHub

```bash
git push -u origin branch-name
```

## Open a Pull Request

1. Go to GitHub repo.
2. Base: `dev`
3. Compare: `branch-name`
4. Add PR title/description.
5. Submit for review & merge.

*Note: Don't review and merge yet - leave that for manual review*