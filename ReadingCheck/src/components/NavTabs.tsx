// src/components/NavTabs.tsx
import { Tabs, TabList, TabPanels, Tab, TabPanel, Box } from '@chakra-ui/react';

export const NavTabs = () => (
  <Tabs variant="unstyled" width="320px">
    <TabList sx={{ borderBottom: '1px', borderColor: 'gray.200' }}>
      <Tab
        _selected={{ 
          color: 'blue.500', 
          borderBottom: '2px solid', 
          borderColor: 'blue.500' 
        }}
        fontWeight="medium"
        px={4} // Add horizontal padding
        py={2} // Add vertical padding
      >
        Speech Coach
      </Tab>
      <Tab
        _selected={{
          color: 'blue.500',
        }}
        color="gray.600"
        fontWeight="medium"
        px={4}
        py={2}
      >
        Teacher Dashboard
      </Tab>
    </TabList>
    
    {/* Tab content areas - only include if you need panels */}
    <TabPanels mt={4}> {/* Add margin-top for separation */}
      <TabPanel p={0}> {/* Remove padding if not needed */}
        {/* Content for Speech Coach tab */}
        <Box>Content for Speech Coach</Box>
      </TabPanel>
      <TabPanel p={0}>
        {/* Content for Teacher Dashboard tab */}
        <Box>Content for Teacher Dashboard</Box>
      </TabPanel>
    </TabPanels>
  </Tabs>
);