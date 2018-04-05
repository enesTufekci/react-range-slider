import * as React from 'react';
import RangeSlider from './RangeSlider';

import './App.css';

const styles = {
  width: '300px',
  margin: '100px auto',
};

class App extends React.Component {
  render() {
    return (
      <div style={styles}>
        <RangeSlider />
      </div>
    );
  }
}

export default App;
