import { useState } from 'react';
import { Tabs} from '@aws-amplify/ui-react';
import { DeleteImageComponent } from './DeleteImage'
import PhotosListComponent from './PhotosList';
import SearchImageComponent from './SearchImage';
import FullSizeImageComponent from './FullSizeImageView';
import EditTagsComponent from './EditTags';

export const TabListComponent = () => {
  const [tab, setTab] = useState('1');
  return (
    <Tabs
      value={tab}
      onValueChange={(tab) => setTab(tab)}
      items={[
        {
          label: 'Search by Tags',
          value: '1',
          content: (
          <>
          <PhotosListComponent />
          </>  
          ),
          
        },
        {
          label: 'Search by Image',
          value: '2',
          content: (
            <>
              <SearchImageComponent />
            </>
          ),
        },
        {
          label: 'Edit Tags',
          value: '3',
          content: (
            <>
              <EditTagsComponent />
            </>
          ),
        },
        {
          label: 'FullSizeImageUrl',
          value: '4',
          content: (
            <>
              <FullSizeImageComponent/>
            </>
          ),
        },
        {
          label: 'Delete Image',
          value: '5',
          content: (
            <>
              <DeleteImageComponent />
            </>
          ),
        },
      ]}
    />
  );
};

export default TabListComponent


