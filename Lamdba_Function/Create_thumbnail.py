import boto3
import cv2
from urllib.parse import unquote_plus
import uuid
from PIL import Image
import sys
import numpy as np
import time
import os
import json

s3_client = boto3.client('s3')
sns_client = boto3.client("sns")

# Set default confidence and nms threshold values
confithreshold = 0.3
nmsthreshold = 0.1

# Function to get class labels
def get_labels(labels_path):
    labelPath = os.path.sep.join([yolo_path, labels_path])
    LABELS = open(labelPath).read().strip().split("\n")
    return LABELS

# Function to get YOLO weights path
def get_weights(weights_path):
    weightsPath = os.path.sep.join([yolo_path, weights_path])
    return weightsPath

# Function to get YOLO config path
def get_config(config_path):
    configPath = os.path.sep.join([yolo_path, config_path])
    return configPath

# Function to load YOLO model
def load_model(configpath, weightspath):
    print("[INFO] loading YOLO from disk...")
    net = cv2.dnn.readNetFromDarknet(configpath, weightspath)
    print("Finished loading YOLO")
    return net

# Function to perform object detection
def do_prediction(image, net, LABELS, id):
    (H, W) = image.shape[:2]
    ln = net.getLayerNames()
    ln = [ln[i - 1] for i in net.getUnconnectedOutLayers()]

    blob = cv2.dnn.blobFromImage(image, 1 / 255.0, (416, 416), swapRB=True, crop=False)
    net.setInput(blob)
    start = time.time()
    layerOutputs = net.forward(ln)
    end = time.time()

    print("[INFO] YOLO took {:.6f} seconds".format(end - start))

    boxes = []
    confidences = []
    classIDs = []

    for output in layerOutputs:
        for detection in output:
            scores = detection[5:]
            classID = np.argmax(scores)
            confidence = scores[classID]

            if confidence > confithreshold:
                box = detection[0:4] * np.array([W, H, W, H])
                (centerX, centerY, width, height) = box.astype("int")

                x = int(centerX - (width / 2))
                y = int(centerY - (height / 2))

                boxes.append([x, y, int(width), int(height)])
                confidences.append(float(confidence))
                classIDs.append(classID)

    idxs = cv2.dnn.NMSBoxes(boxes, confidences, confithreshold, nmsthreshold)

    object_detect = {'id': id, 'objects': []}
    label_od = {}
    if len(idxs) > 0:
        for i in idxs.flatten():
            label_od['label'] = LABELS[classIDs[i]]
            label_od['accuracy'] = confidences[i]
            label_od['rectangle'] = {
                'height': boxes[i][3], 'left': boxes[i][0], 'top': boxes[i][1], 'width': boxes[i][2]}
            object_detect['objects'].append(label_od)
    print("Prediction Completed Successfully!")
    return object_detect

# Path to YOLO config files
yolo_path = str("/tmp")

def create_thumbnail(image_path, thumbnail_path, width, height):
    image = cv2.imread(image_path)
    resized_image = cv2.resize(image, (width, height))
    cv2.imwrite(thumbnail_path, resized_image)
    print("Thumbnail created successfully!")
    return resized_image

# Function to create a record in DynamoDB table
def create_record(userid, thumbnail_path, bucket, key, objects):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('ThumbnailTable')
    table.put_item(
        Item={
            'thumbnail_path': thumbnail_path,
            'bucket': bucket,
            'key': key,
            'userid': userid,
            'objects': objects
        }
    )
    print("Record created successfully!")

# Function to send SNS notification to a specific email
def send_sns_to_user(userid, message, subject):
    dynamodb = boto3.resource('dynamodb')
    user_table = dynamodb.Table('UserTable')
    sns_client = boto3.client('sns')
    
    try:
        # Fetch the email of the user
        print(f"Fetching email for userid: {userid} from UserTable")
        response = user_table.get_item(Key={'userid': userid})
        if 'Item' not in response:
            print("User not found in UserTable. Adding user.")
            # Replace with actual user email, for example from a Cognito event
            user_email = "new_user_email@example.com"  # Placeholder, replace with actual email
            user_table.put_item(
                Item={
                    'userid': userid,
                    'email': user_email
                }
            )
            print(f"User {userid} added to UserTable with email {user_email}")
        else:
            user_email = response['Item']['email']
            print(f"User email found: {user_email}")

        # Create a unique topic name for the user
        topic_name = user_email.replace('@', '_').replace('.', '_')
        response = sns_client.create_topic(Name=topic_name)
        topic_arn = response['TopicArn']

        # Subscribe the user email to the topic if not already subscribed
        subscriptions = sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)['Subscriptions']
        subscribed = any(sub['Endpoint'] == user_email for sub in subscriptions)
        if not subscribed:
            sns_client.subscribe(
                TopicArn=topic_arn,
                Protocol='email',
                Endpoint=user_email
            )
        
        # Publish the message to the user's topic
        result = sns_client.publish(
            TopicArn=topic_arn,
            Message=message,
            Subject=subject,
            MessageAttributes={
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': 'Transactional'
                }
            }
        )
        if result['ResponseMetadata']['HTTPStatusCode'] == 200:
            print("Notification sent successfully to user: ", user_email)
            return True
        else:
            print("Failed to send notification")
            return False

    except Exception as e:
        print("Error occurred while sending notification: ", e)
        return False


def lambda_handler(event, context):
    print(json.dumps(event))
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = unquote_plus(record['s3']['object']['key'])
        tmpkey = key.replace('/', '')
        download_path = '/tmp/{}{}'.format(uuid.uuid4(), tmpkey)
        upload_path = '/tmp/resized-{}'.format(tmpkey)
        s3_client.download_file(bucket, key, download_path)
        create_thumbnail(download_path, upload_path, 200, 200)
        s3_client.upload_file(upload_path, bucket, 'thumbnails/'+key)

        labels_Path = "coco.names"
        cfg_path = "yolov3-tiny.cfg"
        w_path = "yolov3-tiny.weights"

        s3_client.download_file(bucket, unquote_plus('yolo_tiny_configs/coco.names'), '/tmp/coco.names')
        s3_client.download_file(bucket, unquote_plus('yolo_tiny_configs/yolov3-tiny.cfg'), '/tmp/yolov3-tiny.cfg')
        s3_client.download_file(bucket, unquote_plus('yolo_tiny_configs/yolov3-tiny.weights'), '/tmp/yolov3-tiny.weights')

        Lables = get_labels(labels_Path)
        CFG = get_config(cfg_path)
        Weights = get_weights(w_path)

        image = Image.open(download_path)
        npimg = np.array(image)
        image = npimg.copy()
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        nets = load_model(CFG, Weights)
        detect = do_prediction(image, nets, Lables, record['s3']['object']['eTag'])
        print(detect)
        labels = list()

        for object in detect['objects']:
            labels.append(object['label'])

        userid = key.split('/')[1]
        print(f"Extracted userid: {userid}")
        create_record(userid, 'thumbnails/'+key, bucket, key, labels)

        # Send SNS notification to the user
        thumbnail_url = 'https://{}.s3.amazonaws.com/thumbnails/{}'.format(bucket, key)
        message = """
        You got a new Message from PixTag serverless Image storage
        The message is as follows

        id      : {id}
        thumbnail_url: {thumbnail_url}
        """.format(
            id=record['s3']['object']['eTag'],
            thumbnail_url=thumbnail_url,
        )
        subject = 'New Image Uploaded'
        SNS_Result = send_sns_to_user(userid, message, subject)
        if SNS_Result:
            print("Notification Sent..")
        else:
            print("Failed to send notification")

    return {
        'statusCode': 200,
        'body': json.dumps('Process completed successfully')
    }
