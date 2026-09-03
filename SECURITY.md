# Security policy

## Supported version

The latest version on the default branch is the supported demonstration build.

## Reporting

When this repository is published, report a suspected vulnerability through the repository's private security-reporting feature. Do not include sensitive data in a public issue.

## Security posture

This is a static, local-first demonstration. It has no backend, authentication, analytics, cookies, external requests, upload surface, or runtime dependency. Downloads are assembled from the in-memory synthetic dataset with browser Blob URLs.

The included local server binds to loopback by default and prevents paths outside the project directory.
