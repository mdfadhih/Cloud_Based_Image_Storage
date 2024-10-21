import boto3
import json
from botocore.exceptions import ClientError

def lambda_handler(event, context):

    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('ThumbnailTable')
    s3 = boto3.client('s3')

    try:
        thumbnail_path = event.get('queryStringParameters', {}).get('thumbnail_path', None)
        if not thumbnail_path:
            return {
                'statusCode': 400,
                'body': json.dumps('Thumbnail path parameter is required')
            }

        bucket = 'amplify-dyo832csdajev-mai-amplifyteamdrivebucket28-xp8sjewf75ei'
        userid = thumbnail_path.split('/')[2]
        key = '/'.join(thumbnail_path.split('/')[1:])  

        response = table.delete_item(
            Key={
                'userid': userid,
                'key': key
            }
        )

        
        print(f"DynamoDB delete response: {json.dumps(response, indent=2)}")

        # Delete the file from S3
        s3_response = s3.delete_object(Bucket=bucket, Key=thumbnail_path)
        print(f"S3 delete response: {json.dumps(s3_response, indent=2)}")

        return {
            'statusCode': 200,
            'body': json.dumps('Image deleted successfully')
        }

    except ClientError as e:
        print(f"ClientError: {e.response['Error']['Message']}")
        return {
            'statusCode': 500,
            'body': json.dumps('Internal Server Error: ' + e.response['Error']['Message'])
        }

    except Exception as e:
        print(f"Exception: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps('Internal Server Error: ' + str(e))
        }
