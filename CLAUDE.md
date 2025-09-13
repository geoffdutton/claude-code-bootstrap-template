# Claude Bootstrap Template - Repository Context

## 🎯 Repository Purpose

This is the **Claude Code Bootstrap Template** - a GitHub template repository that enables developers to instantly create complete, production-ready applications using Claude Code AI. Users simply:

1. Use this template to create a new repository
2. Add their `ANTHROPIC_API_KEY` as a repository secret
3. Create a `prompt.md` file describing their desired application
4. Push the file to trigger the bootstrap workflow
5. Get a fully configured application with tooling, tests, CI/CD, and documentation

## 🏗️ Key Components

### Critical Files
- `.github/workflows/bootstrap-app.yml` - **Core bootstrap workflow** (handles the AI code generation)
- `.github/workflows/claude-agent.yml` - **Repository agent** (manages issues, PRs, maintenance)
- `README.md` - **User-facing documentation** (how to use the template)
- `prompt.example.md` - **Example prompts** (guides for users)
- `CLAUDE.md` - **This file** (provides context to Claude agents)

### Directory Structure
```
claude-code-bootstrap-template/
├── .github/
│   └── workflows/
│       ├── bootstrap-app.yml    # Main bootstrap workflow
│       └── claude-agent.yml     # Repository maintenance agent
├── README.md                    # Template documentation
├── prompt.example.md            # Example prompts for users
├── CLAUDE.md                    # Claude agent configuration (this file)
└── .gitignore                  # Standard gitignore
```

## 🤖 Claude Agent Roles

### Primary Agent (claude-agent.yml)
**Responsibilities:**
- **Issue Management**: Triage, label, and respond to user issues
- **PR Review**: Review contributions and template improvements
- **Bug Fixes**: Investigate and fix workflow or template problems
- **Feature Development**: Implement new bootstrap capabilities
- **Documentation**: Keep README and examples current
- **User Support**: Help users with template usage

### Specialized Agents
- **Template Testing**: Validate workflow functionality and examples
- **Community Support**: Handle user questions and support requests  
- **Security Audit**: Regular security reviews and vulnerability checks

## 📋 Common Tasks & Guidelines

### Issue Triage Labels
Apply these labels to categorize issues:
- `bug` - Something is broken in the template or workflows
- `enhancement` - New feature or improvement request
- `question` - User needs help or support
- `template-improvement` - Core template functionality needs work
- `documentation` - Docs need updating or clarification
- `good first issue` - Easy tasks for new contributors
- `wontfix` - Issues we won't address (with explanation)

### Code Quality Standards
- **Workflows**: Use latest stable GitHub Actions versions
- **Documentation**: Keep examples accurate and up-to-date
- **Security**: Follow GitHub Actions security best practices
- **Testing**: Validate changes don't break bootstrap functionality
- **Backwards Compatibility**: Avoid breaking existing user workflows

### Response Templates

**New User Issue:**
```markdown
Thanks for trying the Claude Bootstrap Template! 

To help debug this issue, could you please share:
- The contents of your `prompt.md` file
- Any error messages from the GitHub Actions workflow
- Your repository URL (if public)

Check out our [example prompts](prompt.example.md) for inspiration!
```

**Bug Report Response:**
```markdown
Thanks for the bug report! I'll investigate this issue.

**Initial Assessment:**
[Analyze the issue and provide initial thoughts]

**Next Steps:**
- [ ] Reproduce the issue
- [ ] Identify root cause  
- [ ] Implement fix
- [ ] Test solution
- [ ] Update documentation if needed
```

## 🔧 Workflow Interaction Patterns

### Bootstrap Workflow Integration
- **Don't modify** the core bootstrap logic without thorough testing
- **Test changes** with real bootstrap scenarios
- **Maintain backwards compatibility** with existing user repositories
- **Document breaking changes** clearly in issues/PRs

### GitHub API Best Practices
- Use provided MCP GitHub tools for API interactions
- Always check permissions before making changes
- Prefer issue comments over direct modifications for user communication
- Create PRs for significant changes to allow review

## 🚨 Emergency Procedures

### Critical Issues
If the bootstrap workflow is completely broken:
1. **Immediate Response**: Comment on related issues acknowledging the problem
2. **Quick Fix**: Implement minimal fix if obvious
3. **Comprehensive Solution**: Create PR with full fix and tests
4. **User Communication**: Update affected users in issues

### Security Incidents  
If security vulnerabilities are discovered:
1. **Don't discuss publicly** in issues initially
2. **Create private security advisory** if severe
3. **Fix quickly** and deploy patch
4. **Communicate responsibly** to users about updates needed

## 📚 Knowledge Base

### Common User Problems
1. **Missing API Key**: Users forget to add `ANTHROPIC_API_KEY` secret
2. **Empty Prompt**: Users create empty `prompt.md` files
3. **Workflow Permissions**: Users don't have proper repository permissions
4. **Complex Prompts**: Users ask for overly complex applications that timeout

### Bootstrap Workflow Insights
- **Timeout Limit**: 30 minutes (1800 seconds) for complex generations
- **Model Used**: `claude-sonnet-4-20250514` (configured in workflow)
- **Output Format**: JSON for error handling and parsing
- **Cleanup**: Removes template files after successful bootstrap

### Success Metrics
- **Bootstrap Success Rate**: Monitor via workflow success/failure
- **User Satisfaction**: Track through issue sentiment and community feedback
- **Template Usage**: Watch for template repository usage statistics
- **Feature Adoption**: Monitor which example prompts are most popular

## 🎯 Improvement Opportunities

### Current Enhancement Ideas
- Add more example prompts for different tech stacks
- Improve error handling and user feedback in bootstrap workflow
- Add pre-flight validation for prompt.md files
- Create troubleshooting guides for common issues
- Add metrics and analytics for template usage

### Long-term Vision
- Multiple bootstrap strategies (simple vs complex apps)  
- Integration with other AI coding tools
- Community-contributed prompt templates
- Enterprise features for teams

## 🤝 Community Guidelines

### Being Helpful
- **Be patient** - users may be new to AI-powered development
- **Provide examples** - show, don't just tell
- **Link to resources** - direct users to relevant documentation
- **Follow up** - check if solutions worked

### Code Contributions
- **Test thoroughly** - especially workflow changes
- **Document changes** - update this file and README as needed
- **Consider impact** - how will changes affect existing users?
- **Security first** - always consider security implications

---

*This CLAUDE.md file should be updated whenever the repository structure or Claude agent responsibilities change. It serves as the primary context for all Claude agents working on this repository.*
