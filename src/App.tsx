import React from 'react';
import MMTemplate from './pages/MMTemplate';
import MMBanner from './components/MMBanner';
import MMBarChart3D from './components/MMBarChart3D';
import MMGrid from './components/MMGrid';

function App() {
  return (
    <div className='mm-light'>
      <MMTemplate>
        <MMGrid onEvent={() => { }} onRemoteComponentLoad={() => { }} />
        <MMBarChart3D backgroundColor={""} color={[]} />
        <MMBanner
          src={'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'}
        />
      </MMTemplate>
    </div>
  );
}

export default App;
