#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';

import { LambdaStack } from '../lib/lambda-stack';
import { IotAnalyticsStack } from '../lib/iot-analytics-stack';
import { IotCoreStack } from '../lib/iot-core-stack';

export type Environment = {
  projectName: string;
  ioTCertificateName: string;
};

const app = new cdk.App();
const projectName: string = app.node.tryGetContext('projectName');
const ioTCertificateName: string = app.node.tryGetContext('ioTCertificateName');
const env: Environment = {
  projectName,
  ioTCertificateName,
};

const lambda = new LambdaStack(app, 'LambdaStack', env);
const iotAnalytics = new IotAnalyticsStack(app, 'IotAnalyticsStack', {
  ...env,
  pipelineLambdaActivityFunctionName: lambda.function.functionName,
});
const iotCoreStack = new IotCoreStack(app, 'IotCoreStack', {
  ...env,
  iotAnalyticsChannelName: iotAnalytics.channel.channelName as string,
});
iotCoreStack.addDependency(iotAnalytics);
