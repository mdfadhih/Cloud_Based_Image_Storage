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
import { useEffect, useState } from "react";

const GET_FULL_URL = import.meta.env.VITE_FULL_URL;
const LIST_URL = import.meta.env.VITE_LIST_URL;
const THUMB_URL = import.meta.env.VITE_THUMB_URL;

export const FullSizeImageComponent = () => {
  const [fullSizeImageUrl, setFullSizeImageUrl] = useState("");
  const [thumbnailPath, setThumbnailPath] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<{ key: string; url: string }[]>([]);
  const [selectedKey, setSelectedKey] = useState("");

  useEffect(() => {
    loadAllImages();
  }, []);

  async function presignThumbUrls(keys: string[]) {
    const items = await Promise.all(
      keys.map(async (key) => {
        const r = await axios.get(
          `${THUMB_URL}?key=${encodeURIComponent(key)}`,
        );
        return {
          key,
          url: r.data.url,
        };
      }),
    );
    return items;
  }

  async function loadAllImages() {
    if (!LIST_URL) {
      setMessage("Missing VITE_LIST_URL");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.get(`${LIST_URL}?userid=testuser`);
      const keys = res.data.keys ?? [];

      const items = await presignThumbUrls(keys);
      setPhotos(items);
    } catch (error) {
      setMessage("Failed to load images");
    } finally {
      setLoading(false);
    }
  }

  const handleFindFullSizeImage = async () => {
    if (!GET_FULL_URL) {
      setMessage("Backend URL not configured (VITE_FULL_URL).");
      return;
    }

    if (!thumbnailPath.trim()) {
      setMessage("Thumbnail path is required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(
        `${GET_FULL_URL}?thumbnail_path=${encodeURIComponent(
          thumbnailPath.trim(),
        )}`,
      );

      setFullSizeImageUrl(response.data.full_size_image_url || "");
    } catch (error: unknown) {
      setFullSizeImageUrl("");

      if (axios.isAxiosError(error)) {
        setMessage(
          typeof error.response?.data === "string"
            ? error.response.data
            : JSON.stringify(error.response?.data || error.message),
        );
      } else {
        setMessage((error as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader variation="linear" />}

      {/* Thumbnail list */}
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
            onClick={() => {
              setThumbnailPath(item.key);
              setSelectedKey(item.key);
            }}
            style={{
              cursor: "pointer",
              border:
                selectedKey === item.key
                  ? "3px solid #ff9900"
                  : "1px solid #ddd",
            }}
          >
            <img
              src={item.url}
              alt="thumbnail"
              style={{
                width: "150px",
                height: "150px",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Card>
        )}
      </Collection>

      {/* Input + Button */}
      <Flex
        direction="row"
        gap="small"
        wrap="wrap"
        style={{ marginTop: "1rem" }}
      >
        <Input
          id="small"
          size="small"
          width="35%"
          placeholder="Select thumbnail key"
          value={thumbnailPath}
          onChange={(e) => setThumbnailPath(e.target.value)}
        />

        <Button
          size="small"
          borderRadius="medium"
          colorTheme="warning"
          onClick={handleFindFullSizeImage}
        >
          View Full Size Image URL
        </Button>
        <Button
          size="small"
          borderRadius="medium"
          onClick={() => {
            setThumbnailPath("");
            setSelectedKey("");
            setFullSizeImageUrl("");
            setMessage("");
            loadAllImages();
          }}
        >
          Refresh
        </Button>
      </Flex>

      {/* Only show URL */}

      {fullSizeImageUrl && (
        <Flex
          direction="column"
          alignItems="center"
          style={{ marginTop: "20px" }}
        >
          <Heading level={5}>Full Size Image URL</Heading>

          <Flex direction="row" gap="10px" alignItems="center">
            <a
              href={fullSizeImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                textDecoration: "none",
                background: "#fff",
              }}
            >
              Open Image
            </a>

            <Button
              size="small"
              onClick={() => navigator.clipboard.writeText(fullSizeImageUrl)}
            >
              Copy URL
            </Button>
          </Flex>
        </Flex>
      )}
    </>
  );
};

export default FullSizeImageComponent;
