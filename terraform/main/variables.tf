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
  type    = string
  description = "Environment type: local | pr | prod"
  default = "pr"
}

variable "env_id" {
  type        = string
  description = "Identifier for the environment (hostname, pr-123, main)"
}

variable "image_identifier" {
  type        = string
  description = "Full image identifier (ECR URI with tag) to deploy to App Runner"
  default     = ""
}

variable "common_tags" {
  type    = map(string)
  default = {}
}
