# Skill Creation Examples

This file contains example skills for various use cases.

## Example 1: Simple Reference Skill

A skill that provides coding conventions (Claude can invoke automatically):

**`.github/skills/api-conventions/SKILL.md`**:
```yaml
---
name: api-conventions
description: API design patterns and conventions for this codebase
---

# API Conventions

When creating or modifying API endpoints:

## Naming
- Use RESTful conventions: GET /resources, POST /resources, PUT /resources/:id
- Use plural nouns for resources
- Use kebab-case for multi-word resources

## Response Format
All responses should follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

## Error Handling
- Use appropriate HTTP status codes
- Include detailed error messages
- Log errors with context

## Validation
- Validate all inputs
- Return 400 for validation errors
- Include field-level error details
```

## Example 2: Task Skill with Arguments

A deployment skill that only the user can invoke:

**`.github/skills/deploy/SKILL.md`**:
```yaml
---
name: deploy
description: Deploy the application to a specified environment
argument-hint: [environment]
disable-model-invocation: true
allowed-tools: Bash(npm *), Bash(git *)
---

# Deploy Application

Deploy to $ARGUMENTS environment:

## Pre-deployment checks
1. Ensure all tests pass: `npm run test`
2. Verify current branch is clean: `git status`
3. Check environment configuration exists

## Deployment steps
1. Build the application: `npm run build`
2. Run deployment script: `npm run deploy:$ARGUMENTS`
3. Verify deployment: `npm run verify:$ARGUMENTS`

## Post-deployment
1. Tag the release: `git tag -a release-$ARGUMENTS-$(date +%Y%m%d)`
2. Push tags: `git push --tags`
3. Notify team of successful deployment

## Rollback
If issues occur, run: `npm run rollback:$ARGUMENTS`
```

Usage: `/deploy production` or `/deploy staging`

## Example 3: Research Skill Using Subagent

A skill that runs in isolation to research a topic:

**`.github/skills/deep-research/SKILL.md`**:
```yaml
---
name: deep-research
description: Deeply research a topic across the entire codebase with comprehensive analysis
argument-hint: [topic]
context: fork
agent: Explore
---

# Deep Research Task

Research $ARGUMENTS comprehensively across the codebase.

## Research methodology

1. **Discover files**
   - Use Glob to find potentially relevant files
   - Search for related terms using Grep
   - Identify all modules that might be relevant

2. **Read and analyze**
   - Read each relevant file completely
   - Understand the implementation details
   - Note patterns and conventions used

3. **Cross-reference**
   - Look for usages across files
   - Identify dependencies
   - Find related functionality

4. **Synthesize findings**
   - Summarize how $ARGUMENTS works
   - List all relevant files with specific line references
   - Explain the overall architecture
   - Note any gotchas or edge cases
   - Suggest areas for improvement if applicable

## Output format

Provide a structured report with:
- Executive summary
- Detailed findings with file:line references
- Architecture diagram (ASCII art)
- Key insights
- Recommendations
```

## Example 4: Dynamic Context Injection

A skill that uses live GitHub data:

**`.github/skills/pr-summary/SKILL.md`**:
```yaml
---
name: pr-summary
description: Generate a comprehensive summary of a pull request
argument-hint: [pr-number]
allowed-tools: Bash(gh *)
disable-model-invocation: true
---

# Pull Request Summary

Generate a summary for PR #$ARGUMENTS.

## PR Metadata
!`gh pr view $ARGUMENTS --json title,author,createdAt,updatedAt,url`

## Changes Overview
!`gh pr diff $ARGUMENTS --name-only`

## Detailed Diff
!`gh pr diff $ARGUMENTS`

## Comments and Reviews
!`gh pr view $ARGUMENTS --comments`

## Your task

Based on the above information, create a comprehensive summary including:

1. **What changed**: High-level description of the changes
2. **Files affected**: Categorize changes by area (frontend, backend, tests, etc.)
3. **Impact analysis**: What parts of the system are affected
4. **Review status**: Summary of comments and review feedback
5. **Merge readiness**: Is this ready to merge? Any blockers?

Keep the summary concise but informative.
```

## Example 5: Code Generation with Template

A skill that generates components using a template:

**`.github/skills/create-component/SKILL.md`**:
```yaml
---
name: create-component
description: Create a new React component with tests and styles
argument-hint: [ComponentName]
allowed-tools: Create, Edit
---

# Create React Component

Create a new component named $ARGUMENTS.

## Steps

1. **Create component file**: `src/components/$ARGUMENTS/$ARGUMENTS.tsx`
   - Use the template from [template.md](template.md)
   - Replace {{ComponentName}} with $ARGUMENTS
   - Follow our component patterns

2. **Create test file**: `src/components/$ARGUMENTS/$ARGUMENTS.test.tsx`
   - Include basic rendering tests
   - Test component props
   - Test user interactions

3. **Create styles**: `src/components/$ARGUMENTS/$ARGUMENTS.module.css`
   - Use CSS modules
   - Follow our naming conventions

4. **Create index**: `src/components/$ARGUMENTS/index.ts`
   - Export the component as default
   - Export any related types

5. **Update parent index**: Add to `src/components/index.ts`

See [examples.md](examples.md) for reference implementations.
```

**`.github/skills/create-component/template.md`**:
```typescript
import React from 'react';
import styles from './{{ComponentName}}.module.css';

export interface {{ComponentName}}Props {
  // Add your props here
}

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = (props) => {
  return (
    <div className={styles.container}>
      {/* Component implementation */}
    </div>
  );
};
```

## Example 6: Background Knowledge (Claude-only)

A skill that provides context but isn't a user action:

**`.github/skills/legacy-context/SKILL.md`**:
```yaml
---
name: legacy-context
description: Historical context about the legacy authentication system
user-invocable: false
---

# Legacy Authentication System

This codebase includes a legacy authentication system that's being phased out.

## Current state
- Old system: Uses custom JWT in `src/auth/legacy/`
- New system: OAuth2 in `src/auth/oauth/`
- Migration: In progress, 60% complete

## Important notes
- Don't add features to legacy system
- When working with user auth, prefer new OAuth2 system
- Legacy system will be removed in Q3 2026
- See MIGRATION.md for transition plan

## Known issues
- Legacy tokens expire incorrectly on Feb 29 (leap year bug)
- Session handling is not thread-safe
- No 2FA support in legacy system

When suggesting auth changes, always recommend the new OAuth2 system.
```

## Example 7: Visual Output Generator

A skill that generates interactive HTML visualizations:

**`.github/skills/test-coverage-report/SKILL.md`**:
```yaml
---
name: test-coverage-report
description: Generate an interactive HTML test coverage report
allowed-tools: Bash(npm *), Bash(python *)
disable-model-invocation: true
---

# Test Coverage Report Generator

Generate an interactive test coverage visualization.

## Steps

1. **Run coverage**: `npm run test:coverage -- --json > coverage.json`
2. **Generate visualization**: Run the bundled script
3. **Open report**: The script will open `coverage-report.html` in your browser

## Execute

```bash
npm run test:coverage -- --json > coverage.json
python .github/skills/test-coverage-report/scripts/generate.py coverage.json
```

The report shows:
- Overall coverage percentage
- Coverage by directory
- Color-coded files (red: <50%, yellow: 50-80%, green: >80%)
- Line-by-line coverage details
- Uncovered lines highlighted
```

**`.github/skills/test-coverage-report/scripts/generate.py`**:
```python
#!/usr/bin/env python3
"""Generate interactive test coverage report."""

import json
import sys
import webbrowser
from pathlib import Path

def generate_html(coverage_data, output_path):
    # Generate HTML with coverage visualization
    # (Implementation details omitted for brevity)
    pass

if __name__ == '__main__':
    coverage_file = sys.argv[1]
    with open(coverage_file) as f:
        data = json.load(f)
    
    output = Path('coverage-report.html')
    generate_html(data, output)
    print(f'Generated {output.absolute()}')
    webbrowser.open(f'file://{output.absolute()}')
```

## Example 8: Multi-Framework Migration

A skill with multiple arguments:

**`.github/skills/migrate-component/SKILL.md`**:
```yaml
---
name: migrate-component
description: Migrate a component from one framework to another
argument-hint: [component-name] [from-framework] [to-framework]
---

# Component Migration

Migrate the $0 component from $1 to $2.

## Migration strategy

1. **Read original component**
   - Understand current implementation
   - Identify all props and state
   - Note lifecycle methods used
   - Document event handlers

2. **Plan migration**
   - Map $1 concepts to $2 equivalents
   - Identify breaking changes
   - Plan state management approach

3. **Implement in $2**
   - Create new component structure
   - Convert props and state
   - Migrate event handlers
   - Apply $2 best practices

4. **Preserve functionality**
   - Ensure all features work identically
   - Maintain the same API/props
   - Keep tests passing

5. **Update tests**
   - Migrate test files to $2 testing library
   - Ensure coverage remains the same
   - Add framework-specific tests if needed

6. **Document changes**
   - Note any API changes
   - Update component documentation
   - Add migration notes for team

## Output

Provide:
- New component file
- Updated tests
- Migration summary
- Any breaking changes or deprecations
```

Usage: `/migrate-component SearchBar React Vue`

## Key Patterns

1. **Reference skills**: Provide context Claude should always know
2. **Task skills**: Step-by-step instructions for actions
3. **Arguments**: Use `$ARGUMENTS`, `$0`, `$1` for dynamic values
4. **Invocation control**: `disable-model-invocation` for manual-only, `user-invocable: false` for Claude-only
5. **Subagents**: `context: fork` for isolated research or exploration
6. **Dynamic data**: `` !`command` `` for live data injection
7. **Tool restrictions**: `allowed-tools` for safety and permissions
8. **Supporting files**: Templates, examples, scripts for complex skills
