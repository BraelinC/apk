# APK Release Guide

How to upload and publish APKs to the distribution app.

## Prerequisites

- R2 credentials configured
- Convex deployment access

## Quick Upload

```bash
cd /home/claude2/apk-distribution

# 1. Upload APK to R2
python3 << 'EOF'
import boto3
from botocore.config import Config

s3 = boto3.client(
    's3',
    endpoint_url='https://e916ecaf8740e573530fbc483d04c7c1.r2.cloudflarestorage.com',
    aws_access_key_id='dcc1b5bafad748c86bcc27efb81ee5ea',
    aws_secret_access_key='444a29a6f82e33d26f8ba5bdfa350565c575eb4d378598bb2d7d43f3888943ac',
    config=Config(signature_version='s3v4'),
    region_name='auto'
)

# Change these values
APK_PATH = "/tmp/your-app.apk"
PROJECT = "your-project"
VERSION = "1.0.0"

with open(APK_PATH, 'rb') as f:
    s3.put_object(
        Bucket='apk-builds',
        Key=f'{PROJECT}/v{VERSION}/{PROJECT}-release.apk',
        Body=f,
        ContentType='application/vnd.android.package-archive'
    )
print(f"Uploaded to: https://pub-8d9a562c03ac408b89163036650efc98.r2.dev/{PROJECT}/v{VERSION}/{PROJECT}-release.apk")
EOF

# 2. Add to database (get project ID first if new project)
CONVEX_DEPLOYMENT=prod:moonlit-meadowlark-409 npx convex run --prod apks:create '{
  "projectId": "YOUR_PROJECT_ID",
  "version": "1.0.0",
  "fileName": "app-release.apk",
  "fileSize": 115000000,
  "downloadUrl": "https://pub-8d9a562c03ac408b89163036650efc98.r2.dev/PROJECT/v1.0.0/PROJECT-release.apk",
  "buildType": "release",
  "notes": "Release notes here"
}'
```

## Create New Project

```bash
CONVEX_DEPLOYMENT=prod:moonlit-meadowlark-409 npx convex run --prod projects:create '{
  "name": "My App",
  "packageName": "com.example.myapp",
  "description": "App description"
}'
# Returns project ID like: "j978wv1hvtmnv20e3gvet9yfc17zer7f"
```

## R2 Details

| Setting | Value |
|---------|-------|
| Bucket | `apk-builds` |
| Public URL | `https://pub-8d9a562c03ac408b89163036650efc98.r2.dev/` |
| Endpoint | `https://e916ecaf8740e573530fbc483d04c7c1.r2.cloudflarestorage.com` |

## File Structure

```
apk-builds/
├── healthymama/
│   └── v1.0.0/
│       └── healthymama-release.apk
├── another-app/
│   ├── v1.0.0/
│   └── v1.1.0/
```

## Convex Deployment

```
CONVEX_DEPLOYMENT=prod:moonlit-meadowlark-409
```

## View App

https://apk-distribution.vercel.app
