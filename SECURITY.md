# Security policy

## Reporting security issues
If you discover a security vulnerability in CodeXchange, please **do not** open a public issue. Instead, disclose it privately by emailing **security@code-x-change.dev**. Include the following information:
- A brief description of the vulnerability.
- Steps to reproduce, if applicable.
- Potential impact and suggested remediation.

We will acknowledge receipt of your report within 48 hours and aim to provide a fix as soon as possible.

## Supported versions
The project follows a **rolling support** model. The latest `main` branch (and the most recent tagged release, if any) is supported. Older versions may receive security fixes at the maintainers’ discretion.

## Security best practices
- Keep dependencies up‑to‑date (`npm audit`, Dependabot).
- Use HTTPS for all external API calls.
- Do not commit secrets; they are stored in GitHub Secrets and environment variables.
- Review third‑party packages for known CVEs.
