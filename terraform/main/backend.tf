terraform {
  backend "s3" {
    bucket         = "joneslye2-avp-terraform-state"
    region         = "eu-west-2"
    dynamodb_table = "joneslye2-avp-terraform-locks"
    # NOTE: do not hardcode `key` here; pass per-run via -backend-config
  }
}
