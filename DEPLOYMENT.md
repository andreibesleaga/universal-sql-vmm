# Deployment Guide

This document provides instructions for deploying the Universal SQL VMM in various cloud environments.

## Table of Contents

- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [AWS Deployment](#aws-deployment)
- [Azure Deployment](#azure-deployment)
- [Google Cloud Deployment](#google-cloud-deployment)

## Docker Deployment

### Prerequisites

- Docker installed on your machine
- Docker Compose installed on your machine

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/universal-sql-vmm.git
   cd universal-sql-vmm
   ```

2. Create a `.env` file with your configuration:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

4. Verify the deployment:
   ```bash
   curl http://localhost:3000/health
   ```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster
- kubectl configured to connect to your cluster
- Docker registry access

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/universal-sql-vmm.git
   cd universal-sql-vmm
   ```

2. Build and push the Docker image:
   ```bash
   docker build -t your-registry/universal-sql-vmm:latest .
   docker push your-registry/universal-sql-vmm:latest
   ```

3. Update the Kubernetes deployment files:
   ```bash
   # Replace ${DOCKER_REGISTRY} with your registry in deployment.yaml
   sed -i 's/${DOCKER_REGISTRY}/your-registry/g' kubernetes/deployment.yaml
   ```

4. Create the Kubernetes resources:
   ```bash
   kubectl apply -f kubernetes/configmap.yaml
   kubectl apply -f kubernetes/secrets.yaml
   kubectl apply -f kubernetes/deployment.yaml
   kubectl apply -f kubernetes/service.yaml
   kubectl apply -f kubernetes/ingress.yaml
   kubectl apply -f kubernetes/hpa.yaml
   ```

5. Verify the deployment:
   ```bash
   kubectl get pods
   kubectl get services
   ```

## AWS Deployment

### Using AWS ECS (Elastic Container Service)

1. Create an ECR repository:
   ```bash
   aws ecr create-repository --repository-name universal-sql-vmm
   ```

2. Build and push the Docker image:
   ```bash
   aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com
   docker build -t your-account-id.dkr.ecr.your-region.amazonaws.com/universal-sql-vmm:latest .
   docker push your-account-id.dkr.ecr.your-region.amazonaws.com/universal-sql-vmm:latest
   ```

3. Create an ECS cluster, task definition, and service using the AWS Console or AWS CLI.

### Using AWS EKS (Elastic Kubernetes Service)

1. Create an EKS cluster:
   ```bash
   eksctl create cluster --name universal-sql-vmm --region your-region --nodegroup-name standard-workers --node-type t3.medium --nodes 3 --nodes-min 1 --nodes-max 5
   ```

2. Follow the Kubernetes deployment steps above.

## Azure Deployment

### Using Azure Container Instances

1. Create a resource group:
   ```bash
   az group create --name universal-sql-vmm-rg --location eastus
   ```

2. Create a container registry:
   ```bash
   az acr create --resource-group universal-sql-vmm-rg --name universalsqlvmmacr --sku Basic
   ```

3. Build and push the Docker image:
   ```bash
   az acr login --name universalsqlvmmacr
   docker build -t universalsqlvmmacr.azurecr.io/universal-sql-vmm:latest .
   docker push universalsqlvmmacr.azurecr.io/universal-sql-vmm:latest
   ```

4. Create a container instance:
   ```bash
   az container create --resource-group universal-sql-vmm-rg --name universal-sql-vmm --image universalsqlvmmacr.azurecr.io/universal-sql-vmm:latest --dns-name-label universal-sql-vmm --ports 3000 3443 50051
   ```

### Using Azure Kubernetes Service (AKS)

1. Create an AKS cluster:
   ```bash
   az aks create --resource-group universal-sql-vmm-rg --name universal-sql-vmm-aks --node-count 3 --enable-addons monitoring --generate-ssh-keys
   ```

2. Connect to the cluster:
   ```bash
   az aks get-credentials --resource-group universal-sql-vmm-rg --name universal-sql-vmm-aks
   ```

3. Follow the Kubernetes deployment steps above.

## Google Cloud Deployment

### Using Google Cloud Run

1. Build and push the Docker image:
   ```bash
   gcloud builds submit --tag gcr.io/your-project-id/universal-sql-vmm
   ```

2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy universal-sql-vmm --image gcr.io/your-project-id/universal-sql-vmm --platform managed --allow-unauthenticated
   ```

### Using Google Kubernetes Engine (GKE)

1. Create a GKE cluster:
   ```bash
   gcloud container clusters create universal-sql-vmm-cluster --num-nodes=3
   ```

2. Get credentials for the cluster:
   ```bash
   gcloud container clusters get-credentials universal-sql-vmm-cluster
   ```

3. Follow the Kubernetes deployment steps above.

## Environment Variables

The following environment variables can be configured for the application:

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment (development, production) | development |
| PORT | HTTP port | 3000 |
| HTTPS_PORT | HTTPS port | 3443 |
| USE_HTTPS | Enable HTTPS | false |
| JWT_SECRET | Secret for JWT tokens | (required in production) |
| JWT_EXPIRATION | JWT token expiration | 1h |
| QUERY_CACHE_TTL | Cache TTL in milliseconds | 60000 |
| QUERY_CACHE_MAX_SIZE | Maximum cache size | 1000 |
| DATABASE_TIMEOUT | Database timeout in milliseconds | 5000 |
| REDIS_TIMEOUT | Redis timeout in milliseconds | 2000 |
| KAFKA_TIMEOUT | Kafka timeout in milliseconds | 10000 |
| ETHEREUM_TIMEOUT | Ethereum timeout in milliseconds | 30000 |
| HEDERA_TIMEOUT | Hedera timeout in milliseconds | 30000 |
| HYPERLEDGER_TIMEOUT | Hyperledger timeout in milliseconds | 30000 |

## Monitoring and Logging

For production deployments, consider setting up:

1. **Prometheus** for metrics collection
2. **Grafana** for visualization
3. **ELK Stack** or **Cloud-native logging** for log aggregation
4. **Alerting** for critical issues

## Security Considerations

1. Always use a secure JWT secret in production
2. Enable HTTPS in production
3. Use proper network security (firewalls, VPCs)
4. Regularly update dependencies
5. Follow the security guidelines in SECURITY.md