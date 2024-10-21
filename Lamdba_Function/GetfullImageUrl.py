import boto3
import json
import uuid
from botocore.exceptions import ClientError


def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('ThumbnailTable')
    s3 = boto3.client('s3')

    print("Event received:", json.dumps(event, indent=2))
    
    
    try:
        query_params = event.get('queryStringParameters', {})
        thumbnail_url = query_params.get('thumbnail_url')


        if not thumbnail_url:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Thumbnail URL is required'})
            }

        # Extracting the user ID and key for DynamoDB
        userid = thumbnail_url.split('/')[2]
        key = '/'.join(thumbnail_url.split('/')[1:]) 

        # Retrieve the item from DynamoDB
        response = table.get_item(
            Key={
                'userid': userid,
                'key': key
            }
        )

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Item not found'})
            }

        item = response['Item']
        bucket = item['bucket']
        full_size_image_key = item.get('key')  # Assuming 'key' contains the full-size image key

        if not full_size_image_key:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Full-size image key not found'})
            }

        # full_size_image_url = f"https://{bucket}.s3.ap-southeast-2.amazonaws.com/{full_size_image_key}"
        full_size_image_url = s3.generate_presigned_url('get_object', Params={'Bucket': bucket, 'Key': full_size_image_key}, ExpiresIn=3600)
        
        
        return {
            'statusCode': 200,
            'body': json.dumps({'full_size_image_url': full_size_image_url})
        }
        

    except ClientError as e:
        print(f"ClientError: {e.response['Error']['Message']}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': e.response['Error']['Message']})
        }

    except Exception as e:
        print(f"Exception: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
