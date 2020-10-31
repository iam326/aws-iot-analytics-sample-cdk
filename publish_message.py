#!/usr/bin/env python3

import datetime
import json
import os
import random
from time import sleep

from awscrt import io, mqtt
from awsiot import mqtt_connection_builder

ENDPOINT = os.environ['AWS_IOT_ENDPOINT']
CLIENT_ID = os.environ['AWS_IOT_CLIENT_ID']
PATH_TO_CERT = 'certificates/certificate.pem.crt'
PATH_TO_KEY = 'certificates/private.pem.key'
PATH_TO_ROOT = 'certificates/AmazonRootCA1.pem'
TOPIC = 'iot/topic'
WAIT_TIME = 10


def main():
    event_loop_group = io.EventLoopGroup(1)
    host_resolver = io.DefaultHostResolver(event_loop_group)
    client_bootstrap = io.ClientBootstrap(event_loop_group, host_resolver)
    mqtt_connection = mqtt_connection_builder.mtls_from_path(
        endpoint=ENDPOINT,
        cert_filepath=PATH_TO_CERT,
        pri_key_filepath=PATH_TO_KEY,
        client_bootstrap=client_bootstrap,
        ca_filepath=PATH_TO_ROOT,
        client_id=CLIENT_ID,
        clean_session=False,
        keep_alive_secs=6
    )

    print('Connecting to {} with client ID {}...'.format(
        ENDPOINT, CLIENT_ID))
    connect_future = mqtt_connection.connect()
    connect_future.result()
    print('Connected!')

    try:
        while True:
            now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            rand = random.randint(0, 50)
            message = {
                'device': {
                    'id': 'device-1',
                    'name': 'hoge'
                },
                'datetime': now,
                'temperature': rand
            }
            mqtt_connection.publish(topic=TOPIC, payload=json.dumps(
                message), qos=mqtt.QoS.AT_LEAST_ONCE)
            print('Published: {} to the topic: {}'.format(
                json.dumps(message), TOPIC))
            sleep(WAIT_TIME)
    except KeyboardInterrupt:
        pass

    disconnect_future = mqtt_connection.disconnect()
    disconnect_future.result()
    print('Disconnected!')


if __name__ == '__main__':
    main()
