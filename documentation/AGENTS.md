# AGENTS.md

## Project Structure
- Always use modular, maintainable app project structure for the respective language and web framework.

## Tech Stack Rules
- **React**: You are building a React application using TypeScript.
- **Routing**: Use React Router. KEEP routes in `src/App.tsx`.
- **Structure**:
    - Source code in `src/`.
    - Pages in `src/pages/`.
    - Components in `src/components/`.
    - Main page is `src/pages/Index.tsx`.
- **UI Library**: ALWAYS try to use `shadcn/ui`.
- **Styling**: ALWAYS use Tailwind CSS.
- **Icons**: Use `lucide-react`.

## Development Process
- Always check if a feature works before moving on to the next feature (i.e., do incremental development or agile workflow).
- Add or update changes to `README.md` file to the root of the project.
- Update documentation via `mkdocs` (if applicable) or standard markdown files in a folder called 'requirements' to the root of the project.

## Coding Style
- **General**:
    - Use descriptive variable, function, class names that are self-explanatory.
    - Use descriptive docstrings for functions and classes.
    - Use descriptive comments for code that is not self-explanatory.
    - For core business logic ensure to add multi-line comments to explain how the code implements the logic.
- **Python**:
    - Use `snake_case` for variable and function names.
    - Use `CamelCase` for class names.
    - Use PEP 8 style guide for code formatting.
- **TypeScript/JavaScript**:
    - Use `camelCase` for variable and function names.
    - Use `PascalCase` for class names and components.
    - Use Prettier/ESLint for formatting.

## Boundaries
- **Always**:
    - Write to `src/` or similar and `tests/`.
    - Run tests before commits.
    - Follow naming conventions.
    - Use secure coding practices (OWASP Top 10).
- **Ask if**:
    - Database schema changes.
    - Adding dependencies.
    - Modifying CI/CD config.
    - Architecture/Design changes.
- **Never**:
    - Commit secrets or API keys.
    - Push broken code to the main branch.
    - Commit code that does not work.

## Security
- Validate all inputs.
- Use parameterized queries to prevent SQL injection (if applicable).
- Sanitize output to prevent XSS.
- Implement proper authentication and authorization.
- Handle errors gracefully without leaking sensitive information.

## Performance
- Optimize database queries.
- Minimize network requests.
- Use efficient algorithms and data structures.
- Lazy load resources where appropriate.

## Testing
- Write unit tests for all new logic.
- Write integration tests for API endpoints.
- Ensure high code coverage.
- Run tests automatically in CI/CD.

## Deployment
- Use automated deployment pipelines.
- Use environment variables for configuration.
- Perform blue-green or rolling updates (if applicable).

## Maintenance
- Keep dependencies up to date.
- Refactor code regularly to reduce technical debt.
- Monitor application logs and performance metrics.

## Future Proofing
- Design for scalability.
- Use standard interfaces and protocols.
- Avoid vendor lock-in where possible.

## Conformance Testing
- Use YAML suites for inputs/outputs to verify agent behavior.
- Ensure that agents adhere to the specified inputs and outputs.
- Run conformance tests as part of the CI/CD pipeline.

## Sub-agents
- Use specialized sub-agents for specific tasks (e.g., DB design, Frontend, Backend).
- Define clear interfaces and contracts between agents using OpenAPI specs.
- Ensure that sub-agents follow the same boundaries and guidelines as the main agent.

## Documentation
- Keep `README.md` up to date.
- Document API endpoints (OpenAPI/Swagger) as enforceable contracts.
- Document complex logic and algorithms.
