import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';

interface LambdaStackProps extends cdk.StackProps {
  projectName: string;
}

export class LambdaStack extends cdk.Stack {
  public readonly function: lambda.Function;

  constructor(scope: cdk.Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { projectName } = props;

    const lambdaExecutionRole = new iam.Role(this, 'lambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      path: '/',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    const lambdaFunction = new lambda.Function(this, 'lambdaFunction', {
      functionName: `${projectName}_pipeline_lambda_function`,
      handler: 'index.lambda_handler',
      role: lambdaExecutionRole,
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset('src'),
    });
    lambdaFunction.addPermission('LambdaFunctionPermission', {
      principal: new iam.ServicePrincipal('iotanalytics.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });

    this.function = lambdaFunction;
  }
}
