import { useEffect, useState } from "react";
import axios from "axios";
import { Button, Flex } from "@aws-amplify/ui-react";

export const PhotosListComponent = () => {
  const [photos, setPhotos] = useState<string[]>([]); // presigned thumbnail URLs
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const searchUrl = import.meta.env.VITE_SEARCH_URL;
  const listUrl = import.meta.env.VITE_LIST_URL;
  const thumbUrlApi = import.meta.env.VITE_THUMB_URL;

  // Step A: Load ALL images on first page load
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function presignThumbUrls(keys: string[]) {
    if (!thumbUrlApi) throw new Error("Missing VITE_THUMB_URL");
    const urls = await Promise.all(
      keys.map(async (key) => {
        const r = await axios.get(
          `${thumbUrlApi}?key=${encodeURIComponent(key)}`,
        );
        return r.data.url;
      }),
    );
    return urls.filter(Boolean);
  }

  async function loadAll() {
    if (!listUrl) {
      console.error("Missing VITE_LIST_URL");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${listUrl}?userid=testuser`);
      const keys: string[] = res.data.keys ?? [];
      const urls = await presignThumbUrls(keys);
      setPhotos(urls);
    } catch (e) {
      console.error(e);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }

  // Step B: Search when user types (debounce)
  useEffect(() => {
    const trimmed = value.trim();

    // if search box cleared, show all again
    if (trimmed.length === 0) {
      loadAll();
      return;
    }

    // only search if 3+ chars
    if (trimmed.length < 3) return;

    const t = setTimeout(() => {
      search(trimmed);
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  async function search(tagsInput: string) {
    if (!searchUrl) {
      console.error("Missing VITE_SEARCH_URL");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (tags.length === 0) return;

    const queryParams = tags
      .map((tag, index) => `tag${index + 1}=${encodeURIComponent(tag)}`)
      .join("&");

    setLoading(true);
    try {
      const res = await axios.get(`${searchUrl}?${queryParams}`);
      const keys: string[] = res.data.keys ?? res.data.links ?? [];
      const urls = await presignThumbUrls(keys);
      setPhotos(urls);
    } catch (e) {
      console.error(e);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setValue("");
    // loadAll will run automatically because value becomes ""
  }

  return (
    <>
      <input
        placeholder="Search tags (comma separated), e.g. care,map"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginBottom: "12px",
        }}
      />

      <Flex direction="row" gap="small" style={{ marginBottom: "12px" }}>
        {/* <Button
          onClick={clear}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Clear
        </Button> */}

        <Button
          onClick={loadAll}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Refresh
        </Button>
      </Flex>

      {loading && <div style={{ marginBottom: 10 }}>Loading…</div>}

      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 20 }}>
          {photos.length === 0 && !loading ? (
            <div>Nothing found, please try again</div>
          ) : (
            photos.map((url, index) => (
              <div key={index} style={{ width: 160, flex: "0 0 auto" }}>
                <img
                  src={url}
                  alt="thumb"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    borderRadius: 8,
                  }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default PhotosListComponent;
