import React from 'react';
import MumuTemplate from './pages/MumuTemplate';
import MumuBanner from './components/MumuBanner';
import MumuForm from './components/MumuForm';

function App() {
  return (
    <MumuTemplate>
      <MumuBanner
        src={'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'}
      />
      <MumuForm />
    </MumuTemplate>
  );
}

export default App;
