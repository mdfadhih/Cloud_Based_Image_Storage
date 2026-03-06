import { useState } from "react";
import { Tabs, View } from "@aws-amplify/ui-react";
import { DeleteImageComponent } from "./DeleteImage";
import { PhotosListComponent } from "./PhotosList";
import SearchImageComponent from "./SearchImage";
import FullSizeImageComponent from "./FullSizeImageView";
import EditTagsComponent from "./EditTags";

export const TabListComponent = () => {
  const [tab, setTab] = useState("1");

  return (
    <View style={{ width: "100%" }}>
      <Tabs
        value={tab}
        onValueChange={(tab) => setTab(tab)}
        items={[
          {
            label: "Search by Tags",
            value: "1",
            content: (
              <View style={{ paddingTop: "16px" }}>
                <PhotosListComponent />
              </View>
            ),
          },
          {
            label: "Search by Image",
            value: "2",
            content: (
              <View style={{ paddingTop: "16px" }}>
                <SearchImageComponent isActive={tab === "2"} />
              </View>
            ),
          },
          {
            label: "Edit Tags",
            value: "3",
            content: (
              <View style={{ paddingTop: "16px" }}>
                <EditTagsComponent />
              </View>
            ),
          },
          {
            label: "FullSizeImageUrl",
            value: "4",
            content: (
              <View style={{ paddingTop: "16px" }}>
                <FullSizeImageComponent />
              </View>
            ),
          },
          {
            label: "Delete Image",
            value: "5",
            content: (
              <View style={{ paddingTop: "16px" }}>
                <DeleteImageComponent />
              </View>
            ),
          },
        ]}
      />
    </View>
  );
};

export default TabListComponent;
