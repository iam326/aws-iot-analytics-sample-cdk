import * as cdk from '@aws-cdk/core';
import * as iot from '@aws-cdk/aws-iot';
import * as iam from '@aws-cdk/aws-iam';

interface IotCoreStackProps extends cdk.StackProps {
  projectName: string;
  ioTCertificateName: string;
  iotAnalyticsChannelName: string;
}

export class IotCoreStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: IotCoreStackProps) {
    super(scope, id, props);

    const { accountId, region } = new cdk.ScopedAws(this);
    const { projectName, ioTCertificateName, iotAnalyticsChannelName } = props;
    const ioTCertificateArn = `arn:aws:iot:${region}:${accountId}:cert/${ioTCertificateName}`;

    const policyName = `${projectName}_iot_policy`;
    const iotPolicy = new iot.CfnPolicy(this, 'IotPolicy', {
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: 'iot:*',
            Resource: '*',
          },
        ],
      },
      policyName,
    });

    const thingName = `${projectName}_iot_thing`;
    const iotThing = new iot.CfnThing(this, 'IotThing', { thingName });

    const iotPolicyPrincipalAttachment = new iot.CfnPolicyPrincipalAttachment(
      this,
      'IotPolicyPrincipalAttachment',
      {
        policyName,
        principal: ioTCertificateArn,
      }
    );
    iotPolicyPrincipalAttachment.addDependsOn(iotPolicy);

    const iotThingPrincipalAttachment = new iot.CfnThingPrincipalAttachment(
      this,
      'IotThingPrincipalAttachment',
      {
        thingName,
        principal: ioTCertificateArn,
      }
    );
    iotThingPrincipalAttachment.addDependsOn(iotThing);

    const iotBatchPutMessageRole = new iam.Role(
      this,
      'IotBatchPutMessageRole',
      {
        assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
        path: '/',
      }
    );
    iotBatchPutMessageRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['iotanalytics:BatchPutMessage'],
        resources: [
          `arn:aws:iotanalytics:${region}:${accountId}:channel/${iotAnalyticsChannelName}`,
        ],
      })
    );

    const IoTTopicRule = new iot.CfnTopicRule(this, 'IotTopicRule', {
      ruleName: `${projectName}_iot_topic_rule`,
      topicRulePayload: {
        actions: [
          {
            iotAnalytics: {
              channelName: iotAnalyticsChannelName,
              roleArn: iotBatchPutMessageRole.roleArn,
            },
          },
        ],
        awsIotSqlVersion: '2016-03-23',
        ruleDisabled: false,
        sql: "SELECT * FROM 'iot/topic'",
      },
    });
  }
}
