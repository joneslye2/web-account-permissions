provider "aws" {
  region = var.aws_region
}

locals {
  name_prefix = lower(replace(var.base_app_name, "_", "-"))
  repo_name   = "${local.name_prefix}-previews"
}

resource "aws_ecr_repository" "repo" {
  name = local.repo_name

  image_tag_mutability = "MUTABLE"
  tags                 = var.common_tags
}

# Shared role App Runner assumes to pull images from the private ECR repo
# above. terraform/environment references this by ARN string (a plain
# variable), never as a Terraform resource, since each environment applies
# against its own separate state file and must never try to manage it.
resource "aws_iam_role" "apprunner_ecr_access" {
  name = "${local.name_prefix}-apprunner-ecr-access"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr_access" {
  role       = aws_iam_role.apprunner_ecr_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

output "repository_url" {
  value       = aws_ecr_repository.repo.repository_url
  description = "ECR repository URL to push images to"
}

output "apprunner_ecr_access_role_arn" {
  value       = aws_iam_role.apprunner_ecr_access.arn
  description = "Role App Runner assumes to pull images from the private ECR repo"
}
