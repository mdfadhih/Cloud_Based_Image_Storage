import { useState } from "react";
import axios from "axios";
import { Heading, View, Button, Text, Flex } from "@aws-amplify/ui-react";

export const StorageManagerComponent = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadApi = import.meta.env.VITE_UPLOAD_URL;
  const bucket = import.meta.env.VITE_BUCKET;

  async function upload() {
    if (!file || !uploadApi) return;

    try {
      setLoading(true);
      setStatus("Requesting upload URL...");

      const presign = await axios.post(uploadApi, {
        bucket,
        userid: "testuser",
        filename: file.name,
        content_type: file.type || "application/octet-stream",
      });

      const { upload_url } = presign.data;

      setStatus("Uploading to S3...");

      await axios.put(upload_url, file, {
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      setStatus("Uploaded successfully.");
      setFile(null);
    } catch (error) {
      console.error(error);
      setStatus("Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Heading level={5} style={{ marginBottom: "16px" }}>
        Upload Image
      </Heading>

      <Text style={{ marginBottom: "16px", color: "#555" }}>
        Choose an image and upload it to your private S3 gallery.
      </Text>

      <Flex direction="column" gap="12px">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        {file && (
          <Text style={{ fontSize: "14px", color: "#444" }}>
            Selected: {file.name}
          </Text>
        )}

        <Button onClick={upload} isDisabled={!file || loading}>
          {loading ? "Uploading..." : "Upload"}
        </Button>

        {status && (
          <Text style={{ marginTop: "8px", fontSize: "14px", color: "#333" }}>
            {status}
          </Text>
        )}
      </Flex>
    </View>
  );
};

export default StorageManagerComponent;
