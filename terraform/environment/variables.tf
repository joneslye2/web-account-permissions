variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

variable "base_app_name" {
  type        = string
  description = "Base application name for resource naming"
  default     = "avp"
}

variable "env_type" {
  type        = string
  description = "Environment type: pr | prod"
}

variable "env_id" {
  type        = string
  description = "Identifier for the environment (e.g. pr-123, main)"
}

variable "image_identifier" {
  type        = string
  description = "Full image identifier (ECR URI with tag) to deploy to App Runner"
}

variable "access_role_arn" {
  type        = string
  description = "Role ARN App Runner assumes to pull images from the private ECR repo"
}

variable "msal_client_id" {
  type        = string
  description = "Entra app registration client ID for MSAL, injected at container runtime (see Dockerfile) so the same image works unchanged across environments"
  default     = "671e9818-dea5-4b0d-ac43-7eaf5470894d"
}

variable "common_tags" {
  type = map(string)
  default = {
    Project   = "web-account-permissions"
    Owner     = "joneslye2"
    ManagedBy = "terraform"
    Increment = "1"
  }
}
