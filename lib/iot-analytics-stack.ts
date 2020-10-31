import * as cdk from '@aws-cdk/core';
import * as iotAnalytics from '@aws-cdk/aws-iotanalytics';

interface IotAnalyticsStackProps extends cdk.StackProps {
  projectName: string;
  pipelineLambdaActivityFunctionName: string;
}

export class IotAnalyticsStack extends cdk.Stack {
  public readonly channel: iotAnalytics.CfnChannel;

  constructor(scope: cdk.Construct, id: string, props: IotAnalyticsStackProps) {
    super(scope, id, props);

    const { projectName, pipelineLambdaActivityFunctionName } = props;

    const channelName = `${projectName}_iot_analytics_channel`;
    const iotAnalyticsChannel = new iotAnalytics.CfnChannel(
      this,
      'IotAnalyticsChannel',
      {
        channelName,
        channelStorage: {
          serviceManagedS3: {},
        },
      }
    );
    this.channel = iotAnalyticsChannel;

    const datastoreName = `${projectName}_iot_analytics_datastore`;
    const iotAnalyticsDatastore = new iotAnalytics.CfnDatastore(
      this,
      'IotAnalyticsDatastore',
      {
        datastoreName,
        datastoreStorage: {
          serviceManagedS3: {},
        },
      }
    );

    const iotAnalyticsPipeline = new iotAnalytics.CfnPipeline(
      this,
      'IotAnalyticsPipeline',
      {
        pipelineName: `${projectName}_iot_analytics_pipeline`,
        pipelineActivities: [
          {
            channel: {
              name: 'pipeline_channel_activity',
              channelName,
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
              datastoreName,
            },
          },
        ],
      }
    );

    const iotAnalyticsDataset = new iotAnalytics.CfnDataset(
      this,
      'IotAnalyticsDataset',
      {
        datasetName: `${projectName}_iot_analytics_dataset`,
        actions: [
          {
            actionName: 'SqlAction',
            queryAction: {
              sqlQuery: `SELECT * FROM ${datastoreName} WHERE __dt > current_date - interval '1' day`,
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
  }
}
