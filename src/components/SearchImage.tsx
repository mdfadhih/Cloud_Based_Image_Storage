import {
  Button,
  Card,
  Collection,
  Flex,
  Heading,
  Input,
  Loader,
} from "@aws-amplify/ui-react";
import axios from "axios";
import { ChangeEvent, useEffect, useState } from "react";

type SearchImageProps = {
  isActive: boolean;
};

export const SearchImageComponent = ({ isActive }: SearchImageProps) => {
  const [photos, setPhotos] = useState<{ key: string; url: string }[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setFullSizeImageUrl] = useState("");
  const [, setSelectedKey] = useState("");

  const searchByImageUrl = import.meta.env.VITE_SEARCH_IMAGE_URL;
  const thumbUrlApi = import.meta.env.VITE_THUMB_URL;

  useEffect(() => {
    if (isActive) {
      setMessage("");
      setPhotos([]);
      setSelectedImage(null);
      setSelectedKey("");
      setFullSizeImageUrl("");
    }
  }, [isActive]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedImage(event.target.files[0]);
      setFullSizeImageUrl("");
      setSelectedKey("");
      setPhotos([]);
      setMessage("");
    }
  };

  async function presignThumbUrls(keys: string[]) {
    if (!thumbUrlApi) throw new Error("Missing VITE_THUMB_URL");

    const items = await Promise.all(
      keys.map(async (key) => {
        const r = await axios.get(
          `${thumbUrlApi}?key=${encodeURIComponent(key)}`,
        );
        return {
          key,
          url: r.data.url,
        };
      }),
    );

    return items.filter(Boolean);
  }

  async function searchByImage() {
    if (!selectedImage) {
      setMessage("Please select an image to search.");
      return;
    }

    if (!searchByImageUrl) {
      setMessage("Missing VITE_SEARCH_IMAGE_URL");
      return;
    }

    setMessage("");
    setLoading(true);
    setFullSizeImageUrl("");
    setSelectedKey("");

    try {
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64Image = reader.result?.toString().split(",")[1];

          const response = await axios.post(searchByImageUrl, {
            image_base64: base64Image,
          });

          console.log("Search by image response:", response.data);

          if (response.data.error) {
            setMessage(response.data.error);
            setPhotos([]);
            setLoading(false);
            return;
          }

          const keys: string[] = response.data.links ?? [];
          const detected: string[] = response.data.detected ?? [];

          const items = await presignThumbUrls(keys);

          setPhotos(items);

          if (detected.length === 0) {
            setMessage("No objects detected.");
          } else if (items.length === 0) {
            setMessage(
              `Detected: ${detected.join(", ")} — no matching images found.`,
            );
          } else {
            setMessage(`Detected: ${detected.join(", ")}`);
          }
        } catch (err: unknown) {
          console.error(err);
          if (axios.isAxiosError(err)) {
            setMessage(
              typeof err.response?.data === "string"
                ? err.response.data
                : JSON.stringify(err.response?.data || err.message),
            );
          } else {
            setMessage((err as Error).message);
          }
          setPhotos([]);
        } finally {
          setLoading(false);
        }
      };

      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error(error);
      setMessage("Error fetching data");
      setLoading(false);
    }
  }

  return (
    <>
      {photos.length > 0 && (
        <Collection
          items={photos}
          type="list"
          direction="row"
          gap="20px"
          wrap="wrap"
        >
          {(item, index) => (
            <Card
              key={index}
              padding="0rem"
              maxWidth="10rem"
              borderRadius="medium"
            >
              <img
                src={item.url}
                alt="image"
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  display: "block",
                  borderRadius: 8,
                }}
              />
            </Card>
          )}
        </Collection>
      )}

      {loading && <Loader variation="linear" />}

      <Flex
        direction="row"
        wrap="wrap"
        gap="small"
        style={{ marginTop: "1rem" }}
      >
        <Input
          type="file"
          id="small"
          size="small"
          width="50%"
          onChange={handleImageUpload}
        />
        <Button
          size="small"
          borderRadius="medium"
          colorTheme="warning"
          onClick={searchByImage}
        >
          Search by Image
        </Button>
        <Button
          size="small"
          borderRadius="medium"
          onClick={() => {
            setMessage("");
            setPhotos([]);
            setSelectedImage(null);
            setSelectedKey("");
            setFullSizeImageUrl("");
          }}
        >
          Refresh
        </Button>
      </Flex>

      <Heading
        level={4}
        color="blue.80"
        fontSize="1rem"
        fontFamily="sans-serif"
        textAlign="center"
        fontWeight="semibold"
        marginTop="2rem"
        style={{ wordBreak: "break-word" }}
      >
        {message}
      </Heading>
    </>
  );
};

export default SearchImageComponent;
