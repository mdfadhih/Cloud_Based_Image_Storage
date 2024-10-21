import { useState, useEffect } from 'react';
import axios from 'axios';
import { list } from 'aws-amplify/storage';
import { Card, Collection, SearchField, Text} from '@aws-amplify/ui-react';
import { StorageImage } from '@aws-amplify/ui-react-storage';

export const PhotosListComponent = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [value, setValue] = useState('');

  const getImagesFromTagsUrl = "https://kozvlrkmqcuciysoyk6f6vtjku0ojsem.lambda-url.ap-southeast-2.on.aws/"; 
 
  const onChange = (event: any) => {
    setValue(event.target.value);
    if (event.target.value.length > 2) {
      search(event.target.value);
    }
  };

  useEffect(() => {
    listPhotos();
  }, []);

  async function search(tagsInput: string) {
    const tags = tagsInput.split(',').map(tag => tag.trim());
    if (!Array.isArray(tags) || tags.length === 0) {
      return;
    }

    let photosArray: string[] = [];
    const queryParams = tags.map((tag, index) => `tag${index + 1}=${encodeURIComponent(tag)}`).join('&');
    const url = `${getImagesFromTagsUrl}?${queryParams}`;
  
    try {
      const response = await axios.get(url);
      response.data.links.forEach((link: string) => photosArray.push(link));
      setPhotos(photosArray);
    } catch (error) {
      console.error(error);
    }
  }

  async function listPhotos() {
    setValue('');
    try {
      let photosArray: string[] = [];
      const result = await list({
        path: ({ identityId }) => `thumbnails/protected/${identityId}/`,
      });
    
      result.items.forEach((item) => photosArray.push(item.path));
      setPhotos(photosArray);
    } catch (error) {
      console.log(error);
    }
  }
  
  return (
    <>
      <SearchField
        label="search"
        placeholder="Search objects"
        onChange={onChange}
        onClear={listPhotos}
        value={value}
      />
      <br/>

    
      <Collection
        items={photos}
        type="list"
        direction="row"
        gap="20px"
        wrap="nowrap"
        searchNoResultsFound= {
          <Text color="blue.80" fontSize="1rem" fontFamily='sans-serif' textAlign='center' fontWeight='semibold'>
          Nothing found, please try again
        </Text>
        }
       
      >
        {(item, index) => (
          <Card key={index} padding="0rem"  maxWidth="10rem" borderRadius="medium" >
            <StorageImage path={item} alt='image' />
          </Card>
        )}
      </Collection>  
    </>
  );
};

export default PhotosListComponent;


