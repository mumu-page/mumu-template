import React from 'react';
import MMTemplate from './pages/MMTemplate';
import MMBanner from './components/MMBanner';
import MMBarChart3D from './components/MMBarChart3D';
import MMGrid from './components/MMGrid';

function App() {
  return (
    <MMTemplate>
      <MMGrid />
      {/*<MMBanner*/}
      {/*  src={'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'}*/}
      {/*/>*/}
      {/*<MMGrid />*/}
      <MMBarChart3D backgroundColor={""} color={[]}/>
    </MMTemplate>
  );
}

export default App;
