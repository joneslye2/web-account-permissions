variable "aws_region" {
  description = "AWS region for the OIDC role and downstream deployment resources."
  type        = string
  default     = "eu-west-2"
}

variable "common_tags" {
  description = "Common tags to apply to all created resources."
  type        = map(string)
  default = {
    Project   = "web-account-permissions"
    ManagedBy = "terraform"
  }
}
