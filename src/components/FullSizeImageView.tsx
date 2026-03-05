import { Button, Flex, Heading, Input, Loader } from '@aws-amplify/ui-react';
import axios from 'axios';
import { useState } from 'react';

const GET_FULL_URL = import.meta.env.VITE_GET_FULL_URL;

export const FullSizeImageComponent = () => {
  const [fullSizeImageUrl, setFullSizeImageUrl] = useState('');
  const [thumbnailPath, setThumbnailPath] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fullSizeImageUrlApi = GET_FULL_URL;

  const handleFindFullSizeImage = async () => {
    if (!GET_FULL_URL) {
      setMessage("Backend URL not configured (VITE_GET_FULL_URL).");
      return;
    }

    if (!thumbnailPath) {
      setMessage('Thumbnail path is required.');
      return;
    } else {
      setMessage('');
    }

    setLoading(true);

    try {
      const response = await axios.get(
        `${fullSizeImageUrlApi}?thumbnail_url=${encodeURIComponent(thumbnailPath)}`
      );
      setFullSizeImageUrl(response.data.full_size_image_url);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response ? error.response.data : error.message);
      } else {
        setMessage((error as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        {loading && <Loader variation="linear" />}
        <Flex direction="row" style={{ marginTop: '1rem', marginInlineStart: '10rem' }}>
          <Input
            id="small"
            size="small"
            width="35%"
            placeholder="Enter thumbnail URL"
            value={thumbnailPath}
            onChange={(e) => setThumbnailPath(e.target.value)}
          />
          <Button size="small" borderRadius="medium" colorTheme="warning" onClick={handleFindFullSizeImage}>
            View FullSizeImageurl
          </Button>
        </Flex>
      </div>

      {fullSizeImageUrl && (
        <p style={{ wordBreak: 'break-all', container: 'inherit' }}>
          Full Size Image URL:{' '}
          <a href={fullSizeImageUrl} target="_blank" rel="noopener noreferrer">
            {fullSizeImageUrl}
          </a>
        </p>
      )}

      <Heading
        level={4}
        color="blue.80"
        fontSize="1rem"
        fontFamily="sans-serif"
        fontWeight="semibold"
        marginTop="2rem"
        marginInlineStart="14rem"
      >
        {message}
      </Heading>
    </>
  );
};

export default FullSizeImageComponent;
