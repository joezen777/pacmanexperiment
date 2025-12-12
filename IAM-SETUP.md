# IAM Setup for Pac-Kiro Deployment

## Minimal IAM Permissions Required

The `iam-policy.json` file contains the minimal permissions needed for the deployment script.

## Option 1: Attach Policy to Existing User (Recommended)

```bash
# Create the policy
aws iam create-policy \
    --policy-name PacKiroDeploymentPolicy \
    --policy-document file://iam-policy.json \
    --profile joezen777

# Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --profile joezen777 --query Account --output text)

# Attach to your user (replace YOUR_USERNAME)
aws iam attach-user-policy \
    --user-name YOUR_USERNAME \
    --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/PacKiroDeploymentPolicy \
    --profile joezen777
```

## Option 2: Create New User with Policy

```bash
# Create new user
aws iam create-user \
    --user-name pac-kiro-deployer \
    --profile joezen777

# Create the policy
aws iam create-policy \
    --policy-name PacKiroDeploymentPolicy \
    --policy-document file://iam-policy.json \
    --profile joezen777

# Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --profile joezen777 --query Account --output text)

# Attach policy to user
aws iam attach-user-policy \
    --user-name pac-kiro-deployer \
    --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/PacKiroDeploymentPolicy \
    --profile joezen777

# Create access keys
aws iam create-access-key \
    --user-name pac-kiro-deployer \
    --profile joezen777
```

## Option 3: Manual Setup via AWS Console

1. Go to IAM Console → Policies → Create Policy
2. Click JSON tab
3. Paste contents of `iam-policy.json`
4. Name it `PacKiroDeploymentPolicy`
5. Go to Users → Select your user → Add permissions
6. Attach the `PacKiroDeploymentPolicy`

## What Each Permission Does

### S3 Permissions
- **CreateBucket**: Create the S3 bucket if it doesn't exist
- **PutBucketPolicy**: Allow CloudFront to access the bucket
- **PutObject/GetObject**: Upload and manage game files
- **ListBucket**: Check if bucket exists

### CloudFront Permissions
- **CreateDistribution**: Create CDN distribution
- **CreateCloudFrontOriginAccessIdentity**: Secure access from CloudFront to S3
- **CreateInvalidation**: Clear cache after deployment
- **List/Get operations**: Check existing resources

### Route53 Permissions
- **ListHostedZones**: Find your domain's hosted zone
- **ChangeResourceRecordSets**: Create/update DNS record for kiroman.cardbrdbx.com

## Security Notes

- ✅ This policy follows least-privilege principle
- ✅ S3 permissions are scoped to specific bucket
- ⚠️ CloudFront and Route53 require wildcard (*) resources due to AWS API limitations
- 🔒 Bucket remains private; only CloudFront can access it

## Verify Permissions

After applying the policy, test with:

```bash
# Test S3 access
aws s3 ls s3://joezen777pacmanexperiment --profile joezen777

# Test CloudFront access
aws cloudfront list-distributions --profile joezen777

# Test Route53 access
aws route53 list-hosted-zones --profile joezen777
```

## Troubleshooting

If you get permission errors:
1. Wait 1-2 minutes for IAM changes to propagate
2. Verify the policy is attached: `aws iam list-attached-user-policies --user-name YOUR_USERNAME --profile joezen777`
3. Check AWS CloudTrail for specific denied actions
