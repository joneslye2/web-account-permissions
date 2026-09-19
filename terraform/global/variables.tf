variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

variable "base_app_name" {
  type        = string
  description = "Base application name for resource naming"
  default     = "avp"
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
