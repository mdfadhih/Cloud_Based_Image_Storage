import { Flex, Input, Button, Heading, Loader} from "@aws-amplify/ui-react";
import axios from "axios";
import { ChangeEvent, useState } from "react";

export const EditTagsComponent = () => {
    const [tags, setTags] = useState('');
    const [urls, setUrls] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const[loading, setLoading] = useState(false)
    const tagUpdateUrl = "https://uvislejeccnr3da5p6r3j5beye0ucxzc.lambda-url.ap-southeast-2.on.aws"; 

    const handleTagUpdate = async (type: number) => {
        if (!tags || !urls.length) {
          setMessage('Tags and URLs are required.');
          return;
        } else if(tags || urls.length){
          setMessage('')
        }
    
      setLoading(true)

        try {
          const response = await axios.post(tagUpdateUrl, {
            url: urls,
            type: type,
            tags: tags.split(',').map((tag: string) => tag.trim())
          });
          setLoading(false)
          setMessage(response.data.message);
         
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
    
      const handleUrlInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setUrls(value.split(',').map(url => url.trim()));
      };
    
      const handleTagsInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setTags(event.target.value);
      };

return (
    <>
    {loading && <Loader variation="linear"/> }
    <div>
      <Flex direction="column" gap="small" style={{marginTop:'1rem', marginInlineStart:'15rem'}}>
        <Input id="small" size="small" width="50%"  placeholder="Enter URLs (comma separated)"    onChange={handleUrlInputChange}/>
        <Input id="small" size="small" width="50%"  placeholder="Enter Tags (comma separated)"  onChange={handleTagsInputChange}/> 
        <Flex direction='row'>
            <Button size="small" borderRadius="medium"  colorTheme="warning" onClick={() => handleTagUpdate(1)}>Add Tags</Button>
             <Button size="small" borderRadius="medium"  colorTheme="warning" onClick={() => handleTagUpdate(0)}>Remove Tags</Button>
        </Flex>
        <Heading level={4} color="blue.80" fontSize="1rem" fontFamily='sans-serif' fontWeight='semibold' marginTop='2rem'>{message}</Heading>
      </Flex>
      </div>

      
    </>
)

}

export default EditTagsComponent