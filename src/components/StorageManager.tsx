import { StorageManager } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';
import { Heading , View} from '@aws-amplify/ui-react';

export const StorageManagerComponent = () => {
  return (
    <>
    <View style={{'flexDirection':'row', textAlign:'center'}}>
   <Heading level={6} style={{marginBottom:'1rem'}}>Upload Image to S3 Bucket</Heading>
   <StorageManager
      acceptedFileTypes={['image/*']}
      path={({ identityId }) => `protected/${identityId}/`}
      maxFileCount={10}
      isResumable
    />
    </View>
   
 
    </>
    
  );
};