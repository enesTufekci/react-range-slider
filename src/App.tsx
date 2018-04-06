// tslint:disable:no-console
import * as React from 'react';
import RangeSlider from './RangeSlider';

import './App.css';

const styles = {
  width: '300px',
  margin: '100px auto',
};

class App extends React.Component {
  state = {
    minPrice: 0,
    maxPrice: 2450,
  };
  handleFilterUpdate = (values: number[]) => {
    this.setState({minPrice: values[0], maxPrice: values[1] });
    // console.log(this.state);
  }
  handleMinPriceUpdate(event: React.KeyboardEvent<HTMLInputElement>) {
    this.setState({minPrice: event.currentTarget.value});
  }
  render() {
    console.log('render');
    return (
      <div style={styles}>
        <input
            type="text"
            value={this.state.minPrice}
            onChange={(event) => this.setState({minPrice: event.target.value})}
        />
        <RangeSlider
          min={this.state.minPrice}
          max={this.state.maxPrice}
          values={[this.state.minPrice, this.state.maxPrice]}
          onValuesUpdated={this.handleFilterUpdate}
        />
      </div>
    );
  }
}

export default App;
