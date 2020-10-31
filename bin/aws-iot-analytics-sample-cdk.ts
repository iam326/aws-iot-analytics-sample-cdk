#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsIotAnalyticsSampleCdkStack } from '../lib/aws-iot-analytics-sample-cdk-stack';

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

new AwsIotAnalyticsSampleCdkStack(app, 'AwsIotAnalyticsSampleCdkStack', env);
