import {
  Flex,
  Input,
  Button,
  Heading,
  Loader,
  Card,
  Collection,
} from "@aws-amplify/ui-react";
import axios from "axios";
import { useEffect, useState } from "react";

export const EditTagsComponent = () => {
  const [tags, setTags] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [photos, setPhotos] = useState<{ key: string; url: string }[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const tagUpdateUrl = import.meta.env.VITE_TAGS_URL;
  const listUrl = import.meta.env.VITE_LIST_URL;
  const thumbUrlApi = import.meta.env.VITE_THUMB_URL;

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
      const items = await presignThumbUrls(keys);
      setPhotos(items);
    } catch (e) {
      console.error(e);
      setMessage("Failed to load thumbnails.");
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }

  const handleTagUpdate = async (type: number) => {
    if (!selectedKey.trim() || !tags.trim()) {
      setMessage("Thumbnail and tags are required.");
      return;
    }

    if (!tagUpdateUrl) {
      setMessage("Missing VITE_TAGS_URL");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(tagUpdateUrl, {
        thumbnail_path: selectedKey,
        type: type,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      setMessage(response.data.message || "Tags updated.");
    } catch (error: unknown) {
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
            onClick={() => setSelectedKey(item.key)}
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

      <div>
        <Flex
          direction="column"
          gap="small"
          style={{ marginTop: "1rem", maxWidth: "520px" }}
        >
          <Input
            id="small"
            size="small"
            width="50%"
            placeholder="Selected thumbnail key"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
          />

          <Input
            id="small"
            size="small"
            width="50%"
            placeholder="Enter tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <Flex direction="row">
            <Button
              size="small"
              borderRadius="medium"
              colorTheme="warning"
              onClick={() => handleTagUpdate(1)}
            >
              Add Tags
            </Button>
            <Button
              size="small"
              borderRadius="medium"
              colorTheme="warning"
              onClick={() => handleTagUpdate(0)}
            >
              Remove Tags
            </Button>

            <Button size="small" borderRadius="medium" onClick={loadAll}>
              Refresh
            </Button>
          </Flex>

          <Heading
            level={4}
            color="blue.80"
            fontSize="1rem"
            fontFamily="sans-serif"
            fontWeight="semibold"
            marginTop="2rem"
          >
            {message}
          </Heading>
        </Flex>
      </div>
    </>
  );
};

export default EditTagsComponent;
