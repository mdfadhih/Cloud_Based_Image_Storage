import { StorageManagerComponent } from "./components/StorageManager";
import "@aws-amplify/ui-react/styles.css";
import { Grid, Card, Heading, Image, Flex, View } from "@aws-amplify/ui-react";
import TabListComponent from "./components/TabsList";

function App() {
  return (
    <View
      style={{
        minHeight: "100vh",
        padding: "24px",
        background: "linear-gradient(180deg, #7d5bd6 0%, #d8d1e8 100%)",
      }}
    >
      <View style={{ maxWidth: "1150px", margin: "0 auto" }}>
        <Grid
          columnGap="16px"
          rowGap="16px"
          templateColumns="340px 1fr"
          templateRows="auto 1fr"
        >
          <Card columnStart="1" columnEnd="-1" padding="16px">
            <View>
              <Flex direction="row" justifyContent="center" alignItems="center">
                <Image src="/react.svg" alt="React Logo" />
                <Heading level={5}>Serverless Image Storage System</Heading>
              </Flex>
            </View>
          </Card>

          <Card padding="20px">
            <StorageManagerComponent />
          </Card>

          <Card padding="20px">
            <TabListComponent />
          </Card>
        </Grid>
      </View>
    </View>
  );
}

export default App;
