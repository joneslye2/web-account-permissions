provider "aws" {
  region = var.aws_region
}

locals {
  repo_owner = "joneslye2"
  repo_name  = "web-account-permissions"

  oidc_subjects = [
    "repo:${local.repo_owner}/${local.repo_name}:ref:refs/heads/main",
    "repo:${local.repo_owner}/${local.repo_name}:pull_request",
  ]
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
    Version = "2012-10-17"
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
          "ssm:PutParameter"
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

output "role_arn" {
  value = aws_iam_role.github_oidc_role.arn
}
