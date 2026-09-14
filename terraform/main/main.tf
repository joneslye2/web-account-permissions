provider "aws" {
  region = var.aws_region
}

locals {
  name_prefix = lower(replace(var.base_app_name, "_", "-"))
  repo_name   = "${local.name_prefix}-previews"
  service_name = "${local.name_prefix}-${var.env_type}-${var.env_id}"
  merged_tags = merge(var.common_tags, { Environment = var.env_type, EnvId = var.env_id })
}

resource "aws_ecr_repository" "repo" {
  name = local.repo_name

  image_tag_mutability = "MUTABLE"
  tags                 = local.merged_tags
}

# Shared role App Runner assumes to pull images from the private ECR repo above.
# Created once (targeted alongside the ECR repo in CI); referenced by ARN string
# (var.access_role_arn) rather than a resource reference so the per-PR apply,
# which runs against a separate state file, never tries to recreate it.
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

resource "aws_apprunner_service" "app" {
  count = var.image_identifier != "" ? 1 : 0

  service_name = local.service_name

  source_configuration {
    authentication_configuration {
      access_role_arn = var.access_role_arn
    }

    image_repository {
      image_identifier      = var.image_identifier
      image_repository_type = "ECR"
    }
  }

  instance_configuration {
    cpu    = "1024"
    memory = "2048"
  }

  tags = local.merged_tags
}

output "repository_url" {
  value       = aws_ecr_repository.repo.repository_url
  description = "ECR repository URL to push images to"
}

output "apprunner_ecr_access_role_arn" {
  value       = aws_iam_role.apprunner_ecr_access.arn
  description = "Role App Runner assumes to pull images from the private ECR repo"
}

output "preview_url" {
  description = "App Runner service URL for the preview"
  value       = one(aws_apprunner_service.app[*].service_url)
}
