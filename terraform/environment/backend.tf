terraform {
  backend "s3" {
    bucket         = "joneslye2-avp-terraform-state"
    region         = "eu-west-2"
    dynamodb_table = "joneslye2-avp-terraform-locks"
    # key varies per environment (pr-N, prod) - passed via -backend-config
  }
}
