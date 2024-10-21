import json
import boto3
import urllib.parse

def extract_userid_and_key(url):
    try:
        key_parts = url.split('/')
        key = urllib.parse.unquote('/'.join(key_parts[-3:]))
        userid = urllib.parse.unquote(key_parts[-2])
        return userid, key
    except IndexError:
        print(f"IndexError: Could not parse URL: {url}")
        raise

def send_sns_to_user(userid, message, subject):
    dynamodb = boto3.resource('dynamodb')
    user_table = dynamodb.Table('UserTable')
    sns_client = boto3.client('sns')
    
    try:
        print(f"Fetching email for userid: {userid} from UserTable")
        response = user_table.get_item(Key={'userid': userid})
        if 'Item' not in response:
            print("User not found in UserTable")
            return False

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

def query3_add(urls, tags):
    client = boto3.client('dynamodb')
    for url in urls:
        try:
            userid, key = extract_userid_and_key(url)

            print(f"Parsed userid: {userid}, key: {key}")

            # Check if item exists
            response = client.get_item(
                TableName='ThumbnailTable',
                Key={
                    'userid': {'S': userid},
                    'key': {'S': key}
                }
            )
            print(f"Get item response: {response}")

            if 'Item' not in response:
                print(f"Item with userid: {userid} and key: {key} does not exist. Skipping update.")
                continue

            current_tags = response['Item'].get('objects', {}).get('L', [])
            current_tags_set = {tag['S'] for tag in current_tags}
            new_tags_set = set(tags)
            all_tags_set = current_tags_set.union(new_tags_set)
            all_tags_list = [{'S': tag} for tag in all_tags_set]

            print(f"Current tags: {current_tags_set}, New tags: {new_tags_set}, All tags: {all_tags_list}")

            # Update item in DynamoDB with a condition expression to ensure it exists
            response = client.update_item(
                TableName='ThumbnailTable',
                Key={
                    'userid': {'S': userid},
                    'key': {'S': key}
                },
                UpdateExpression="SET objects = :tags",
                ConditionExpression="attribute_exists(userid) AND attribute_exists(#k)",
                ExpressionAttributeValues={
                    ':tags': {'L': all_tags_list}
                },
                ExpressionAttributeNames={
                    '#k': 'key'
                }
            )
            print(f"Response from DynamoDB: {response}")

            # Send SNS notification
            message = f"Tags added: {', '.join(tags)} to the image {url}"
            subject = 'Tags Updated'
            send_sns_to_user(userid, message, subject)

        except client.exceptions.ConditionalCheckFailedException:
            print(f"Item with userid: {userid} and key: {key} does not exist. Skipping update.")
        except Exception as e:
            print(f"Error processing URL {url}: {e}")

def query3_remove(urls, tags):
    client = boto3.client('dynamodb')
    for url in urls:
        try:
            userid, key = extract_userid_and_key(url)

            print(f"Parsed userid: {userid}, key: {key}")

            # Check if item exists
            response = client.get_item(
                TableName='ThumbnailTable',
                Key={
                    'userid': {'S': userid},
                    'key': {'S': key}
                }
            )
            print(f"Get item response: {response}")

            if 'Item' not in response:
                print(f"Item with userid: {userid} and key: {key} does not exist. Skipping update.")
                continue

            current_tags = response['Item'].get('objects', {}).get('L', [])
            current_tags_set = {tag['S'] for tag in current_tags}
            tags_to_remove_set = set(tags)
            remaining_tags_set = current_tags_set.difference(tags_to_remove_set)
            remaining_tags_list = [{'S': tag} for tag in remaining_tags_set]

            print(f"Current tags: {current_tags_set}, Tags to remove: {tags_to_remove_set}, Remaining tags: {remaining_tags_list}")

            # Update item in DynamoDB with a condition expression to ensure it exists
            response = client.update_item(
                TableName='ThumbnailTable',
                Key={
                    'userid': {'S': userid},
                    'key': {'S': key}
                },
                UpdateExpression="SET objects = :tags",
                ConditionExpression="attribute_exists(userid) AND attribute_exists(#k)",
                ExpressionAttributeValues={
                    ':tags': {'L': remaining_tags_list}
                },
                ExpressionAttributeNames={
                    '#k': 'key'
                }
            )
            print(f"Response from DynamoDB: {response}")

            # Send SNS notification
            message = f"Tags removed: {', '.join(tags)} from the image {url}"
            subject = 'Tags Updated'
            send_sns_to_user(userid, message, subject)

        except client.exceptions.ConditionalCheckFailedException:
            print(f"Item with userid: {userid} and key: {key} does not exist. Skipping update.")
        except Exception as e:
            print(f"Error processing URL {url}: {e}")

def lambda_handler(event, context):
    try:
        # Parse the request body
        body = json.loads(event['body'])
        urls = body.get('url', [])
        tag_type = body.get('type')
        tags = body.get('tags', [])

        if not urls or tag_type is None or not tags:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'URLs, type, and tags are required'}),
                
            }

        # Add or remove tags based on the type
        if tag_type == 1:
            query3_add(urls, tags)
        elif tag_type == 0:
            query3_remove(urls, tags)
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid type. Use 1 for add and 0 for remove'}),
                
            }

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Tags updated successfully'}),
            
        }

    except Exception as e:
        print(f"Unhandled exception: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal Server Error: ' + str(e)}),
            
        }
