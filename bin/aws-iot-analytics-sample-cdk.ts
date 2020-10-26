#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsIotAnalyticsSampleCdkStack } from '../lib/aws-iot-analytics-sample-cdk-stack';

const app = new cdk.App();
new AwsIotAnalyticsSampleCdkStack(app, 'AwsIotAnalyticsSampleCdkStack');
