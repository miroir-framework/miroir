---
name: create-skill
description: Create a new Claude Code skill with proper structure, frontmatter, and documentation. Use when the user asks to create a new skill, slash command, or extend Claude's capabilities.
argument-hint: [skill-name] [description]
allowed-tools: Create, Edit, Read
---

# Skill Creator

Create a well-structured Claude Code skill following the Agent Skills open standard.

## Your task

When the user asks to create a skill:

1. **Gather requirements**: Ask clarifying questions if needed:
   - What should the skill do?
   - Who should invoke it (user, Claude, or both)?
   - Does it need arguments?
   - Should it run in a subagent (isolated context)?
   - Does it need supporting files (templates, examples, scripts)?

2. **Determine frontmatter configuration**:
   - `name`: lowercase-with-hyphens (max 64 chars)
   - `description`: Clear explanation of what it does and when to use it
   - `argument-hint`: If it accepts arguments (e.g., `[filename]`, `[issue-number]`)
   - `disable-model-invocation`: Set to `true` if only user should invoke (e.g., deploy, commit)
   - `user-invocable`: Set to `false` if only Claude should use it (background knowledge)
   - `allowed-tools`: List tools Claude can use without permission when skill is active
   - `context`: Set to `fork` to run in isolated subagent
   - `agent`: Specify agent type when using `context: fork` (Explore, Plan, general-purpose)

3. **Structure the skill content**:
   - **Reference skills**: Include conventions, patterns, guidelines Claude should know
   - **Task skills**: Step-by-step instructions for specific actions
   - Use `$ARGUMENTS` or `$0`, `$1`, etc. for argument substitution
   - Use `!`command`" for dynamic context injection (runs shell commands before Claude sees content)
   - Include `"ultrathink"` keyword anywhere in content to enable extended thinking mode

4. **Create the skill directory structure**:
   ```
   .github/skills/<skill-name>/
   ├── SKILL.md           # Main instructions (required)
   ├── template.md        # Optional: Template for Claude to fill in
   ├── examples.md        # Optional: Example outputs
   └── scripts/           # Optional: Helper scripts
       └── helper.py
   ```

5. **Write clear, actionable content**:
   - Keep SKILL.md under 500 lines (move details to separate files)
   - Use markdown formatting for structure
   - Include specific, concrete instructions
   - Add examples when helpful
   - Reference supporting files if created

## Skill invocation patterns

### Both user and Claude can invoke (default)
```yaml
---
name: explain-code
description: Explains code with visual diagrams and analogies
---
```

### Only user can invoke (for actions with side effects)
```yaml
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
---
```

### Only Claude can invoke (background knowledge)
```yaml
---
name: legacy-context
description: Historical context about the legacy system
user-invocable: false
---
```

## Argument patterns

### Simple arguments
```yaml
---
name: fix-issue
description: Fix a GitHub issue by number
argument-hint: [issue-number]
---

Fix GitHub issue $ARGUMENTS following coding standards.
```

### Multiple arguments
```yaml
---
name: migrate-component
description: Migrate a component between frameworks
argument-hint: [component] [from] [to]
---

Migrate the $0 component from $1 to $2.
Preserve all behavior and tests.
```

## Subagent execution

Use `context: fork` for isolated execution:

```yaml
---
name: deep-research
description: Research a topic thoroughly across the codebase
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:
1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with file references
```

## Dynamic context injection

Use `` !`command` `` syntax to inject live data:

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
allowed-tools: Bash(gh *)
---

## PR Context
- Diff: !`gh pr diff`
- Comments: !`gh pr view --comments`
- Files: !`gh pr diff --name-only`

Summarize this pull request...
```

## Tool restrictions

Limit available tools for safety:

```yaml
---
name: safe-explorer
description: Read-only codebase exploration
allowed-tools: Read, Grep, Glob
---
```

## Supporting files

For complex skills, create additional files:

**SKILL.md**:
```markdown
## Additional resources
- For API details, see [reference.md](reference.md)
- For examples, see [examples.md](examples.md)
```

**Reference supporting files** so Claude knows when to load them.

## Validation checklist

Before completing the skill creation:
- [ ] Skill directory created in `.github/skills/<name>/`
- [ ] SKILL.md has proper YAML frontmatter
- [ ] Description clearly explains when to use the skill
- [ ] Skill content is actionable and specific
- [ ] Arguments are documented if used
- [ ] Supporting files created if needed
- [ ] Tool restrictions set if needed
- [ ] Invocation control configured correctly

## Example: Create a code review skill

**User request**: "Create a skill to review pull requests"

**Questions to ask**:
- Should this run automatically or only when invoked?
- Do you want it to check specific things (tests, documentation, etc.)?
- Should it use git commands or GitHub CLI?

**Resulting skill** (`.github/skills/review-pr/SKILL.md`):
```yaml
---
name: review-pr
description: Review a pull request for code quality, tests, and documentation
argument-hint: [pr-number]
allowed-tools: Bash(gh *), Read, Grep
disable-model-invocation: true
---

# Pull Request Review

Review PR $ARGUMENTS thoroughly:

## 1. Fetch PR context
!`gh pr view $ARGUMENTS`
!`gh pr diff $ARGUMENTS`

## 2. Check for:
- Code quality and best practices
- Test coverage for changes
- Documentation updates
- Breaking changes
- Security concerns

## 3. Provide feedback
- List specific issues with file:line references
- Suggest improvements
- Note positive aspects
```

## Output

After creating the skill:
1. Confirm the skill location
2. Show how to invoke it (both `/skill-name` and natural language)
3. Explain what the skill does
4. Suggest testing it with an example

---

**Remember**: Skills extend Claude's capabilities. Make them focused, actionable, and well-documented.
