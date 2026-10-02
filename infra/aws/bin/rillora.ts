#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { RilloraStagingStack } from "../lib/rillora-staging-stack.js";
import { RilloraOperationsStack } from "../lib/rillora-operations-stack.js";
import { RilloraProductionPreflightStack } from "../lib/rillora-production-preflight-stack.js";
import { RilloraProductionStack } from "../lib/rillora-production-stack.js";
import { RilloraMailStack } from "../lib/rillora-mail-stack.js";
import { RilloraPublicWebStack } from "../lib/rillora-public-web-stack.js";
import { RilloraProductionWebStack } from "../lib/rillora-production-web-stack.js";

const app = new App();
const desiredCountContext = app.node.tryGetContext("serviceDesiredCount");
const desiredCount = Number(desiredCountContext ?? 0);
if (!Number.isInteger(desiredCount) || desiredCount < 0 || desiredCount > 2) {
  throw new Error("serviceDesiredCount must be an integer between 0 and 2");
}
const stripeTestIntegrationContext = app.node.tryGetContext("stripeTestIntegrationEnabled");
const stripeTestIntegrationEnabled = stripeTestIntegrationContext === true
  || stripeTestIntegrationContext === "true";
if (
  stripeTestIntegrationContext !== undefined
  && ![true, false, "true", "false"].includes(stripeTestIntegrationContext)
) {
  throw new Error("stripeTestIntegrationEnabled must be true or false");
}
const appleStoreKitSandboxContext = app.node.tryGetContext("appleStoreKitSandboxEnabled");
const maintenancePreviewContext = app.node.tryGetContext("familyMaintenancePreviewEnabled");
if (maintenancePreviewContext !== undefined && ![true,false,"true","false"].includes(maintenancePreviewContext)) {
  throw new Error("familyMaintenancePreviewEnabled must be true or false");
}
const familyMaintenancePreviewEnabled = maintenancePreviewContext === true || maintenancePreviewContext === "true";
const deletionContext = app.node.tryGetContext("accountDeletionEnabled");
if (deletionContext !== undefined && ![true,false,"true","false"].includes(deletionContext)) throw new Error("accountDeletionEnabled must be true or false");
const accountDeletionEnabled = deletionContext === true || deletionContext === "true";
const verificationContext = app.node.tryGetContext("emailVerificationEnabled");
if (verificationContext !== undefined && ![true,false,"true","false"].includes(verificationContext)) throw new Error("emailVerificationEnabled must be true or false");
const emailVerificationEnabled = verificationContext === true || verificationContext === "true";
const contentProtectionMode = app.node.tryGetContext("contentProtectionMode") ?? "encrypted";
if (!["read-compatible", "encrypted"].includes(contentProtectionMode)) throw new Error("contentProtectionMode must retain a compatible reader");
const contentMigrationContext = app.node.tryGetContext("contentMigrationEnabled");
if (contentMigrationContext !== undefined && ![true,false,"true","false"].includes(contentMigrationContext)) throw new Error("contentMigrationEnabled must be true or false");
const contentMigrationEnabled = contentMigrationContext === true || contentMigrationContext === "true";
const appleStoreKitSandboxEnabled = appleStoreKitSandboxContext === true
  || appleStoreKitSandboxContext === "true";
if (
  appleStoreKitSandboxContext !== undefined
  && ![true, false, "true", "false"].includes(appleStoreKitSandboxContext)
) {
  throw new Error("appleStoreKitSandboxEnabled must be true or false");
}

const operationsOnly = app.node.tryGetContext("operationsOnly");
const productionPreflightOnly=app.node.tryGetContext("productionPreflightOnly");
if(productionPreflightOnly!==undefined && ![true,false,"true","false"].includes(productionPreflightOnly)) throw new Error("productionPreflightOnly must be true or false");
const preflightSelected=productionPreflightOnly===true||productionPreflightOnly==="true";
const productionFoundationOnly=app.node.tryGetContext("productionFoundationOnly");
if(productionFoundationOnly!==undefined && ![true,false,"true","false"].includes(productionFoundationOnly)) throw new Error("productionFoundationOnly must be true or false");
const productionSelected=productionFoundationOnly===true||productionFoundationOnly==="true";
const mailOnly = app.node.tryGetContext("mailOnly");
if (mailOnly !== undefined && ![true, false, "true", "false"].includes(mailOnly)) throw new Error("mailOnly must be true or false");
const mailSelected = mailOnly === true || mailOnly === "true";
const publicWebOnly = app.node.tryGetContext('publicWebOnly');
if (publicWebOnly !== undefined && ![true, false, 'true', 'false'].includes(publicWebOnly)) throw new Error('publicWebOnly must be true or false');
const publicWebSelected = publicWebOnly === true || publicWebOnly === 'true';
const productionWebOnly = app.node.tryGetContext('productionWebOnly');
if (productionWebOnly !== undefined && ![true, false, 'true', 'false'].includes(productionWebOnly)) throw new Error('productionWebOnly must be true or false');
const productionWebSelected = productionWebOnly === true || productionWebOnly === 'true';
if([preflightSelected,productionSelected,mailSelected,publicWebSelected,productionWebSelected,operationsOnly===true||operationsOnly==="true"].filter(Boolean).length>1) throw new Error("Select exactly one infrastructure stack mode");
if (operationsOnly !== undefined && ![true, false, "true", "false"].includes(operationsOnly)) {
  throw new Error("operationsOnly must be true or false");
}
if (productionWebSelected) {
  const review = app.node.tryGetContext('productionWebReviewEnabled');
  if (review !== undefined && ![true, false, 'true', 'false'].includes(review)) throw new Error('productionWebReviewEnabled must be true or false');
  new RilloraProductionWebStack(app, 'RilloraProductionWeb', {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT || undefined, region: 'eu-central-1' },
    description: 'Closed production Web client and same-origin API delivery; no account activation',
    certificateArn: app.node.tryGetContext('productionWebCertificateArn') ?? '',
    reviewEnabled: review === true || review === 'true',
  });
} else if (publicWebSelected) {
  new RilloraPublicWebStack(app, 'RilloraPublicWeb', {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT || undefined, region: 'eu-central-1' },
    description: 'Read-only public Rillora website; no account, private data or purchase routes',
    certificateArn: app.node.tryGetContext('publicWebCertificateArn') ?? '',
  });
} else if (mailSelected) {
  new RilloraMailStack(app, "RilloraMail", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT || undefined, region: "eu-central-1" },
    description: "Rillora transaction mail domain and aggregate delivery signals; no customer activation",
  });
} else if(productionSelected){
  const runtime=app.node.tryGetContext('productionRuntimeEnabled');
  if(runtime!==undefined && ![true,false,'true','false'].includes(runtime))throw new Error('productionRuntimeEnabled must be true or false');
  const runtimeDesiredCount=Number(app.node.tryGetContext('productionRuntimeDesiredCount')??0);
  if(![0,1].includes(runtimeDesiredCount))throw new Error('productionRuntimeDesiredCount must be 0 or 1');
  const reviewFlag=(name:string)=>{const value=app.node.tryGetContext(name);
    if(value!==undefined&&![true,false,'true','false'].includes(value))throw new Error(`${name} must be true or false`);
    return value===true||value==='true';};
  new RilloraProductionStack(app,"RilloraProduction",{
    env:{account:process.env.CDK_DEFAULT_ACCOUNT||undefined,region:"eu-central-1"},
    description:"Closed Rillora production data foundation and isolated recovery; no public traffic or billing",
    runtimeEnabled:runtime===true||runtime==='true',runtimeDesiredCount:runtimeDesiredCount as 0|1,
    reviewPrepared:reviewFlag('productionReviewPrepared'),reviewEnabled:reviewFlag('productionReviewEnabled'),
    retentionEnabled:reviewFlag('productionRetentionEnabled'),
    identityServicesEnabled:reviewFlag('productionIdentityServicesEnabled'),
    runtimeImageTag:app.node.tryGetContext('productionRuntimeImageTag'),
  });
} else if(preflightSelected){
  new RilloraProductionPreflightStack(app,"RilloraProductionPreflight",{
    env:{account:process.env.CDK_DEFAULT_ACCOUNT||undefined,region:"eu-central-1"},
    description:"Read-only Rillora production readiness; no new runtime, database, plan upgrade or sales",
  });
} else if (operationsOnly === true || operationsOnly === "true") {
  const operationsEnabled = app.node.tryGetContext("operationsEnabled");
  if (operationsEnabled !== undefined && ![true, false, "true", "false"].includes(operationsEnabled)) {
    throw new Error("operationsEnabled must be true or false");
  }
  const appleMonitoring = app.node.tryGetContext('appleProductionMonitoringEnabled');
  if (appleMonitoring !== undefined && ![true, false, 'true', 'false'].includes(appleMonitoring)) {
    throw new Error('appleProductionMonitoringEnabled must be true or false');
  }
  const appleReviewMonitoring = app.node.tryGetContext('appleReviewMonitoringEnabled');
  if (appleReviewMonitoring !== undefined && ![true, false, 'true', 'false'].includes(appleReviewMonitoring)) {
    throw new Error('appleReviewMonitoringEnabled must be true or false');
  }
  const retentionMonitoring=app.node.tryGetContext('retentionMonitoringEnabled');
  if(retentionMonitoring!==undefined&&![true,false,'true','false'].includes(retentionMonitoring))throw new Error('retentionMonitoringEnabled must be true or false');
  const snapshotRetirement=app.node.tryGetContext('snapshotRetirementEnabled');
  if(snapshotRetirement!==undefined&&![true,false,'true','false'].includes(snapshotRetirement))throw new Error('snapshotRetirementEnabled must be true or false');
  new RilloraOperationsStack(app, "RilloraOperations", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT || undefined, region: "eu-central-1" },
    scheduleEnabled: operationsEnabled === true || operationsEnabled === "true",
    appleProductionMonitoringEnabled: appleMonitoring === true || appleMonitoring === 'true',
    appleReviewMonitoringEnabled: appleReviewMonitoring === true || appleReviewMonitoring === 'true',
    retentionMonitoringEnabled:retentionMonitoring===true||retentionMonitoring==='true',
    snapshotRetirementEnabled:snapshotRetirement===true||snapshotRetirement==='true',
    description: "Rillora public health scheduling and alarms; no access to private application data",
  });
} else new RilloraStagingStack(app, "RilloraStaging", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || undefined,
    region: "eu-central-1",
  },
  desiredCount,
  stripeTestIntegrationEnabled,
  appleStoreKitSandboxEnabled,
  familyMaintenancePreviewEnabled,
  accountDeletionEnabled,
  emailVerificationEnabled,
  contentProtectionMode,
  contentMigrationEnabled,
  description: "Synthetic-only Rillora staging API and PostgreSQL in AWS Frankfurt",
});
