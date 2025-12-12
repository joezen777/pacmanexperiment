#!/bin/bash

# Pac-Kiro Game Deployment Script
# Deploys to S3, CloudFront, and Route53

set -e  # Exit on error

# Configuration
# replace with however you store credentials on your machine
PROFILE="joezen777"
# Enter your own bucket name
BUCKET_NAME="joezen777pacmanexperiment"
# You must first own a domain on route 53
DOMAIN_NAME="kiroman.cardbrdbx.com"
ZONE_NAME="cardbrdbx.com"
REGION="us-east-1"

echo "🎮 Starting Pac-Kiro deployment..."
echo "Profile: $PROFILE"
echo "Bucket: $BUCKET_NAME"
echo "Domain: $DOMAIN_NAME"
echo ""

# Step 1: Check/Create S3 Bucket (Private)
echo "📦 Step 1: Checking S3 bucket..."
if aws s3 ls "s3://$BUCKET_NAME" --profile $PROFILE 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Creating private bucket $BUCKET_NAME..."
    aws s3 mb "s3://$BUCKET_NAME" --region $REGION --profile $PROFILE
    
    # Keep bucket private - CloudFront will access it via OAI
    echo "Bucket will remain private (CloudFront will use Origin Access Identity)"
    
    echo "✅ Bucket created"
else
    echo "✅ Bucket already exists"
fi

# Step 2: Request/Validate ACM Certificate (must be in us-east-1 for CloudFront)
echo ""
echo "🔒 Step 2: Checking ACM certificate..."
ACM_REGION="us-east-1"

# Check if certificate already exists
CERT_ARN=$(aws acm list-certificates \
    --region $ACM_REGION \
    --profile $PROFILE \
    --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME'].CertificateArn" \
    --output text)

if [ -z "$CERT_ARN" ]; then
    echo "Requesting ACM certificate for $DOMAIN_NAME..."
    CERT_ARN=$(aws acm request-certificate \
        --domain-name $DOMAIN_NAME \
        --validation-method DNS \
        --region $ACM_REGION \
        --profile $PROFILE \
        --query 'CertificateArn' \
        --output text)
    
    echo "Certificate ARN: $CERT_ARN"
    echo "⏳ Waiting for certificate validation records..."
    sleep 10
fi

# Always check certificate status
CERT_STATUS=$(aws acm describe-certificate \
    --certificate-arn $CERT_ARN \
    --region $ACM_REGION \
    --profile $PROFILE \
    --query 'Certificate.Status' \
    --output text)

echo "Certificate status: $CERT_STATUS"

if [ "$CERT_STATUS" == "PENDING_VALIDATION" ]; then
    echo "Certificate is pending validation..."
    
    # Get validation records
    VALIDATION_RECORD=$(aws acm describe-certificate \
        --certificate-arn $CERT_ARN \
        --region $ACM_REGION \
        --profile $PROFILE \
        --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
        --output json)
    
    VALIDATION_NAME=$(echo $VALIDATION_RECORD | jq -r '.Name')
    VALIDATION_VALUE=$(echo $VALIDATION_RECORD | jq -r '.Value')
    VALIDATION_TYPE=$(echo $VALIDATION_RECORD | jq -r '.Type')
    
    if [ "$VALIDATION_NAME" != "null" ] && [ -n "$VALIDATION_NAME" ]; then
        echo "Creating/updating DNS validation record..."
        echo "  Name: $VALIDATION_NAME"
        echo "  Type: $VALIDATION_TYPE"
        
        # Get hosted zone ID
        HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
            --profile $PROFILE \
            --query "HostedZones[?Name=='$ZONE_NAME.'].Id" \
            --output text | cut -d'/' -f3)
        
        # Create validation record in Route53
        # Note: ACM validation values don't need extra quotes
        cat > /tmp/validation-record.json <<EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$VALIDATION_NAME",
                "Type": "$VALIDATION_TYPE",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$VALIDATION_VALUE"
                    }
                ]
            }
        }
    ]
}
EOF
        
        aws route53 change-resource-record-sets \
            --hosted-zone-id $HOSTED_ZONE_ID \
            --change-batch file:///tmp/validation-record.json \
            --profile $PROFILE 2>/dev/null || echo "Validation record may already exist"
        
        echo "✅ Validation record created/updated"
    fi
    
    echo ""
    echo "⏳ Waiting for certificate validation..."
    echo "   This can take 5-30 minutes. You can:"
    echo "   1. Wait here (script will continue automatically)"
    echo "   2. Press Ctrl+C and re-run later (script will resume)"
    echo ""
    
    # Wait with timeout (30 minutes max)
    timeout 1800 aws acm wait certificate-validated \
        --certificate-arn $CERT_ARN \
        --region $ACM_REGION \
        --profile $PROFILE || {
        echo ""
        echo "⚠️  Certificate validation is taking longer than expected."
        echo "   Certificate ARN: $CERT_ARN"
        echo "   Status: Check AWS Console or re-run this script later."
        echo "   The script will continue with other steps..."
        echo ""
    }
    
    # Re-check status
    CERT_STATUS=$(aws acm describe-certificate \
        --certificate-arn $CERT_ARN \
        --region $ACM_REGION \
        --profile $PROFILE \
        --query 'Certificate.Status' \
        --output text)
fi

while [ "$CERT_STATUS" != "ISSUED" ]; do
    echo "⚠️  Certificate status: $CERT_STATUS"
    echo "   You may need to wait longer for DNS propagation."
    echo ""
    echo "Options:"
    echo "  [r] Retry - Check certificate status again"
    echo "  [d] DNS Check - Run dig to verify CNAME propagation"
    echo "  [y] Continue anyway (not recommended)"
    echo "  [n] Exit and re-run script later"
    echo ""
    read -p "Choose option (r/d/y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Rr]$ ]]; then
        echo "🔄 Checking certificate status..."
        sleep 5
        CERT_STATUS=$(aws acm describe-certificate \
            --certificate-arn $CERT_ARN \
            --region $ACM_REGION \
            --profile $PROFILE \
            --query 'Certificate.Status' \
            --output text)
        
        if [ "$CERT_STATUS" == "ISSUED" ]; then
            echo "✅ Certificate is now validated and issued!"
            break
        else
            echo "Status: $CERT_STATUS (still waiting...)"
            echo ""
        fi
    elif [[ $REPLY =~ ^[Dd]$ ]]; then
        echo "🔍 Running DNS check..."
        
        # Get validation record name
        VALIDATION_NAME=$(aws acm describe-certificate \
            --certificate-arn $CERT_ARN \
            --region $ACM_REGION \
            --profile $PROFILE \
            --query 'Certificate.DomainValidationOptions[0].ResourceRecord.Name' \
            --output text)
        
        VALIDATION_VALUE=$(aws acm describe-certificate \
            --certificate-arn $CERT_ARN \
            --region $ACM_REGION \
            --profile $PROFILE \
            --query 'Certificate.DomainValidationOptions[0].ResourceRecord.Value' \
            --output text)
        
        echo ""
        echo "Expected CNAME:"
        echo "  Name:  $VALIDATION_NAME"
        echo "  Value: $VALIDATION_VALUE"
        echo ""
        echo "DNS Query Result:"
        dig +short $VALIDATION_NAME CNAME || echo "  (No CNAME record found or not propagated yet)"
        echo ""
    elif [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "⚠️  Continuing with unvalidated certificate..."
        break
    else
        echo "Exiting. Re-run ./deploy.sh when certificate is ready."
        exit 1
    fi
done

if [ "$CERT_STATUS" == "ISSUED" ]; then
    echo "✅ Certificate is validated and issued!"
fi

# Step 3: Create Origin Access Identity and CloudFront Distribution
echo ""
echo "☁️  Step 3: Checking CloudFront distribution..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions --profile $PROFILE --query "DistributionList.Items[?Origins.Items[?DomainName=='$BUCKET_NAME.s3.amazonaws.com']].Id" --output text)

if [ -z "$DISTRIBUTION_ID" ]; then
    echo "Creating Origin Access Identity..."
    OAI_ID=$(aws cloudfront create-cloud-front-origin-access-identity \
        --cloud-front-origin-access-identity-config \
        CallerReference="pac-kiro-oai-$(date +%s)",Comment="OAI for Pac-Kiro game" \
        --profile $PROFILE \
        --query 'CloudFrontOriginAccessIdentity.Id' \
        --output text 2>/dev/null || \
        aws cloudfront list-cloud-front-origin-access-identities \
        --profile $PROFILE \
        --query 'CloudFrontOriginAccessIdentityList.Items[0].Id' \
        --output text)
    
    echo "OAI ID: $OAI_ID"
    
    # Get the OAI canonical user ID
    OAI_CANONICAL_USER=$(aws cloudfront get-cloud-front-origin-access-identity \
        --id $OAI_ID \
        --profile $PROFILE \
        --query 'CloudFrontOriginAccessIdentity.S3CanonicalUserId' \
        --output text)
    
    echo "OAI Canonical User: $OAI_CANONICAL_USER"
    
    # Set bucket policy to allow CloudFront OAI access
    echo "Setting bucket policy for CloudFront access..."
    cat > /tmp/bucket-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontOAI",
            "Effect": "Allow",
            "Principal": {
                "CanonicalUser": "$OAI_CANONICAL_USER"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF
    aws s3api put-bucket-policy \
        --bucket $BUCKET_NAME \
        --policy file:///tmp/bucket-policy.json \
        --profile $PROFILE
    
    echo "Creating CloudFront distribution with SSL certificate..."
    cat > /tmp/cf-config.json <<EOF
{
    "CallerReference": "pac-kiro-$(date +%s)",
    "Aliases": {
        "Quantity": 1,
        "Items": ["$DOMAIN_NAME"]
    },
    "DefaultRootObject": "index.html",
    "ViewerCertificate": {
        "ACMCertificateArn": "$CERT_ARN",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021",
        "Certificate": "$CERT_ARN",
        "CertificateSource": "acm"
    },
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-$BUCKET_NAME",
                "DomainName": "$BUCKET_NAME.s3.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": "origin-access-identity/cloudfront/$OAI_ID"
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true,
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        }
    },
    "Comment": "Pac-Kiro Game Distribution (Private S3 + OAI)",
    "Enabled": true
}
EOF
    
    DISTRIBUTION_ID=$(aws cloudfront create-distribution \
        --distribution-config file:///tmp/cf-config.json \
        --profile $PROFILE \
        --query 'Distribution.Id' \
        --output text)
    
    echo "✅ CloudFront distribution created: $DISTRIBUTION_ID"
    echo "⏳ Waiting for distribution to deploy (this may take 10-15 minutes)..."
    aws cloudfront wait distribution-deployed --id $DISTRIBUTION_ID --profile $PROFILE
else
    echo "✅ CloudFront distribution already exists: $DISTRIBUTION_ID"
fi

# Get CloudFront domain name
CF_DOMAIN=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --profile $PROFILE --query 'Distribution.DomainName' --output text)
echo "CloudFront domain: $CF_DOMAIN"

# Step 4: Configure Route53
echo ""
echo "🌐 Step 4: Configuring Route53..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --profile $PROFILE --query "HostedZones[?Name=='$ZONE_NAME.'].Id" --output text | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "❌ Error: Hosted zone for $ZONE_NAME not found"
    exit 1
fi

echo "Found hosted zone: $HOSTED_ZONE_ID"

# Create/Update Route53 record
cat > /tmp/route53-change.json <<EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$DOMAIN_NAME",
                "Type": "A",
                "AliasTarget": {
                    "HostedZoneId": "Z2FDTNDATAQYW2",
                    "DNSName": "$CF_DOMAIN",
                    "EvaluateTargetHealth": false
                }
            }
        }
    ]
}
EOF

aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file:///tmp/route53-change.json \
    --profile $PROFILE

echo "✅ Route53 record configured"

# Step 5: Package website
echo ""
echo "📦 Step 5: Packaging website..."
mkdir -p dist
cp index.html dist/
cp style.css dist/
cp game.js dist/
cp kiro-logo.png dist/
cp *.wav dist/ 2>/dev/null || echo "No WAV files found"

echo "✅ Website packaged in dist/"

# Step 6: Deploy to S3
echo ""
echo "🚀 Step 6: Deploying to S3..."
aws s3 sync dist/ "s3://$BUCKET_NAME/" \
    --profile $PROFILE \
    --delete \
    --cache-control "max-age=3600"

echo "✅ Files uploaded to S3"

# Invalidate CloudFront cache
echo ""
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" \
    --profile $PROFILE \
    --no-cli-pager

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎮 Your game is now available at:"
echo "   https://$DOMAIN_NAME"
echo ""
echo "📊 Resources:"
echo "   S3 Bucket: $BUCKET_NAME"
echo "   CloudFront: $DISTRIBUTION_ID"
echo "   SSL Certificate: $CERT_ARN"
echo "   Domain: $DOMAIN_NAME"
echo ""
echo "🔒 SSL/TLS: Enabled (TLS 1.2+)"
echo ""

# Cleanup temp files
rm -f /tmp/bucket-policy.json /tmp/cf-config.json /tmp/route53-change.json /tmp/validation-record.json
