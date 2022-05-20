import React from 'react';
import MMTemplate from './pages/MMTemplate';
import MMBanner from './components/MMBanner';
import MMBarChart3D from './components/MMBarChart3D';
import MMGrid from './components/MMGrid';
import MMGridLayout from './components/MMGridLayout';

function App() {
  return (
    <div className='mm-light'>
      <MMTemplate>
        <MMGrid onEvent={() => { }} onRemoteComponentLoad={() => { }} />
        <MMBanner
          src={'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'}
        />
        <MMBarChart3D backgroundColor={""} color={[]} />
      </MMTemplate>
    </div>
  );
}

export default App;
