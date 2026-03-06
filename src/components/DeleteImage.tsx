import {
  Card,
  Collection,
  Flex,
  Input,
  Button,
  Loader,
  Heading,
} from "@aws-amplify/ui-react";
import axios from "axios";
import { useEffect, useState } from "react";

export const DeleteImageComponent = () => {
  const [photos, setPhotos] = useState<{ key: string; url: string }[]>([]);
  const [thumbnailPath, setThumbnailPath] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const listUrl = import.meta.env.VITE_LIST_URL;
  const thumbUrlApi = import.meta.env.VITE_THUMB_URL;
  const deleteImageUrl = import.meta.env.VITE_DELETE_URL;

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function loadAll() {
    if (!listUrl) {
      setMessage("Missing VITE_LIST_URL");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.get(`${listUrl}?userid=testuser`);
      const keys: string[] = res.data.keys ?? [];
      const urls = await presignThumbUrls(keys);
      setPhotos(urls);
    } catch (e) {
      console.error(e);
      setMessage("Failed to load thumbnails.");
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!thumbnailPath.trim()) {
      setMessage("Thumbnail path is required.");
      return;
    }

    if (!deleteImageUrl) {
      setMessage("Missing VITE_DELETE_URL");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.delete(
        `${deleteImageUrl}?thumbnail_path=${encodeURIComponent(
          thumbnailPath.trim(),
        )}`,
      );
      setMessage(
        typeof response.data === "string" ? response.data : "Deleted.",
      );
      setThumbnailPath("");
      await loadAll();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage(
          error.response ? JSON.stringify(error.response.data) : error.message,
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

      <Collection
        items={photos}
        type="list"
        direction="row"
        gap="20px"
        marginTop="1rem"
        marginBottom="1rem"
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
              alt="image"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: 8,
              }}
            />
          </Card>
        )}
      </Collection>

      <Flex
        direction="row"
        gap="small"
        wrap="wrap"
        style={{ marginTop: "1rem", textAlign: "center" }}
      >
        <Input
          id="small"
          size="small"
          width="35%"
          placeholder="Enter thumbnail key"
          value={thumbnailPath}
          onChange={(e) => setThumbnailPath(e.target.value)}
        />
        <Button
          size="small"
          borderRadius="medium"
          colorTheme="warning"
          onClick={handleDelete}
        >
          Delete Image
        </Button>
      </Flex>

      <Heading
        level={4}
        color="blue.80"
        fontSize="1rem"
        fontFamily="sans-serif"
        fontWeight="semibold"
        marginTop="2rem"
        marginInlineStart="17rem"
      >
        {message}
      </Heading>
    </>
  );
};

export default DeleteImageComponent;
