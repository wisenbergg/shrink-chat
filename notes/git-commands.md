# Common Git Commands

## Stage all changes (new, modified, deleted files)
```bash
git add -A
```

## Commit with a message
```bash
#Your clear, imperative summary of this change"
git commit -m 
```

## Push to the remote branch you’re on
```bash
git push
```

## If pushing a new branch for the first time
```bash
git push -u origin main
```

## One-liner: Stage modified files and commit
```bash
git commit -a -m "Your message"
```
*Note: This only includes modified files, not new ones.*

## Tips
- Use `git status` to see what’s staged vs. unstaged.
- Write commit messages in the imperative (“Add feature X”, “Fix bug Y”).
- If you forget `-u origin <branch>`, Git will tell you the exact command to run.