import { Button, Card, Collection, Flex, Heading, Input, Loader} from "@aws-amplify/ui-react";
import axios from "axios";
import { ChangeEvent, useState } from "react";
import { Image } from "react-bootstrap";

export const SearchImageComponent = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const searchByImageUrl = "https://6za2i5odvzcanvqtnitieaepre0sdnmh.lambda-url.ap-southeast-2.on.aws/";

  
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedImage(event.target.files[0]);
    }
  };

  async function searchByImage() {
    if (!selectedImage) {
      setMessage('Please select an image to search.');
      return;
    } else if(selectedImage){
        setMessage('')
    }

    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result?.toString().split(',')[1];
        const response = await axios.post(searchByImageUrl, {
          image: base64Image
        });

        if (response.data.error) {
          setMessage(response.data.error);
          setLoading(false);
          return;
        }

        
        const photosArray = response.data.links;
        console.log(response.data.links)
        
        setMessage(response.data.links)
        setPhotos(photosArray);
        setLoading(false);
      };
      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error(error);
      setMessage('Error fetching data');
      setLoading(false);
    }
  }

  return (
     <>     
     <Collection
        items={photos}
        type="list"
        direction="row"
        gap="20px"
        wrap="nowrap"
       
      >
        {(item, index) => (
          <Card key={index} padding="0rem" >
            <Image src={item} alt="image" height='150px' width='150px'/>
          </Card>
        )}
      </Collection>

      {loading && <Loader variation="linear" />}

      <Flex direction='row' style={{marginTop:'1rem', marginInlineStart:'10rem'}}>
        <Input type="file" id="small" size="small" width="50%" onChange={handleImageUpload}  />
            <Button size="small" borderRadius="medium"  colorTheme="warning" onClick={searchByImage} >Search by Image</Button>
        </Flex>
       <Heading level={4} color="blue.80" fontSize="1rem" fontFamily='sans-serif' textAlign='center' fontWeight='semibold' marginTop='2rem' style={{wordBreak:'break-word'}}>{message}</Heading>
    </>
)
    
}




export default SearchImageComponent