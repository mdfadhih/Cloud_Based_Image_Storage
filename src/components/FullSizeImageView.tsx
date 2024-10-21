import { Button, Flex, Heading, Input, Loader} from '@aws-amplify/ui-react';
import axios from 'axios';
import { useState} from 'react';

export const FullSizeImageComponent = () => {
    const [fullSizeImageUrl, setFullSizeImageUrl] = useState('');
    const [thumbnailPath, setThumbnailPath] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false)
  
    const fullSizeImageUrlApi = "https://qnme2rgh6rx6rpm2wojmbaftgi0oqxvh.lambda-url.ap-southeast-2.on.aws";
        
    const handleFindFullSizeImage = async () => {
      if (!thumbnailPath) {
        setMessage('Thumbnail path is required.');
        return;
      } else if(thumbnailPath){
        setMessage('')
      }

      setLoading(true)
  
      try {
        const response = await axios.get(`${fullSizeImageUrlApi}?thumbnail_url=${encodeURIComponent(thumbnailPath)}`);
        setFullSizeImageUrl(response.data.full_size_image_url);
        setLoading(false)
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          setMessage( (error.response ? error.response.data : error.message));
          setLoading(false)
        } else {
          setMessage((error as Error).message);
          setLoading(false)
        }
      }
    };
  
    
    return (
      <>
        <div>
        {loading && <Loader variation='linear' />} 
        <Flex direction='row' style={{marginTop:'1rem', marginInlineStart:'10rem'}}>
        <Input id="small" size="small" width="35%"  placeholder="Enter thumbnail URL" value={thumbnailPath} onChange={(e) => setThumbnailPath(e.target.value)}  />
            <Button size="small" borderRadius="medium" colorTheme="warning" onClick={handleFindFullSizeImage} >View FullSizeImageurl</Button>
        </Flex>
        </div>
      
        {fullSizeImageUrl && <p style={{wordBreak:'break-all', container:'inherit'}}>Full Size Image URL: <a href={fullSizeImageUrl} target="_blank" rel="noopener noreferrer">{fullSizeImageUrl}</a></p>}
             <Heading level={4} color="blue.80" fontSize="1rem" fontFamily='sans-serif' fontWeight='semibold' marginTop='2rem' marginInlineStart='14rem'>{message}</Heading>       

      </>
    );
  };
     


export default FullSizeImageComponent
