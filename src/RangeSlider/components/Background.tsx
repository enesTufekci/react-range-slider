import * as React from 'react';
import styled from 'styled-components';

export const BackgroundDiv = styled.div`
  height: 2px;
  width: 100%;
  position: absolute;
  z-index: 
  left: 0;
  top: 10px;
  background-color: gray;
`;

interface BackgroundProps {}

const Background = (props: BackgroundProps) => <BackgroundDiv {...props} />;

export default Background;
