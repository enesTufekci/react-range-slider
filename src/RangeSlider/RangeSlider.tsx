// tslint:disable:no-console
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import styled from 'styled-components';

import { killEvent, killReactEvent, getPosition, addEventListeners, removeEventListeners } from './utils';

import Handle from './components/Handle';
import Background from './components/Background';
import ProgressBar from './components/ProgressBar';

const SliderConstants = {
  PERCENT_FULL: 100,
  PERCENT_EMPTY: 0,
};

interface ReactMouseEvent extends React.MouseEvent<HTMLButtonElement> {}
interface ReactTouchEvent extends React.TouchEvent<HTMLButtonElement> {}

interface RangeSliderProps {
  // handle?: React.SFC;
  // background?: React.SFC;
  // progressBar?: React.SFC;
  values?: (number | string)[] | number[] | undefined;
  min?: number;
  max?: number;
  getNextHandlePosition?: Function;
  onSliderDragEnd?: Function;
  onValuesUpdated?: Function;
  onAfterSet?: Function;
  disabled?: boolean;
}

interface RangeSliderDefaultProps {
  values?: number[];
  min?: number;
  max?: number;
}

interface RangeSliderPublicState {
  min?: number;
  max?: number;
  values?: number[];
  disabled?: boolean;
}

interface RangeSliderState {
  handleClientWidth: number;
  sliderBox: { left: number; width: number };
  slidingIndex: number;
  handlePosition: number[];
  values: number[];
  disabled: boolean;
  maxPossibleValue: number;
  minPossibleValue: number;
  inputUpdate: boolean;
}

type RangeSliderPropsWithDefaults = RangeSliderProps & RangeSliderDefaultProps;

const RangeSliderContainer = styled.div`
  width: 100%;
  position: relative;
  height: 24px;
`;

class RangeSlider extends React.Component<RangeSliderProps, RangeSliderState> {
  static defaultProps: RangeSliderPropsWithDefaults = {
    values: [0, 50],
    min: 0,
    max: 100,
    disabled: false,
  };

  constructor(props: RangeSliderProps) {
    super(props);

    const { min, max, values, disabled } = this.props;
    const maxPossibleValue = max || 100;
    const minPossibleValue = min || 0;
    const validValues = this.validateValues(values || [0, 100], minPossibleValue, maxPossibleValue);
    this.state = {
      handlePosition: validValues.map(value => getPosition(value, minPossibleValue, maxPossibleValue)),
      handleClientWidth: 0,
      sliderBox: { left: 0, width: 0 },
      slidingIndex: -1,
      values: validValues,
      disabled: !!disabled,
      maxPossibleValue,
      minPossibleValue,
      inputUpdate: false,
    };
  }

  componentWillReceiveProps(nextProps: RangeSliderProps) {
    if (this.state.slidingIndex === -1) {
      const { minPossibleValue, maxPossibleValue } = this.state;
      const nextValues = nextProps.values || this.state.values;
      const nextValuesValidated = nextValues.map(value => {
        if (typeof value === 'string') {
          return parseInt(value, 10);
        }
        return value;
      });
      const updatedValueIndex = this.getUpdatedValueIndex(nextValuesValidated);
      if (updatedValueIndex !== null) {
        const position = getPosition(nextValuesValidated[updatedValueIndex], minPossibleValue, maxPossibleValue);
        this.slideTo(updatedValueIndex, position);
      }
    }
  }

  // getHandlePositionFromValues = () => {};

  getUpdatedValueIndex = (nextValuesValidated: number[]) => {
    const { values } = this.state;
    return values[0] !== nextValuesValidated[0] ? 0 : values[1] !== nextValuesValidated[1] ? 1 : null;
  };

  validateValues = (values: (number | string)[], min: number, max: number) => {
    return values.map((value, index) => {
      if (value === '' || value === null || value === undefined) {
        return index === 0 ? min : max;
      }
      if (typeof value === 'string') {
        return parseInt(value, 10);
      }
      return value;
    });
  };

  getPublicState = (): RangeSliderPublicState => {
    const { min, max } = this.props;
    const { values } = this.state;
    return { max, min, values };
  };

  getSliderBoundingBox = (): { left: number; width: number } => {
    const node = ReactDOM.findDOMNode(this.refs.sliderContainer);
    const rect = node.getBoundingClientRect();
    return {
      left: rect.left,
      width: rect.width || node.clientWidth,
    };
  };

  getMinValue(slidingHandleIndex: number) {
    const { min } = this.props;
    const { values } = this.state;
    return values[slidingHandleIndex - 1] ? Math.max(min || 0, values[slidingHandleIndex - 1]) : min;
  }

  getMaxValue = (slidingHandleIndex: number) => {
    const { max } = this.props;
    const { values } = this.state;
    return values[slidingHandleIndex + 1] ? Math.min(max || 100, values[slidingHandleIndex + 1]) : max;
  };

  getHandleClientWidth = (event: ReactMouseEvent | ReactTouchEvent): number => {
    const handleNode = event.currentTarget || null;
    if (!handleNode) {
      return 0;
    }
    return handleNode.clientWidth;
  };

  userAdjustPosition(slidingHandleIndex: number, proposedPosition: number): number {
    const { getNextHandlePosition } = this.props;
    let nextPosition = proposedPosition;
    if (getNextHandlePosition) {
      nextPosition = parseFloat(getNextHandlePosition(slidingHandleIndex, proposedPosition));
      if (
        Number.isNaN(nextPosition) ||
        nextPosition < SliderConstants.PERCENT_EMPTY ||
        nextPosition > SliderConstants.PERCENT_FULL
      ) {
        throw new TypeError(
          'getNextHandlePosition returned invalid position. Valid positions are floats between 0 and 100',
        );
      }
    }

    return nextPosition;
  }

  validatePosition(slidingHandleIndex: number, proposedPosition: number): number {
    const { handlePosition } = this.state;

    const nextPosition = this.userAdjustPosition(slidingHandleIndex, proposedPosition);

    return Math.max(
      Math.min(
        nextPosition,
        handlePosition[slidingHandleIndex + 1] !== undefined
          ? handlePosition[slidingHandleIndex + 1] - this.state.handleClientWidth / 2
          : SliderConstants.PERCENT_FULL,
      ),
      handlePosition[slidingHandleIndex - 1] !== undefined
        ? handlePosition[slidingHandleIndex - 1] + this.state.handleClientWidth / 2
        : SliderConstants.PERCENT_EMPTY,
    );
  }

  getNextState(slidingHandleIndex: number, proposedPosition: number): { handlePosition: number[]; values: number[] } {
    const { handlePosition } = this.state;
    const actualPosition = this.validatePosition(slidingHandleIndex, proposedPosition);
    const nextHandlePosition = handlePosition.map(
      (pos, index) => (index === slidingHandleIndex ? actualPosition : pos),
    );

    return {
      handlePosition: nextHandlePosition,
      values: this.calculateValues(nextHandlePosition),
    };
  }

  calculateValues = (handlePosition: number[]) => {
    const { maxPossibleValue, minPossibleValue } = this.state;
    return [
      Math.max(minPossibleValue, Math.floor(handlePosition[0] * maxPossibleValue / 100)),
      Math.min(maxPossibleValue, Math.ceil(handlePosition[1] * maxPossibleValue / 100)),
    ];
  };

  slideTo = (slidingHandleIndex: number, proposedPosition: number, cb?: Function): void => {
    const nextState = this.getNextState(slidingHandleIndex, proposedPosition);
    this.setState(nextState, () => (cb ? cb() : {}));
  };

  handleOnValuesUpdated = () => {
    const { onValuesUpdated } = this.props;
    if (onValuesUpdated) {
      const { values } = this.state;
      onValuesUpdated({
        values,
      });
    }
  };

  handleSlide = (clientX: number): void => {
    const { slidingIndex, sliderBox } = this.state;
    const slidingThreshold = this.state.handleClientWidth / 2 * (slidingIndex === 0 ? -1 : 1);
    const positionPercent: number =
      (clientX - sliderBox.left + slidingThreshold) / sliderBox.width * SliderConstants.PERCENT_FULL;

    this.slideTo(slidingIndex, positionPercent);
  };

  endSlide = () => {
    this.setState({ slidingIndex: -1 });
    removeEventListeners([
      ['mouseup', this.endSlide],
      ['touchend', this.endSlide],
      ['touchmove', this.handleTouchSlide],
      ['mousemove', this.handleMouseSlide],
    ]);
    this.handleOnValuesUpdated();
  };

  handleMouseSlide = (event: MouseEvent): void => {
    const { slidingIndex } = this.state;
    if (slidingIndex === -1) {
      return;
    }
    this.handleSlide(event.clientX);
    killEvent(event);
  };

  handleTouchSlide = (event: TouchEvent): void => {
    const { slidingIndex } = this.state;
    if (slidingIndex === -1) {
      return;
    }
    // stop sliding on multitouch
    if (event.changedTouches.length > 1) {
      this.endSlide();
      return;
    }

    const touch = event.changedTouches[0];

    this.handleSlide(touch.clientX);
    killEvent(event);
  };

  setStartSlide = (slidingIndex: number, handleClientWidth: number, x?: number): void => {
    const sliderBox = this.getSliderBoundingBox();
    this.setState({
      handleClientWidth,
      sliderBox,
      slidingIndex,
    });
  };

  startMouseSlide = (slidingIndex: number) => (event: ReactMouseEvent) => {
    this.setStartSlide(slidingIndex, this.getHandleClientWidth(event));
    if (typeof document.addEventListener === 'function') {
      addEventListeners([['mousemove', this.handleMouseSlide], ['mouseup', this.endSlide]]);
    }
    killReactEvent(event);
  };

  startTouchSlide = (slidingIndex: number) => (event: ReactTouchEvent) => {
    if (event.changedTouches.length > 1) {
      return;
    }
    this.setStartSlide(slidingIndex, this.getHandleClientWidth(event));
    addEventListeners([['touchmove', this.handleTouchSlide], ['touchend', this.endSlide]]);
    killReactEvent(event);
  };

  getClosestHandle(positionPercent: number): number {
    const { handlePosition } = this.state;

    return handlePosition.reduce((closestHandleIndex, node, HandleIndex) => {
      const challenger = Math.abs(handlePosition[HandleIndex] - positionPercent);
      const current = Math.abs(handlePosition[closestHandleIndex] - positionPercent);
      return challenger < current ? HandleIndex : closestHandleIndex;
    }, 0); // tslint:disable-line
  }

  handleSliderClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    const sliderBox = this.getSliderBoundingBox();
    const positionDecimal = (event.clientX - sliderBox.left) / sliderBox.width;
    const positionPercent = positionDecimal * SliderConstants.PERCENT_FULL;
    const handleId = this.getClosestHandle(positionPercent);
    this.slideTo(handleId, positionPercent, this.handleOnValuesUpdated);
  };

  render() {
    const { handlePosition, values, disabled } = this.state;
    return (
      // tslint:disable:jsx-no-string-ref
      <RangeSliderContainer ref="sliderContainer" onClick={this.handleSliderClick}>
        <Background />
        <ProgressBar style={{ width: `${handlePosition[1] - handlePosition[0]}%`, left: `${handlePosition[0]}%` }} />
        {values
          ? handlePosition.map((pos, index) => (
              <Handle
                aria-valuemax={this.getMaxValue(index)}
                aria-valuemin={this.getMinValue(index)}
                aria-valuenow={values[index]}
                aria-disabled={disabled}
                data-handle-key={index}
                onClick={killReactEvent}
                onMouseDown={this.startMouseSlide(index)}
                onTouchStart={this.startTouchSlide(index)}
                role="slider"
                key={`handle-${index}`}
                left={`calc(${pos}% - ${index * 24}px)`}
                tabIndex={index}
              />
            ))
          : ''}
      </RangeSliderContainer>
    );
  }
}

export default RangeSlider;
