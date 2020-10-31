#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';

import { LambdaStack } from '../lib/lambda-stack';
import { IotAnalyticsStack } from '../lib/iot-analytics-sample-stack';

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

new IotAnalyticsStack(app, 'IotAnalyticsStack', {
  ...env,
  pipelineLambdaActivityFunctionName: lambda.function.functionName,
});
