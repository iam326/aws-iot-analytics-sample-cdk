import * as cdk from '@aws-cdk/core';
import * as iot from '@aws-cdk/aws-iot';
import * as iotAnalytics from '@aws-cdk/aws-iotanalytics';
import * as iam from '@aws-cdk/aws-iam';

interface IotAnalyticsStackProps extends cdk.StackProps {
  projectName: string;
  ioTCertificateName: string;
  pipelineLambdaActivityFunctionName: string;
}

export class IotAnalyticsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: IotAnalyticsStackProps) {
    super(scope, id, props);

    const { accountId, region } = new cdk.ScopedAws(this);
    const {
      projectName,
      ioTCertificateName,
      pipelineLambdaActivityFunctionName,
    } = props;
    const ioTCertificateArn = `arn:aws:iot:${region}:${accountId}:cert/${ioTCertificateName}`;

    /* AWS IoT Core */

    const iotPolicy = new iot.CfnPolicy(this, `${projectName}_iot_policy`, {
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
      policyName: `${projectName}_iot_policy`,
    });
    const iotPolicyName = iotPolicy.policyName as string;

    const iotThing = new iot.CfnThing(this, `${projectName}_iot_thing`, {
      thingName: `${projectName}_iot_thing`,
    });
    const iotThingName = iotThing.thingName as string;

    const iotPolicyPrincipalAttachment = new iot.CfnPolicyPrincipalAttachment(
      this,
      `${projectName}_iot_policy_principal_attachment`,
      {
        policyName: iotPolicyName,
        principal: ioTCertificateArn,
      }
    );
    iotPolicyPrincipalAttachment.addDependsOn(iotPolicy);

    const iotThingPrincipalAttachment = new iot.CfnThingPrincipalAttachment(
      this,
      `${projectName}_iot_thing_principal_attachment`,
      {
        thingName: iotThingName,
        principal: ioTCertificateArn,
      }
    );
    iotThingPrincipalAttachment.addDependsOn(iotThing);

    /* AWS IoT Analytics */

    const iotAnalyticsChannel = new iotAnalytics.CfnChannel(
      this,
      `${projectName}_iot_analytics_channel`,
      {
        channelName: `${projectName}_iot_analytics_channel`,
        channelStorage: {
          serviceManagedS3: {},
        },
      }
    );

    const iotAnalyticsDatastore = new iotAnalytics.CfnDatastore(
      this,
      `${projectName}_iot_analytics_datastore`,
      {
        datastoreName: `${projectName}_iot_analytics_datastore`,
        datastoreStorage: {
          serviceManagedS3: {},
        },
      }
    );

    const iotAnalyticsPipeline = new iotAnalytics.CfnPipeline(
      this,
      `${projectName}_iot_analytics_pipeline`,
      {
        pipelineName: `${projectName}_iot_analytics_pipeline`,
        pipelineActivities: [
          {
            channel: {
              name: 'pipeline_channel_activity',
              channelName: iotAnalyticsChannel.channelName,
              next: 'pipeline_add_attributes_activity',
            },
            addAttributes: {
              name: 'pipeline_add_attributes_activity',
              attributes: {
                'device.id': 'id',
                'device.name': 'name',
              },
              next: 'pipeline_remove_attributes_activity',
            },
            removeAttributes: {
              name: 'pipeline_remove_attributes_activity',
              attributes: ['device'],
              next: 'pipeline_filter_activity',
            },
            filter: {
              name: 'pipeline_filter_activity',
              filter: 'temperature >= 10 AND temperature <= 40',
              next: 'pipeline_math_activity',
            },
            math: {
              name: 'pipeline_math_activity',
              attribute: 'temperature_f',
              math: 'temperature * 1.8 + 32',
              next: 'pipeline_lambda_activity',
            },
            lambda: {
              name: 'pipeline_lambda_activity',
              batchSize: 1,
              lambdaName: pipelineLambdaActivityFunctionName,
              next: 'pipeline_datastore_activity',
            },
            datastore: {
              name: 'pipeline_datastore_activity',
              datastoreName: iotAnalyticsDatastore.datastoreName,
            },
          },
        ],
      }
    );

    const iotAnalyticsDataset = new iotAnalytics.CfnDataset(
      this,
      `${projectName}_iot_analytics_dataset`,
      {
        datasetName: `${projectName}_iot_analytics_dataset`,
        actions: [
          {
            actionName: 'SqlAction',
            queryAction: {
              sqlQuery: `SELECT * FROM ${iotAnalyticsDatastore.datastoreName} WHERE __dt > current_date - interval '1' day`,
            },
          },
        ],
        retentionPeriod: {
          numberOfDays: 1,
          unlimited: false,
        },
        triggers: [
          {
            schedule: {
              scheduleExpression: 'rate(5 minute)',
            },
          },
        ],
      }
    );
    iotAnalyticsDataset.addDependsOn(iotAnalyticsDatastore);

    const iotBatchPutMessageRole = new iam.Role(
      this,
      `${projectName}_iot_batch_put_message_role`,
      {
        assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
        path: '/',
      }
    );
    iotBatchPutMessageRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['iotanalytics:BatchPutMessage'],
        resources: [
          `arn:aws:iotanalytics:${region}:${accountId}:channel/${iotAnalyticsChannel.channelName}`,
        ],
      })
    );

    const IoTTopicRule = new iot.CfnTopicRule(
      this,
      `${projectName}_iot_topic_rule`,
      {
        ruleName: `${projectName}_iot_topic_rule`,
        topicRulePayload: {
          actions: [
            {
              iotAnalytics: {
                channelName: `${projectName}_iot_analytics_channel`,
                roleArn: iotBatchPutMessageRole.roleArn,
              },
            },
          ],
          awsIotSqlVersion: '2016-03-23',
          ruleDisabled: false,
          sql: "SELECT * FROM 'iot/topic'",
        },
      }
    );
  }
}
