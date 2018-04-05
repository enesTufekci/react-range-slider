import * as React from 'react';
import styled from 'styled-components';

export const ProgressBarDiv = styled.div`
  height: 2px;
  width: calc(100% - 48px);
  position: absolute;
  z-index: 1;
  left: 24px;
  top: 10px;
  background-color: orange;
`;

interface ProgressBarProps {
  style: { left: string; width: string };
}

const ProgressBar = (props: ProgressBarProps) => <ProgressBarDiv {...props} />;

export default ProgressBar;
