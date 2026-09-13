# Terraform bootstrap for GitHub OIDC

This folder provisions the IAM OpenID Connect provider and role needed for GitHub Actions to assume AWS credentials via OIDC.

## Prerequisites
- AWS account access with permissions to create IAM OIDC providers and roles.
- Terraform installed locally.

## Commands

```bash
cd terraform/github-oidc
terraform init
terraform plan
terraform apply
```

## Output
The role ARN is emitted as `role_arn`, and it is intended for use in the GitHub Actions workflow.
