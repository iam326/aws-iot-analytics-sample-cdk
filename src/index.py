import logging
import sys

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)
streamHandler = logging.StreamHandler(stream=sys.stdout)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
streamHandler.setFormatter(formatter)
logger.addHandler(streamHandler)


def lambda_handler(event, context):
    logger.info("event before processing: {}".format(event))
    for e in event:
        if 'temperature' in e:
            e['temperature_copy'] = e['temperature']
    logger.info("event after processing: {}".format(event))
    return event
