# Terraform layout

- `aws-setup/` — bootstraps the GitHub Actions OIDC provider/role and the
  Terraform remote state backend (S3 + DynamoDB). Run once by a maintainer;
  see its own README.
- `global/` — resources shared across every environment: the ECR repo
  previews and prod images are pushed to, and the IAM role App Runner
  assumes to pull from it. Applied idempotently by CI on every run.
- `environment/` — one App Runner service per environment (a PR preview or
  prod), parameterized by `env_type`/`env_id`. Applied against its own
  Terraform state key per environment (`state/prs/pr-<N>.tfstate`,
  `state/prod/main.tfstate`), so a plain `terraform apply` here only ever
  touches that one environment's service.
