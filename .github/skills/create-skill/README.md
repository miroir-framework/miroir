# Skill Creator - Meta Skill

This skill helps you create new Claude Code skills following the Agent Skills open standard.

## Usage

You can invoke this skill in several ways:

### Natural language (Claude decides when to use it)
```
"Create a skill to review pull requests"
"I need a skill for deploying to production"
"Make a skill that explains code with diagrams"
```

### Direct invocation
```
/create-skill review-pr "Review pull requests for quality"
/create-skill deploy "Deploy to production environments"
```

### With the skill active in conversation
Just ask questions about creating skills and Claude will use this skill's context.

## What it does

The skill creator helps you:

1. **Gather requirements** - Asks clarifying questions about your skill
2. **Design the structure** - Determines proper frontmatter and configuration
3. **Generate the files** - Creates the skill directory and SKILL.md
4. **Add supporting files** - Creates templates, examples, or scripts if needed
5. **Validate the result** - Ensures the skill follows best practices

## Skill Types

### Reference Skills
Provide background knowledge, conventions, or patterns that Claude should know.
- Example: API conventions, coding standards, architecture patterns
- Claude can invoke automatically when relevant

### Task Skills
Step-by-step instructions for specific actions.
- Example: Deploy, commit, run tests, create components
- Often manually invoked with `/skill-name`

### Research Skills
Deep analysis tasks that run in isolated contexts.
- Example: Analyze codebase, research patterns, investigate issues
- Usually runs in a subagent with `context: fork`

## Features

- **Frontmatter configuration**: Proper YAML setup for all skill options
- **Argument handling**: Support for `$ARGUMENTS`, `$0`, `$1`, etc.
- **Invocation control**: Configure who can invoke (user, Claude, or both)
- **Subagent execution**: Set up isolated execution contexts
- **Dynamic context**: Inject live data with shell commands
- **Tool restrictions**: Limit available tools for safety
- **Supporting files**: Create templates, examples, and scripts

## Examples

See [examples.md](examples.md) for complete examples of:
- Simple reference skills
- Task skills with arguments
- Research skills using subagents
- Skills with dynamic context injection
- Code generation with templates
- Visual output generators
- Multi-step workflows

## Best Practices

1. **Keep SKILL.md focused** - Move detailed content to supporting files
2. **Write clear descriptions** - Help Claude decide when to use the skill
3. **Use specific instructions** - Vague instructions lead to unpredictable results
4. **Provide examples** - Show expected output when possible
5. **Test thoroughly** - Try both natural language and direct invocation
6. **Document arguments** - Use `argument-hint` to show expected inputs
7. **Set proper permissions** - Use `disable-model-invocation` for actions with side effects
8. **Reference supporting files** - Tell Claude what each file contains

## Frontmatter Options

| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Skill name (becomes `/name`) | `deploy` |
| `description` | When to use this skill | `Deploy to production` |
| `argument-hint` | Show expected arguments | `[environment]` |
| `disable-model-invocation` | User-only invocation | `true` |
| `user-invocable` | Hide from user menu | `false` |
| `allowed-tools` | Auto-approved tools | `Read, Grep` |
| `context` | Run in isolation | `fork` |
| `agent` | Subagent type | `Explore` |

## File Structure

```
.github/skills/<skill-name>/
├── SKILL.md           # Main skill (required)
├── template.md        # Optional: Templates to fill in
├── examples.md        # Optional: Example outputs
├── reference.md       # Optional: Detailed documentation
└── scripts/           # Optional: Helper scripts
    ├── helper.py
    └── validate.sh
```

## Quick Start

1. Ask: `"Create a skill to [what you want]"`
2. Answer clarifying questions
3. Review the generated skill
4. Test with `/skill-name` or natural language
5. Refine based on results

## Related Resources

- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- [Agent Skills Standard](https://agentskills.io/)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [Plugins](https://code.claude.com/docs/en/plugins)
