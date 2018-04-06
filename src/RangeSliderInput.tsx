// tslint:disable:no-console
import * as React from 'react';
import RangeSlider from './RangeSlider';

interface RangeSliderInputProps {}

interface RangeSliderInputState {
  minValue: number;
  maxValue: number;
  maxTempValue: number;
  values: number[];
}

const styles = {
  width: '300px',
  margin: '100px auto',
};
export default class RangeSliderInput extends React.Component<RangeSliderInputProps, RangeSliderInputState> {
  state = {
    minValue: 0,
    maxValue: 1000,
    values: [0, 10],
    maxTempValue: -1,
  };

  updateMinValue = (proposedMinValue: number) => {
    const { values, maxValue } = this.state;
    const maxPos = values[1] * 100 / maxValue;
    const minPos = proposedMinValue * 100 / maxValue;
    if (maxPos - minPos > 12) {
      this.setState(state => ({ values: [proposedMinValue, state.values[1]], maxTempValue: -1 }));
    } else {
      this.setState(state => ({
        maxTempValue: -1,
        values: [Math.ceil(state.values[1] - state.maxValue * 12 / 100), state.values[1]],
      }));
    }
  };

  updateMaxValue = (proposedMaxValue: number) => {
    const { values, maxValue } = this.state;
    const maxPos = proposedMaxValue * 100 / maxValue;
    const minPos = values[0] * 100 / maxValue;
    if (maxPos - minPos > 12) {
      this.setState(state => ({ values: [state.values[0], proposedMaxValue] }));
    } else {
      this.setState(state => ({
        values: [state.values[0], Math.floor(state.values[0] + state.maxValue * 12 / 100)],
      }));
      this.setState({ maxTempValue: proposedMaxValue });
    }
  };

  handleMinValueUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const minValue = parseInt(event.target.value, 10);
    if (Number.isNaN(minValue)) {
      this.setState(state => ({ values: [state.minValue, state.values[1]] }));
    } else {
      this.updateMinValue(minValue);
    }
  };

  handleMaxValueUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (value > this.state.maxValue) {
      this.setState(state => ({ values: [state.values[0], state.maxValue] }));
    } else if (Number.isNaN(value)) {
      this.setState(state => ({ values: [state.values[0], state.maxValue] }));
    } else {
      this.updateMaxValue(value);
    }
  };

  handleMaxTempValueUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const tempValue = parseInt(event.target.value, 10);
    this.setState({ maxTempValue: !Number.isNaN(tempValue) ? tempValue : 0 }, () => {
      if (this.state.maxTempValue > this.state.values[0] + this.state.maxValue * 12 / 100) {
        const maxTempValue = this.state.maxTempValue;
        this.setState({
          maxTempValue: -1,
          values: [this.state.values[0], maxTempValue],
        });
        if (this.state.maxTempValue >= this.state.maxValue) {
          this.setState({ maxTempValue: -1 });
        }
      }
    });
  };

  handleFilterUpdate = (data: { values: number[] }) => {
    const { values } = data;
    this.setState({ values });
  };

  render() {
    const maxValueTempMode = this.state.maxTempValue > -1;
    return (
      <div style={styles}>
        <p> Max Temp: {this.state.maxTempValue} </p>
        <p> State Max: {this.state.values[1]} </p>
        <input type="text" value={this.state.values[0]} onChange={this.handleMinValueUpdate} />
        <input
          type="text"
          value={maxValueTempMode ? this.state.maxTempValue : this.state.values[1]}
          onChange={maxValueTempMode ? this.handleMaxTempValueUpdate : this.handleMaxValueUpdate}
        />
        <RangeSlider
          min={this.state.minValue}
          max={this.state.maxValue}
          values={this.state.values}
          onValuesUpdated={this.handleFilterUpdate}
        />
      </div>
    );
  }
}
