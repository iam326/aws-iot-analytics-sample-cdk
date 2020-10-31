import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as IotAnalyticsStack from '../lib/iot-analytics-stack';

test('Empty Stack', () => {
  const app = new cdk.App();
  const props = {
    projectName: 'projectName',
    ioTCertificateName: 'ioTCertificateName',
    pipelineLambdaActivityFunctionName: 'pipelineLambdaActivityFunctionName',
  };
  // WHEN
  const stack = new IotAnalyticsStack.IotAnalyticsStack(
    app,
    'MyTestStack',
    props
  );
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT
    )
  );
});
