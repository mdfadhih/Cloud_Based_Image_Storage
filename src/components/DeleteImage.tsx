import { Card, Collection, Flex, Input, Button, Loader, Heading} from '@aws-amplify/ui-react';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import { list } from 'aws-amplify/storage';
import axios from 'axios';
import { useState, useEffect } from 'react';

export const DeleteImageComponent = () => {
    const [photos, setPhotos] = useState<any[]>([]);
    const [thumbnailPath, setThumbnailPath] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false)
    const deleteImageUrl = "https://wewxgfsi7xo776xlyosvp4iupi0rtufx.lambda-url.ap-southeast-2.on.aws";
    
    useEffect(() => {
        listPhotos();
      }, []);
  
    async function listPhotos() {
      try {
        let photosArray: string[] = [];
        const result = await list({
          path: ({ identityId}) => `thumbnails/protected/${identityId}/`,
        });
        result.items.forEach((item:any) => photosArray.push(item.path));
        setPhotos(photosArray);
      } catch (error) {
        console.log(error);
      }
    }
    
    const handleDelete = async () => {
      if (!thumbnailPath) {
        setMessage('Thumbnail path is required.');
        return             
      } 

      setLoading(true)
  
      try {
        const response = await axios.delete(`${deleteImageUrl}?thumbnail_path=${encodeURIComponent(thumbnailPath)}`);
        setMessage(response.data);
        listPhotos();
        setLoading(false)
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          setMessage((error.response ? error.response.data : error.message));
          setLoading(false)
        } else {
          setMessage((error as Error).message);
          setLoading(false)
        }
      }
    };

    
    return (
      <>
      {loading && <Loader variation='linear' />}
    <Collection
        items={photos}
        type="list"
        direction="row"
        gap="20px"
        marginTop='1rem'
        marginBottom='1rem'
        wrap="nowrap"
      >
        {(item, index) => (
          <Card key={index} padding="0rem"  maxWidth="10rem" borderRadius="medium" >
            <StorageImage path={item} alt='image' />
          </Card>
        )}
      </Collection>
       
        <Flex direction='row' style={{marginTop:'1rem', marginInlineStart:'14rem'}}>
        <Input id="small" size="small" width="35%"  placeholder="Enter thumbnail URL"   value={thumbnailPath}    onChange={(e) => setThumbnailPath(e.target.value)}  />
            <Button size="small" borderRadius="medium"  colorTheme="warning" onClick={handleDelete}>Delete Image</Button>
        </Flex>
        <Heading level={4} color="blue.80" fontSize="1rem" fontFamily='sans-serif' fontWeight='semibold' marginTop='2rem' marginInlineStart='17rem'>{message}</Heading>
        
           </>
    );
  };
     


export default DeleteImageComponent

