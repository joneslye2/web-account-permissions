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

resource "aws_apprunner_service" "app" {
  count = var.image_identifier != "" ? 1 : 0

  service_name = local.service_name

  source_configuration {
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

output "preview_url" {
  description = "App Runner service URL for the preview"
  value       = aws_apprunner_service.app[0].service_url
  condition   = length(aws_apprunner_service.app) > 0
}
