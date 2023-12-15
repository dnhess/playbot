import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as containerregistry from "@pulumi/azure-native/containerregistry";
import * as app from "@pulumi/azure-native/app";
import * as docker from "@pulumi/docker";
import * as operationalinsights from "@pulumi/azure-native/operationalinsights";

// Import the program's configuration settings.
const config = new pulumi.Config();
const discordBotPath = config.get("discordBotPath") || "./app";
const imageTag = config.get("imageTag") || "latest";
const cpu = config.getNumber("cpu") || 1;
const memory = config.getNumber("memory") || 2;
const discordBotContainerName = config.require("discordBotContainerName")
const discordBotImageName = config.require("discordBotImageName");
const environment = config.require("environment");

// Create a resource group for the container registry.
const resourceGroup = new resources.ResourceGroup("playbot-rg", {
    tags: {
        environment: environment,
        app: `${discordBotContainerName}-app`,
    },
});

const workspace = new operationalinsights.Workspace("loganalytics", {
  resourceGroupName: resourceGroup.name,
  sku: {
      name: "PerGB2018",
  },
  retentionInDays: 30,
});

const workspaceSharedKeys = operationalinsights.getSharedKeysOutput({
  resourceGroupName: resourceGroup.name,
  workspaceName: workspace.name,
});

const managedEnv = new app.ManagedEnvironment("env", {
  resourceGroupName: resourceGroup.name,
  appLogsConfiguration: {
      destination: "log-analytics",
      logAnalyticsConfiguration: {
          customerId: workspace.customerId,
          sharedKey: workspaceSharedKeys.apply((r: operationalinsights.GetSharedKeysResult) => r.primarySharedKey!),
      },
  },
});

// Create a container registry.
const registry = new containerregistry.Registry("registry", {
    resourceGroupName: resourceGroup.name,
    adminUserEnabled: true,
    sku: {
        name: containerregistry.SkuName.Basic,
    },
    tags: {
      environment: environment,
      app: `${discordBotContainerName}-app`,
  },
});

// Fetch login credentials for the registry.
const credentials = containerregistry.listRegistryCredentialsOutput({
    resourceGroupName: resourceGroup.name,
    registryName: registry.name,
}).apply(creds => {
    return {
        username: creds.username!,
        password: creds.passwords![0].value!,
    };
});

// Create a container image for the service.
const discordBotImage = new docker.Image("discord-app", {
    imageName: pulumi.interpolate`${registry.loginServer}/${discordBotImageName}:${imageTag}`,
    build: {
        context: discordBotPath,
        platform: "linux/amd64",
    },
    registry: {
        server: registry.loginServer,
        username: credentials.username,
        password: credentials.password,
    },
});

// Create a container app for the service (discord-bot).
const containerApp = new app.ContainerApp(discordBotContainerName, {
  resourceGroupName: resourceGroup.name,
  managedEnvironmentId: managedEnv.id,
    tags: {
      environment: environment,
      app: `${discordBotContainerName}-app`,
  },
  configuration: {
      ingress: {
          external: true,
          targetPort: 80,
      },
      registries: [{
          server: registry.loginServer,
          username: credentials.username,
          passwordSecretRef: "pwd",
      }],
      secrets: [{
          name: "pwd",
          value: credentials.password,
      }],
  },
  template: {
      containers: [{
          name: discordBotContainerName,
          image: discordBotImage.repoDigest,
          probes: [{  // Adding health check probe here
            httpGet: {
                path: "/health",
                port: 80, // Make sure this matches the port your Express server is listening on
            },
            initialDelaySeconds: 3,
            periodSeconds: 3,
            type: "Liveness",  // This is a liveness probe
        }],
          resources: {
                  cpu: cpu,
                  memory: `${memory}Gi`,
              },
      }],
      scale: {
          maxReplicas: 1,
          minReplicas: 1
      },
  },
});

// Export the service's IP address, hostname, and fully-qualified URL.
export const url = pulumi.interpolate`https://${containerApp.configuration.apply((c: any) => c?.ingress?.fqdn)}`;
