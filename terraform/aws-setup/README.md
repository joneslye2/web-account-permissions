# AWS setup (OIDC + state backend)

This folder bootstraps minimal AWS resources used by CI and Terraform remote state:

- An IAM OIDC provider and a role (`matthew-avp-github-oidc-role`) for GitHub Actions OIDC assume-role usage.
- An IAM policy attached to the role with deploy-related permissions.
- An S3 bucket for Terraform remote state: `joneslye2-avp-terraform-state`.
- A DynamoDB table for Terraform locking: `joneslye2-avp-terraform-locks`.

Run locally to create these resources (recommended once by a maintainer):

```bash
cd terraform/aws-setup
terraform init
terraform apply -auto-approve

# after apply, the outputs will show the role ARN and state bucket/table names
terraform output -json
```

Notes:
- The S3 bucket name is fixed to `joneslye2-avp-terraform-state` to ensure uniqueness.
- If you lose the state for this small bootstrap, you can recreate or delete the resources manually.
- Ensure you run this from an AWS principal with permissions to create IAM, S3, and DynamoDB resources.
