// tslint:disable:no-console
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import styled from 'styled-components';

import { killEvent, getValue, getPosition } from './utils';

import Handle from './components/Handle';
import Background from './components/Background';
import ProgressBar from './components/ProgressBar';

const SliderConstants = {
  PERCENT_FULL: 100,
  PERCENT_EMPTY: 0,
};

interface RangeSliderProps {
  // handle?: React.SFC;
  // background?: React.SFC;
  // progressBar?: React.SFC;
  values?: number[];
  min?: number;
  max?: number;
  getNextHandlePosition?: Function;
  onSliderDragEnd?: Function;
  onValuesUpdated?: Function;
  onAfterSet?: Function;
  disabled?: Boolean;
}

interface RangeSliderState {
  handleDimensions: number;
  // mousePos: { x, y },
  sliderBox: { left: number; width: number };
  slidingIndex: number;
  handlePos: number[];
  values: number[];
}

const RangeSliderContainer = styled.div`
  width: 100%;
  position: relative;
`;

class RangeSlider extends React.Component<RangeSliderProps, RangeSliderState> {
  public static defaultProps: RangeSliderProps = {
    values: [0, 100],
    min: 0,
    max: 100,
  };

  constructor(props: RangeSliderProps) {
    super(props);
    const { min, max, values } = this.props;
    this.state = {
      handlePos: values ? values.map(value => getPosition(value, min || 0, max || 100)) : [],
      handleDimensions: 0,
      // mousePos: null,
      sliderBox: { left: 0, width: 0 },
      slidingIndex: -1,
      values: values || [0, 100],
    };
  }

  getPublicState() {
    const { min, max } = this.props;
    const { values } = this.state;

    return { max, min, values };
  }

  handleTouchSlide(event: TouchEvent) {
    const { slidingIndex } = this.state;
    if (slidingIndex === null) {
      return;
    }

    if (event.changedTouches.length > 1) {
      this.endSlide();
      return;
    }

    const touch = event.changedTouches[0];

    this.handleSlide(touch.clientX);
    killEvent(event);
  }

  handleSlide = (x: number): void => {
    // const { onSliderDragMove } = this.props;
    const { slidingIndex, sliderBox } = this.state;
    const slidingKnobThreshold: number = slidingIndex === 0 ? -12 : 12;
    const positionPercent: number =
      (x - sliderBox.left + slidingKnobThreshold) / sliderBox.width * SliderConstants.PERCENT_FULL;

    this.slideTo(slidingIndex, positionPercent);
  };

  endSlide = () => {
    // const { onSliderDragEnd } = this.props;

    this.setState({ slidingIndex: -1 });

    if (typeof document.removeEventListener === 'function') {
      document.removeEventListener('mouseup', this.endSlide, false);
      document.removeEventListener('touchend', this.endSlide, false);
      document.removeEventListener('touchmove', this.handleTouchSlide, false);
      document.removeEventListener('mousemove', this.handleMouseSlide, false);
    }

    // if (onSliderDragEnd) {
    //   onSliderDragEnd();
    // }
  };

  getSliderBoundingBox = () => {
    const node = ReactDOM.findDOMNode(this.refs.sliderContainer);
    const rect = node.getBoundingClientRect();
    return {
      height: rect.height || node.clientHeight,
      left: rect.left,
      top: rect.top,
      width: rect.width || node.clientWidth,
    };
  };

  getProgressStyle(idx: number) {
    const { handlePos } = this.state;

    const value = handlePos[idx];

    if (idx === 0) {
      return orientation === 'vertical' ? { height: `${value}%`, top: 0 } : { left: 0, width: `${value}%` };
    }

    const prevValue = handlePos[idx - 1];
    const diffValue = value - prevValue;

    return { left: `${prevValue}%`, width: `${diffValue}%` };
  }

  getMinValue(idx: number) {
    const { min } = this.props;
    const { values } = this.state;
    // return values[idx - 1] ? Math.max(min, values[idx - 1]) : min;
    const minVal = values[idx - 1] ? Math.max(min || 0, values[idx - 1]) : min;
    return minVal;
  }

  getMaxValue(idx: number) {
    const { max } = this.props;
    const { values } = this.state;
    // return values[idx + 1] ? Math.min(max, values[idx + 1]) : max;
    return values[idx + 1] ? Math.min(max || 100, values[idx + 1]) : max;
  }

  getHandleDimensions = (event: React.MouseEvent<HTMLButtonElement>, sliderBox: { [key: string]: number }) => {
    const handleNode = event.currentTarget || null;

    if (!handleNode) {
      return 0;
    }

    return handleNode.clientWidth / sliderBox.width * SliderConstants.PERCENT_FULL / 2;
  };

  setStartSlide = (event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>, x: number) => {
    const sliderBox = this.getSliderBoundingBox();
    this.setState({
      handleDimensions: this.getHandleDimensions(event, sliderBox),
      // mousePos: { x, y },
      sliderBox,
      slidingIndex: Number(event.currentTarget.dataset.handleKey),
    });
  };

  userAdjustPosition(idx: number, proposedPosition: number) {
    const { getNextHandlePosition } = this.props;
    let nextPosition = proposedPosition;
    if (getNextHandlePosition) {
      nextPosition = parseFloat(getNextHandlePosition(idx, proposedPosition));

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

  validatePosition(idx: number, proposedPosition: number) {
    const { handlePos } = this.state;

    const nextPosition = this.userAdjustPosition(idx, proposedPosition);
    return Math.max(
      Math.min(nextPosition, handlePos[idx + 1] !== undefined ? handlePos[idx + 1] - 12 : SliderConstants.PERCENT_FULL),
      handlePos[idx - 1] !== undefined ? handlePos[idx - 1] + 12 : SliderConstants.PERCENT_EMPTY,
    );
  }

  getNextState(idx: number, proposedPosition: number) {
    const { handlePos } = this.state;
    const { max, min } = this.props;

    const actualPosition = this.validatePosition(idx, proposedPosition);

    const nextHandlePos = handlePos.map((pos, index) => (index === idx ? actualPosition : pos));

    return {
      handlePos: nextHandlePos,
      values: nextHandlePos.map((pos: number) => getValue(pos, min || 0, max || SliderConstants.PERCENT_FULL)),
    };
  }

  slideTo = (idx: number, proposedPosition: number) => {
    const nextState = this.getNextState(idx, proposedPosition);

    this.setState(nextState, () => {
      const { onValuesUpdated } = this.props;
      if (onValuesUpdated) {
        onValuesUpdated(this.getPublicState());
      }
    });
  };

  handleMouseSlide = (event: MouseEvent) => {
    const { slidingIndex } = this.state;
    if (slidingIndex === -1) {
      return;
    }
    this.handleSlide(event.clientX);
    killEvent(event);
  };

  startMouseSlide = (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setStartSlide(event, event.clientX);

    if (typeof document.addEventListener === 'function') {
      document.addEventListener('mousemove', this.handleMouseSlide, false);
      document.addEventListener('mouseup', this.endSlide, false);
    }

    // killEvent(event);
  };

  startTouchSlide(event: React.TouchEvent<HTMLButtonElement>) {
    // const { onSliderDragStart } = this.props;

    // if (event.changedTouches.length > 1) return;

    const touch = event.changedTouches[0];

    this.setStartSlide(event, touch.clientX);

    document.addEventListener('touchmove', this.handleTouchSlide, false);
    document.addEventListener('touchend', this.endSlide, false);

    // if (onSliderDragStart) onSliderDragStart();

    // killEvent(event);
  }

  render() {
    const { handlePos, values /* disabled */ } = this.state;
    return (
      // tslint:disable-next-line:jsx-no-string-ref
      <RangeSliderContainer ref="sliderContainer">
        <Background />
        <ProgressBar style={{ width: `${handlePos[1] - handlePos[0]}%`, left: `${handlePos[0]}%` }} />
        {values
          ? handlePos.map((pos, index) => (
              <Handle
                aria-valuemax={this.getMaxValue(index)}
                aria-valuemin={this.getMinValue(index)}
                aria-valuenow={values[index]}
                // aria-disabled={disabled}
                data-handle-key={index}
                // onClick={() => killEvent() }
                // onKeyDown={!disabled ? this.handleKeydown : undefined}
                onMouseDown={event => {
                  return this.startMouseSlide(event);
                }}
                // onTouchStart={!disabled ? this.startTouchSlide : undefined}
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
