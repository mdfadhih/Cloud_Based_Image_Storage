import boto3
import cv2
import uuid
from PIL import Image
import numpy as np
import time
import os
import base64
import json

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ThumbnailTable')

yolo_path = "/tmp"
labels_path = "coco.names"
config_path = "yolov3-tiny.cfg"
weights_path = "yolov3-tiny.weights"

confithreshold = 0.3
nmsthreshold = 0.1

def get_labels(labels_path):
    labelPath = os.path.sep.join([yolo_path, labels_path])
    LABELS = open(labelPath).read().strip().split("\n")
    return LABELS

def get_weights(weights_path):
    weightsPath = os.path.sep.join([yolo_path, weights_path])
    return weightsPath

def get_config(config_path):
    configPath = os.path.sep.join([yolo_path, config_path])
    return configPath

def load_model(configpath, weightspath):
    print("[INFO] loading YOLO from disk...")
    net = cv2.dnn.readNetFromDarknet(configpath, weightspath)
    print("Finished loading YOLO")
    return net

def do_prediction(image, net, LABELS):
    (H, W) = image.shape[:2]
    ln = net.getLayerNames()
    ln = [ln[i - 1] for i in net.getUnconnectedOutLayers()]
    blob = cv2.dnn.blobFromImage(image, 1 / 255.0, (416, 416), swapRB=True, crop=False)
    net.setInput(blob)
    layerOutputs = net.forward(ln)
    boxes, confidences, classIDs = [], [], []

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
    detected_labels = []
    if len(idxs) > 0:
        for i in idxs.flatten():
            detected_labels.append(LABELS[classIDs[i]])
    return detected_labels

def generate_presigned_url(bucket, key):
    return s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket, 'Key': key},
        ExpiresIn=3600  # URL valid for 1 hour
    )

def lambda_handler(event, context):
    try:
        # Decode the image from the base64 encoded string
        body = json.loads(event['body'])
        image_data = base64.b64decode(body['image'])

        # Save the image to /tmp for processing
        image_path = f"/tmp/{uuid.uuid4()}.jpg"
        with open(image_path, "wb") as image_file:
            image_file.write(image_data)

        # Read the image using OpenCV
        image = cv2.imread(image_path)

        # Load YOLO model and detect objects
        bucket_name = 'amplify-dyo832csdajev-mai-amplifyteamdrivebucket28-xp8sjewf75ei'.strip()
        yolo_config_files = {
            'labels': 'yolo_tiny_configs/coco.names',
            'config': 'yolo_tiny_configs/yolov3-tiny.cfg',
            'weights': 'yolo_tiny_configs/yolov3-tiny.weights'
        }

        for key, path in yolo_config_files.items():
            local_path = f'{yolo_path}/{os.path.basename(path)}'
            print(f"Downloading {path} to {local_path}")
            s3_client.download_file(bucket_name, path, local_path)

        labels = get_labels(labels_path)
        net = load_model(get_config(config_path), get_weights(weights_path))

        detected_labels = do_prediction(image, net, labels)
        print(f"Detected tags: {detected_labels}")

        if not detected_labels:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No tags detected in the image'})
            }

        # Query DynamoDB to find images with all detected tags
        filter_expression = " AND ".join([f"contains(objects, :tag{i})" for i in range(len(detected_labels))])
        expression_attribute_values = {f":tag{i}": tag for i, tag in enumerate(detected_labels)}
        
        response = table.scan(
            FilterExpression=filter_expression,
            ExpressionAttributeValues=expression_attribute_values
        )

        items = response.get('Items', [])
        matched_items = []
        for item in items:
            if all(tag in item['objects'] for tag in detected_labels):
                matched_items.append(item)

        links = [generate_presigned_url(item['bucket'], item['thumbnail_path']) for item in matched_items]

        return {
            'statusCode': 200,
            'body': json.dumps({'links': links})
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
