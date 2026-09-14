provider "aws" {
  region = var.aws_region
}

locals {
  # fixed prefix for uniqueness per request
  owner_prefix = "joneslye2-avp"
  oidc_subjects = [
    "repo:joneslye2/web-account-permissions:*",
    # Support token `sub` that includes owner/repo numeric IDs, e.g.
    # repo:joneslye2@73744792/web-account-permissions@1367230886:pull_request
    "repo:joneslye2@*/web-account-permissions@*:*",
  ]
  state_bucket_name = "${local.owner_prefix}-terraform-state"
  ddb_table_name     = "${local.owner_prefix}-terraform-locks"
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97c7a3d4d4f9a1c0be8f"]
  tags            = var.common_tags
}

resource "aws_iam_role" "github_oidc_role" {
  name = "matthew-avp-github-oidc-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = local.oidc_subjects
          }
        }
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_policy" "deploy_policy" {
  name = "github-actions-deploy-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",

          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",

          "lambda:UpdateFunctionCode",
          "lambda:GetFunction",
          "lambda:ListFunctions",
          "lambda:InvokeFunction",

          "iam:PassRole",

          "ssm:GetParameter",
          "ssm:PutParameter",

          "ecr:*",
          "apprunner:*"
        ],
        Resource = "*"
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "github_oidc_attach" {
  role       = aws_iam_role.github_oidc_role.name
  policy_arn = aws_iam_policy.deploy_policy.arn
}

# Backend state bucket for Terraform remote state
resource "aws_s3_bucket" "tf_state" {
  bucket = local.state_bucket_name

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = merge(var.common_tags, { Name = local.state_bucket_name })
}

resource "aws_s3_bucket_public_access_block" "state_block" {
  bucket = aws_s3_bucket.tf_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for Terraform state locking
resource "aws_dynamodb_table" "tf_locks" {
  name         = local.ddb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(var.common_tags, { Name = local.ddb_table_name })
}

output "role_arn" {
  value = aws_iam_role.github_oidc_role.arn
}

output "state_bucket" {
  value = aws_s3_bucket.tf_state.bucket
}

output "dynamodb_table" {
  value = aws_dynamodb_table.tf_locks.name
}
