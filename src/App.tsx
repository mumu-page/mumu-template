import React from 'react';
import MMTemplate from './pages/MMTemplate';
import MMBanner from './components/MMBanner';
import MMBarChart3D from './components/MMBarChart3D';

function App() {
  return (
    <MMTemplate>
      <MMBanner
        src={'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'}
      />
      <MMBarChart3D />
    </MMTemplate>
  );
}

export default App;
