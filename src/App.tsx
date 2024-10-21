import { Authenticator } from '@aws-amplify/ui-react'
import { StorageManagerComponent } from './components/StorageManager';
import '@aws-amplify/ui-react/styles.css'
import Container from 'react-bootstrap/Container';
import { Grid, Card, Heading, Image, Button, Flex, View} from '@aws-amplify/ui-react';
import TabListComponent from './components/TabsList';


function App() {
  return (
    <Authenticator socialProviders={['google']}>
      {({ signOut, user }) => (
        <Container className="container-fluid">
          <Grid
            columnGap="0.5rem"
            rowGap="0.5rem"
            templateColumns="1fr 1fr 1fr"
            templateRows="0.5fr 3fr 1fr"
          >
            <Card
              columnStart="1"
              columnEnd="-1"
            >
              <View style={{marginBottom: '0rem'}}>
              <Flex direction="row" justifyContent="space-around">
                <Image
                  src="/react.svg"
                  alt="React Logo"
                />
                <Heading level={6}>Welcome, {user?.signInDetails?.loginId}! </Heading>
                <Button size='small' borderRadius='medium' colorTheme='warning' onClick={signOut}>Sign Out</Button>
              </Flex>
              </View>
              
            </Card>
            <Card
              columnStart="1"
              columnEnd="2"
            >
              <StorageManagerComponent />
            </Card>
            <Card
              columnStart="2"
              columnEnd="-1"
            >
              <TabListComponent />
            </Card>
          </Grid>
        </Container>
      )}
    </Authenticator>
  );
}

export default App;
