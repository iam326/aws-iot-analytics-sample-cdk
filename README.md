# aws-iot-analytics-sample-cdk

AWS IoT Analytics の各リソースを CDK で構築するサンプルです

## Environment

```
$ sw_vers
ProductName:	Mac OS X
ProductVersion:	10.15.7
BuildVersion:	19H2

$ aws --version
aws-cli/2.0.28 Python/3.7.4 Darwin/19.6.0 botocore/2.0.0dev32

$ cdk --version
1.70.0 (build c145314)
```

## Usage

```
// 環境変数の設定 - AWS IoT Core で作った 1-Click 証明書を使用します
$ export AWS_IOT_CERTIFICATE_NAME="<証明書の名前>"

$ yarn install
$ yarn build

$ cdk bootstrap
$ cdk deploy --context ioTCertificateName=${AWS_IOT_CERTIFICATE_NAME}
```
