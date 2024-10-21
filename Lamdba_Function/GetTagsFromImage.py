import json
import boto3

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('ThumbnailTable')

    try:

        query_params = event.get('queryStringParameters', {})
        tags = [value for key, value in query_params.items() if key.startswith('tag')]

        if not tags:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No tags provided'}),
                
            }

        response = table.scan()
        items = response.get('Items', [])

        # Check if all tags are present across items
        tag_found = {tag: False for tag in tags}
        collected_links = set()

        for item in items:
            item_objects = item.get('objects', [])
            print(f"Item objects: {item_objects}")
            for tag in tags:
                if tag in item_objects:
                    tag_found[tag] = True
                    collected_links.add(item['thumbnail_path'])
        
        print(f"Tag found status: {tag_found}")

        # If all tags are found, return the collected links, otherwise return an empty result
        if all(tag_found.values()):
            return {
                'statusCode': 200,
                'body': json.dumps({'links': list(collected_links)}),
                
            }
        else:
            return {
                'statusCode': 200,
                'body': json.dumps({'links': []}),
                
            }

    except Exception as e:
        print(f"Unhandled exception: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'}),
            
        }
