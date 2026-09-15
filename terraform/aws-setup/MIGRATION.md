Migration notes: moved existing local terraform state files from `terraform/github-oidc` to `terraform/aws-setup`.

If you previously ran terraform in `terraform/github-oidc`, the local state files were moved into this folder so future `terraform` commands run in `terraform/aws-setup` will pick up the state.

If you prefer to continue using remote state in S3, run the `terraform init -backend-config=...` commands after applying this module once to push state to S3.
