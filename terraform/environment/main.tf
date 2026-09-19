provider "aws" {
  region = var.aws_region
}

locals {
  name_prefix  = lower(replace(var.base_app_name, "_", "-"))
  service_name = "${local.name_prefix}-${var.env_type}-${var.env_id}"
  merged_tags  = merge(var.common_tags, { Environment = var.env_type, EnvId = var.env_id })
}

resource "aws_apprunner_service" "app" {
  service_name = local.service_name

  source_configuration {
    auto_deployments_enabled = true

    authentication_configuration {
      access_role_arn = var.access_role_arn
    }

    image_repository {
      image_identifier      = var.image_identifier
      image_repository_type = "ECR"

      image_configuration {
        port = "8080"
        runtime_environment_variables = {
          MSAL_CLIENT_ID = var.msal_client_id
        }
      }
    }
  }

  instance_configuration {
    cpu    = "1024"
    memory = "2048"
  }

  tags = local.merged_tags
}

output "preview_url" {
  description = "App Runner service URL for this environment"
  value       = aws_apprunner_service.app.service_url
}
