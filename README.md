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

$ python3 --version
Python 3.8.5
```

## Usage

### Deploy

```
// 環境変数の設定 - AWS IoT Core で作った 1-Click 証明書を使用します
$ export AWS_IOT_CERTIFICATE_NAME="<証明書の名前>"

$ yarn install
$ yarn build

$ cdk bootstrap
$ cdk list
LambdaStack
IotAnalyticsStack
IotCoreStack
$ cdk deploy --context ioTCertificateName=${AWS_IOT_CERTIFICATE_NAME} IotCoreStack
```

### Publish messages

```
$ export AWS_IOT_ENDPOINT="<カスタムエンドポイント>"
$ export AWS_IOT_CLIENT_ID="<モノの名前>"

// メッセージ送信
$ pip3 install -r requirements.txt
$ python3 publish_message.py

Connecting to hogehoge.iot.ap-northeast-1.amazonaws.com with client ID aws_iot_analytics_sample_iot_thing...
Connected!
Published: {"device": {"id": "device-1", "name": "hoge"}, "datetime": "2020-10-24 01:19:54", "temperature": 21} to the topic: iot/topic
Published: {"device": {"id": "device-1", "name": "hoge"}, "datetime": "2020-10-24 01:20:04", "temperature": 39} to the topic: iot/topic

...

Disconnected!
```

